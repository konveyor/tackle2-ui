/**
 * ACP (Agent Client Protocol) session over WebSocket — browser-safe.
 *
 * Ported from editor-extensions-cluster-agent's ClusterAcpSession, minus
 * vscode/winston/node deps. Instead of @agentclientprotocol/sdk (whose core
 * client pulls in zod schema validation), this speaks the same wire protocol
 * directly: JSON-RPC 2.0 text frames with id-correlated requests in BOTH
 * directions, notifications, and error objects. Method names mirror the
 * SDK's `acp.methods` exactly:
 *
 *   client -> agent: initialize, session/new, session/load, session/prompt
 *   client -> agent (notification): session/cancel
 *   agent -> client (notification): session/update
 *   agent -> client (request): session/request_permission
 *
 * Browser constraints honored:
 * - Default socket is `new globalThis.WebSocket(url)` with NO custom headers
 *   (browsers cannot set them; the hub-shim injects X-Secret-Key upstream).
 * - Ping/pong liveness runs ONLY when the socket exposes `.ping` (node ws);
 *   browser sockets skip it.
 * - A caller may inject a WebSocketFactory (e.g. node ws preconfigured with
 *   an X-Secret-Key header) — the factory owns header injection.
 */

/** ACP protocol version this client speaks (mirrors the SDK's PROTOCOL_VERSION). */
export const PROTOCOL_VERSION = 1;

const HEARTBEAT_INTERVAL_MS = 10_000;
const DEFAULT_CWD = "/workspace";

// ------------------------------------------------------------------ types

/** Pass-through of an ACP session/update payload (params.update). */
export type SessionUpdate = { sessionUpdate: string; [k: string]: unknown };

/**
 * A file modification from a ToolCallContent {type:"diff"} block
 * (standard ACP shape: path + oldText/newText; oldText null = new file).
 */
export type ToolCallDiff = {
  path: string;
  oldText?: string | null;
  newText: string;
};

/** An agent -> client session/request_permission ask. */
export type PermissionRequest = {
  sessionId: string;
  toolCall?: { toolCallId?: string; title?: string; diffs?: ToolCallDiff[] };
  options: { optionId: string; name: string; kind: string }[];
};

/** Shape of the session/request_permission response payload. */
export interface PermissionOutcome {
  outcome: { outcome: string; optionId?: string };
}

export interface AcpSessionCallbacks {
  onUpdate?(u: SessionUpdate): void;
  /**
   * Human-in-the-loop approval. Return {outcome:{outcome:"selected",
   * optionId}} or {outcome:{outcome:"cancelled"}}. When absent, permission
   * asks are answered "cancelled" (never silently approved).
   */
  onPermissionRequest?(
    r: PermissionRequest
  ): Promise<PermissionOutcome> | PermissionOutcome;
}

/**
 * Returns a browser-compatible WebSocket instance for the url: native
 * WebSocket in browsers; in node, callers may return a 'ws' instance
 * preconfigured with headers (e.g. X-Secret-Key). The returned object only
 * needs send/close plus addEventListener or on.
 */
export type WebSocketFactory = (url: string) => unknown;

export type AcpLogger = Pick<Console, "info" | "warn" | "error" | "debug">;

export interface AcpConnectOptions {
  url: string;
  /**
   * Informational only on the default (browser) path — browsers cannot set
   * WebSocket headers, so the transport shim injects X-Secret-Key
   * server-side. If you pass a webSocketFactory, the factory owns header
   * injection (close over the key when building it).
   */
  secretKey?: string;
  webSocketFactory?: WebSocketFactory;
  callbacks?: AcpSessionCallbacks;
  logger?: AcpLogger;
}

// ------------------------------------------------- WebSocket normalization

/** Structural view over browser WebSocket and node 'ws'. */
interface WsLike {
  readyState?: number;
  send(data: string): void;
  close(code?: number, reason?: string): void;
  addEventListener?(type: string, listener: (...args: never[]) => void): void;
  on?(event: string, listener: (...args: never[]) => void): void;
  ping?(): void;
  terminate?(): void;
}

const WS_OPEN = 1;

type AnyListener = (...args: unknown[]) => void;

function subscribe(socket: WsLike, event: string, listener: AnyListener): void {
  // Both browser WebSocket and node 'ws' implement addEventListener for
  // open/message/close/error; 'pong' exists only on node ws via .on().
  if (event !== "pong" && typeof socket.addEventListener === "function") {
    socket.addEventListener(event, listener as never);
  } else if (typeof socket.on === "function") {
    socket.on(event, listener as never);
  }
}

// ---------------------------------------------------------------- JSON-RPC

interface PendingRequest {
  method: string;
  resolve: (value: unknown) => void;
  reject: (reason: Error) => void;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

/** Extracts {type:"diff"} blocks from a ToolCallUpdate.content array. */
function parseToolCallDiffs(content: unknown): ToolCallDiff[] | undefined {
  if (!Array.isArray(content)) return undefined;
  const diffs: ToolCallDiff[] = [];
  for (const block of content) {
    if (!isRecord(block) || block.type !== "diff") continue;
    if (typeof block.path !== "string" || typeof block.newText !== "string")
      continue;
    diffs.push({
      path: block.path,
      oldText: typeof block.oldText === "string" ? block.oldText : null,
      newText: block.newText,
    });
  }
  return diffs.length > 0 ? diffs : undefined;
}

interface InitializeResult {
  protocolVersion?: number;
  agentCapabilities?: { loadSession?: boolean; [k: string]: unknown };
  [k: string]: unknown;
}

const NOOP_LOGGER: AcpLogger = { info() {}, warn() {}, error() {}, debug() {} };

// ------------------------------------------------------------- AcpSession

/**
 * A live, connected ACP session. Create with AcpSession.connect(); then
 * newSession() or loadSession() before prompt().
 */
export class AcpSession {
  private readonly socket: WsLike;
  private readonly callbacks: AcpSessionCallbacks;
  private readonly logger: AcpLogger;

  private readonly pending = new Map<number | string, PendingRequest>();
  private nextId = 1;

  private _sessionId: string | null = null;
  private _loadSessionSupported = false;
  private promptActive = false;
  private closed = false;
  private explicitlyClosed = false;

  private pingTimer: ReturnType<typeof setInterval> | null = null;

  private openPromise: Promise<void>;
  private resolveOpen: (() => void) | null = null;
  private rejectOpen: ((err: Error) => void) | null = null;
  private lastSocketError: Error | null = null;

  private constructor(
    socket: WsLike,
    callbacks: AcpSessionCallbacks,
    logger: AcpLogger
  ) {
    this.socket = socket;
    this.callbacks = callbacks;
    this.logger = logger;

    this.openPromise = new Promise<void>((resolve, reject) => {
      this.resolveOpen = resolve;
      this.rejectOpen = reject;
    });
    this.openPromise.catch(() => undefined); // avoid unhandled rejection

    subscribe(socket, "open", () => {
      this.resolveOpen?.();
      this.resolveOpen = null;
      this.rejectOpen = null;
    });
    subscribe(socket, "message", (...args: unknown[]) => {
      void this.handleMessageEvent(args);
    });
    subscribe(socket, "error", (...args: unknown[]) => {
      const err = extractError(args);
      this.lastSocketError = err;
      this.logger.warn(`AcpSession: socket error: ${err.message}`);
      // Don't tear down here: a close event always follows an error.
      this.rejectOpen?.(err);
      this.rejectOpen = null;
      this.resolveOpen = null;
    });
    subscribe(socket, "close", (...args: unknown[]) => {
      const { code, reason } = extractClose(args);
      const detail = `code ${code ?? "?"}${reason ? `: ${reason}` : ""}`;
      const err =
        this.lastSocketError ?? new Error(`ACP connection closed (${detail})`);
      this.rejectOpen?.(err);
      this.rejectOpen = null;
      this.resolveOpen = null;
      this.teardown(err);
    });
  }

  /**
   * Opens the socket (default: `new globalThis.WebSocket(url)`, no custom
   * headers) and performs ACP initialize; loadSessionSupported is read from
   * the agent's advertised capabilities.
   */
  static async connect(opts: AcpConnectOptions): Promise<AcpSession> {
    const logger = opts.logger ?? NOOP_LOGGER;
    const raw: unknown = opts.webSocketFactory
      ? opts.webSocketFactory(opts.url)
      : new globalThis.WebSocket(opts.url);
    if (
      !isRecord(raw) ||
      typeof (raw as unknown as WsLike).send !== "function"
    ) {
      throw new Error(
        "AcpSession.connect: webSocketFactory must return a WebSocket-like object"
      );
    }
    const socket = raw as unknown as WsLike;
    const session = new AcpSession(socket, opts.callbacks ?? {}, logger);
    if (socket.readyState !== WS_OPEN) {
      await session.openPromise;
    }
    session.startHeartbeat();
    logger.info(`AcpSession: connected ${opts.url}, initializing`);
    const initialized = await session.request<InitializeResult>("initialize", {
      protocolVersion: PROTOCOL_VERSION,
      clientCapabilities: {},
    });
    session._loadSessionSupported =
      initialized?.agentCapabilities?.loadSession === true;
    logger.info(
      `AcpSession: initialized protocol v${initialized?.protocolVersion ?? "?"}, ` +
        `loadSession=${session._loadSessionSupported}`
    );
    return session;
  }

  get sessionId(): string | null {
    return this._sessionId;
  }

  get loadSessionSupported(): boolean {
    return this._loadSessionSupported;
  }

  isPromptActive(): boolean {
    return this.promptActive;
  }

  /** Start a fresh session in the sandbox workspace. */
  async newSession(): Promise<string> {
    const res = await this.request<{ sessionId: string }>("session/new", {
      cwd: DEFAULT_CWD,
      mcpServers: [],
    });
    this._sessionId = res.sessionId;
    return res.sessionId;
  }

  /** Attach to an existing session; the agent replays history as updates. */
  async loadSession(id: string): Promise<void> {
    await this.request("session/load", {
      sessionId: id,
      cwd: DEFAULT_CWD,
      mcpServers: [],
    });
    this._sessionId = id;
  }

  /** Send a prompt turn; resolves with the stop reason (e.g. "end_turn"). */
  async prompt(text: string): Promise<string> {
    if (!this._sessionId) {
      throw new Error(
        "AcpSession: no active session — call newSession() or loadSession() first"
      );
    }
    this.promptActive = true;
    try {
      // No client-side timeout: agent turns can be long; the promise settles
      // on the agent's response or on connection close.
      const res = await this.request<{ stopReason: string }>("session/prompt", {
        sessionId: this._sessionId,
        prompt: [{ type: "text", text }],
      });
      return res.stopReason;
    } finally {
      this.promptActive = false;
    }
  }

  /** Cancel the in-flight turn (notification; the prompt settles separately). */
  async cancel(): Promise<void> {
    if (this._sessionId && !this.closed) {
      this.notify("session/cancel", { sessionId: this._sessionId });
    }
  }

  /** Close the connection; pending requests reject. Idempotent. */
  async close(): Promise<void> {
    this.explicitlyClosed = true;
    try {
      this.socket.close(1000, "client closed");
    } catch {
      // already closed/never opened
    }
    this.teardown(new Error("ACP session closed by client"));
  }

  /**
   * Registers a callback for when the connection drops (socket close, pod
   * restart, tunnel death). NOT fired by an explicit close(). Fires at most
   * once, after registration, even if already closed.
   */
  onClosed(cb: () => void): void {
    if (this.closed) {
      if (!this.explicitlyClosed) cb();
      return;
    }
    this.closedCallbacks.push(cb);
  }

  private closedCallbacks: (() => void)[] = [];

  // ------------------------------------------------------------ internals

  private request<T>(method: string, params: unknown): Promise<T> {
    if (this.closed) {
      return Promise.reject(
        new Error(`AcpSession: cannot send ${method}, connection is closed`)
      );
    }
    const id = this.nextId++;
    return new Promise<T>((resolve, reject) => {
      this.pending.set(id, {
        method,
        resolve: resolve as (value: unknown) => void,
        reject,
      });
      try {
        this.sendRaw({ jsonrpc: "2.0", id, method, params });
      } catch (err) {
        this.pending.delete(id);
        reject(err instanceof Error ? err : new Error(String(err)));
      }
    });
  }

  private notify(method: string, params: unknown): void {
    this.sendRaw({ jsonrpc: "2.0", method, params });
  }

  private sendRaw(message: Record<string, unknown>): void {
    this.socket.send(JSON.stringify(message));
  }

  private async handleMessageEvent(args: unknown[]): Promise<void> {
    if (this.closed) return;
    const first = args[0];
    // Browser/ws addEventListener hand a MessageEvent ({data}); node ws .on
    // hands (data, isBinary).
    const raw =
      isRecord(first) && "data" in first
        ? (first as { data: unknown }).data
        : first;
    const text = await toText(raw);
    if (text === undefined) {
      this.logger.warn("AcpSession: ignoring non-text WebSocket frame");
      return;
    }
    this.dispatch(text);
  }

  private dispatch(text: string): void {
    let msg: unknown;
    try {
      msg = JSON.parse(text);
    } catch {
      this.logger.warn(
        `AcpSession: ignoring malformed JSON frame: ${text.slice(0, 120)}`
      );
      return;
    }
    if (!isRecord(msg) || msg.jsonrpc !== "2.0") {
      this.logger.warn("AcpSession: ignoring non-JSON-RPC message");
      return;
    }
    const id = msg.id as number | string | null | undefined;
    const method = msg.method;
    if (typeof method === "string") {
      if (id === undefined || id === null) {
        this.handleNotification(method, msg.params);
      } else {
        void this.handleServerRequest(id, method, msg.params);
      }
    } else if (id !== undefined && id !== null) {
      this.settle(id, msg);
    } else {
      this.logger.debug(
        "AcpSession: ignoring message with neither method nor id"
      );
    }
  }

  private handleNotification(method: string, params: unknown): void {
    if (method === "session/update") {
      const update = isRecord(params) ? params.update : undefined;
      if (isRecord(update) && typeof update.sessionUpdate === "string") {
        try {
          this.callbacks.onUpdate?.(update as SessionUpdate);
        } catch (err) {
          this.logger.error(
            `AcpSession: onUpdate callback threw: ${err instanceof Error ? err.message : String(err)}`
          );
        }
      } else {
        this.logger.debug(
          "AcpSession: session/update without a usable update payload"
        );
      }
      return;
    }
    this.logger.debug(`AcpSession: ignoring notification ${method}`);
  }

  private async handleServerRequest(
    id: number | string,
    method: string,
    params: unknown
  ): Promise<void> {
    if (method !== "session/request_permission") {
      this.respondError(id, -32601, `Method not found: ${method}`);
      return;
    }
    const p = isRecord(params) ? params : {};
    const toolCall = isRecord(p.toolCall)
      ? {
          toolCallId:
            typeof p.toolCall.toolCallId === "string"
              ? p.toolCall.toolCallId
              : undefined,
          title:
            typeof p.toolCall.title === "string" ? p.toolCall.title : undefined,
          diffs: parseToolCallDiffs(p.toolCall.content),
        }
      : undefined;
    const options = Array.isArray(p.options)
      ? p.options.filter(isRecord).map((o) => ({
          optionId: String(o.optionId ?? ""),
          name: String(o.name ?? ""),
          kind: String(o.kind ?? ""),
        }))
      : [];
    const request: PermissionRequest = {
      sessionId: typeof p.sessionId === "string" ? p.sessionId : "",
      toolCall,
      options,
    };
    try {
      const result: PermissionOutcome = this.callbacks.onPermissionRequest
        ? await this.callbacks.onPermissionRequest(request)
        : { outcome: { outcome: "cancelled" } };
      if (!this.closed) {
        this.sendRaw({ jsonrpc: "2.0", id, result });
      }
    } catch (err) {
      this.logger.error(
        `AcpSession: onPermissionRequest threw: ${err instanceof Error ? err.message : String(err)}`
      );
      this.respondError(
        id,
        -32603,
        err instanceof Error ? err.message : "permission handler failed"
      );
    }
  }

  private respondError(
    id: number | string,
    code: number,
    message: string
  ): void {
    if (this.closed) return;
    try {
      this.sendRaw({ jsonrpc: "2.0", id, error: { code, message } });
    } catch {
      // socket died mid-response; teardown handles pending state
    }
  }

  private settle(id: number | string, msg: Record<string, unknown>): void {
    const entry = this.pending.get(id);
    if (!entry) {
      this.logger.debug(
        `AcpSession: response for unknown request id ${String(id)}`
      );
      return;
    }
    this.pending.delete(id);
    const error = msg.error;
    if (isRecord(error)) {
      const code = typeof error.code === "number" ? error.code : undefined;
      const message =
        typeof error.message === "string" ? error.message : "unknown error";
      const err = new Error(
        `ACP ${entry.method} failed: ${message}${code !== undefined ? ` (code ${code})` : ""}`
      );
      Object.assign(err, { code, data: error.data });
      entry.reject(err);
    } else {
      entry.resolve(msg.result);
    }
  }

  /**
   * Ping/pong liveness — node 'ws' only (browser sockets have no .ping;
   * half-open detection is left to the browser/network stack). A missed
   * pong across one interval means the far side is gone: terminate so
   * 'close' fires and reconnect logic can take over.
   */
  private startHeartbeat(): void {
    if (
      typeof this.socket.ping !== "function" ||
      typeof this.socket.on !== "function"
    ) {
      return;
    }
    let alive = true;
    subscribe(this.socket, "pong", () => {
      alive = true;
    });
    this.pingTimer = setInterval(() => {
      if (this.closed) {
        this.stopHeartbeat();
        return;
      }
      if (!alive) {
        this.logger.warn(
          "AcpSession: missed pong, terminating dead connection"
        );
        if (typeof this.socket.terminate === "function") {
          this.socket.terminate();
        } else {
          this.socket.close();
        }
        return;
      }
      alive = false;
      this.socket.ping?.();
    }, HEARTBEAT_INTERVAL_MS);
  }

  private stopHeartbeat(): void {
    if (this.pingTimer !== null) {
      clearInterval(this.pingTimer);
      this.pingTimer = null;
    }
  }

  private teardown(err: Error): void {
    if (this.closed) return;
    this.closed = true;
    this.stopHeartbeat();
    for (const [, entry] of this.pending) {
      entry.reject(
        new Error(`ACP ${entry.method} did not complete: ${err.message}`)
      );
    }
    this.pending.clear();
    if (!this.explicitlyClosed) {
      for (const cb of this.closedCallbacks.splice(0)) {
        try {
          cb();
        } catch (cbErr) {
          this.logger.error(
            `AcpSession: onClosed callback threw: ${cbErr instanceof Error ? cbErr.message : String(cbErr)}`
          );
        }
      }
    }
    this.closedCallbacks = [];
  }
}

// ---------------------------------------------------------------- helpers

async function toText(raw: unknown): Promise<string | undefined> {
  if (typeof raw === "string") return raw;
  if (raw instanceof ArrayBuffer) return new TextDecoder().decode(raw);
  if (ArrayBuffer.isView(raw)) return new TextDecoder().decode(raw);
  if (typeof Blob !== "undefined" && raw instanceof Blob) return raw.text();
  // node ws can deliver fragmented messages as an array of buffers
  if (
    Array.isArray(raw) &&
    raw.length > 0 &&
    raw.every((c) => ArrayBuffer.isView(c))
  ) {
    const decoder = new TextDecoder();
    return (
      raw
        .map((c) => decoder.decode(c as ArrayBufferView, { stream: true }))
        .join("") + decoder.decode()
    );
  }
  return undefined;
}

function extractError(args: unknown[]): Error {
  const first = args[0];
  if (first instanceof Error) return first;
  if (isRecord(first)) {
    // browser ErrorEvent / ws ErrorEvent both may carry .message or .error
    const inner = first.error;
    if (inner instanceof Error) return inner;
    if (typeof first.message === "string" && first.message)
      return new Error(first.message);
  }
  return new Error("WebSocket error");
}

function extractClose(args: unknown[]): { code?: number; reason?: string } {
  const first = args[0];
  if (typeof first === "number") {
    // node ws .on("close", (code, reason: Buffer) => ...)
    const second = args[1];
    const reason =
      typeof second === "string"
        ? second
        : ArrayBuffer.isView(second)
          ? new TextDecoder().decode(second)
          : undefined;
    return { code: first, reason };
  }
  if (isRecord(first)) {
    // CloseEvent (browser + ws addEventListener)
    return {
      code: typeof first.code === "number" ? first.code : undefined,
      reason: typeof first.reason === "string" ? first.reason : undefined,
    };
  }
  return {};
}
