/**
 * ACP (Agent Client Protocol) session over WebSocket — browser-only.
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
 * Plus one goose extension, relayed onto the run's own connection by the
 * harness tee (agentic-controller#96) when steering is enabled there:
 *
 *   client -> agent: _goose/unstable/session/steer — queue a message into
 *   the session's ACTIVE turn (needs the run id goose announces as
 *   `_meta.goose.activeRunId` on a session_info_update); the pickup streams
 *   back as a user_message_chunk flagged `_meta.goose.steer`.
 *
 * The socket is always `new WebSocket(url)` with no custom headers —
 * browsers cannot set them; the hub-shim injects X-Secret-Key upstream.
 */

/** ACP protocol version this client speaks (mirrors the SDK's PROTOCOL_VERSION). */
export const PROTOCOL_VERSION = 1;

const DEFAULT_CWD = "/workspace";

/** goose's mid-turn redirect request (relayed by the harness tee). */
export const STEER_METHOD = "_goose/unstable/session/steer";

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

/** Result of a steer: the run it landed in and the queued message's id. */
export interface SteerResult {
  runId: string;
  messageId: string;
}

export interface AcpSessionCallbacks {
  /**
   * A session/update notification. `sessionId` is the session it belongs
   * to — through the harness tee a viewer sees the RUN's session as well
   * as its own, and the two must not be confused.
   */
  onUpdate?(u: SessionUpdate, sessionId: string): void;
  /**
   * Human-in-the-loop approval. Return {outcome:{outcome:"selected",
   * optionId}} or {outcome:{outcome:"cancelled"}}. When absent, permission
   * asks are answered "cancelled" (never silently approved).
   */
  onPermissionRequest?(
    r: PermissionRequest
  ): Promise<PermissionOutcome> | PermissionOutcome;
}

export type AcpLogger = Pick<Console, "info" | "warn" | "error" | "debug">;

export interface AcpConnectOptions {
  url: string;
  callbacks?: AcpSessionCallbacks;
  logger?: AcpLogger;
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
  private readonly socket: WebSocket;
  private readonly callbacks: AcpSessionCallbacks;
  private readonly logger: AcpLogger;

  private readonly pending = new Map<number | string, PendingRequest>();
  private nextId = 1;

  private _sessionId: string | null = null;
  private _loadSessionSupported = false;
  private promptActive = false;
  private closed = false;
  private explicitlyClosed = false;

  private openPromise: Promise<void>;
  private resolveOpen: (() => void) | null = null;
  private rejectOpen: ((err: Error) => void) | null = null;
  private lastSocketError: Error | null = null;

  private constructor(
    socket: WebSocket,
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

    socket.addEventListener("open", () => {
      this.resolveOpen?.();
      this.resolveOpen = null;
      this.rejectOpen = null;
    });
    socket.addEventListener("message", (event) => {
      void this.handleMessageEvent(event);
    });
    socket.addEventListener("error", (event) => {
      const err = extractError(event);
      this.lastSocketError = err;
      this.logger.warn(`AcpSession: socket error: ${err.message}`);
      // Don't tear down here: a close event always follows an error.
      this.rejectOpen?.(err);
      this.rejectOpen = null;
      this.resolveOpen = null;
    });
    socket.addEventListener("close", (event) => {
      const detail = `code ${event.code || "?"}${event.reason ? `: ${event.reason}` : ""}`;
      const err =
        this.lastSocketError ?? new Error(`ACP connection closed (${detail})`);
      this.rejectOpen?.(err);
      this.rejectOpen = null;
      this.resolveOpen = null;
      this.teardown(err);
    });
  }

  /**
   * Opens the socket and performs ACP initialize; loadSessionSupported is
   * read from the agent's advertised capabilities.
   */
  static async connect(opts: AcpConnectOptions): Promise<AcpSession> {
    const logger = opts.logger ?? NOOP_LOGGER;
    const socket = new WebSocket(opts.url);
    const session = new AcpSession(socket, opts.callbacks ?? {}, logger);
    if (socket.readyState !== WebSocket.OPEN) {
      await session.openPromise;
    }
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

  /**
   * Cancel the active turn of an arbitrary session — through the tee,
   * naming the RUN's session stops the agent (the harness then records the
   * stage as failed: a human abort is not a success).
   */
  cancelSession(sessionId: string): void {
    if (!this.closed) this.notify("session/cancel", { sessionId });
  }

  /**
   * Inject `text` into the active turn of `sessionId` (goose steer). The
   * message is queued and picked up at the agent's next step; the turn
   * keeps running. `expectedRunId` must name the active run — goose
   * rejects an empty or stale id with invalid params (-32602), and the
   * mismatch error carries the current id as `data.actualRunId`.
   */
  async steer(
    sessionId: string,
    expectedRunId: string,
    text: string
  ): Promise<SteerResult> {
    const res = await this.request<Partial<SteerResult>>(STEER_METHOD, {
      sessionId,
      expectedRunId,
      prompt: [{ type: "text", text }],
    });
    return {
      runId: typeof res?.runId === "string" ? res.runId : expectedRunId,
      messageId: typeof res?.messageId === "string" ? res.messageId : "",
    };
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

  private async handleMessageEvent(event: MessageEvent): Promise<void> {
    if (this.closed) return;
    const text = await toText(event.data);
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
      const sessionId =
        isRecord(params) && typeof params.sessionId === "string"
          ? params.sessionId
          : "";
      if (isRecord(update) && typeof update.sessionUpdate === "string") {
        try {
          this.callbacks.onUpdate?.(update as SessionUpdate, sessionId);
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

  private teardown(err: Error): void {
    if (this.closed) return;
    this.closed = true;
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

/** JSON-RPC error detail attached to the Error a failed request rejects with. */
export interface AcpErrorInfo {
  code?: number;
  data?: unknown;
}

/** Reads the JSON-RPC code/data off an ACP request failure (see settle()). */
export function acpErrorInfo(err: unknown): AcpErrorInfo {
  if (!isRecord(err)) return {};
  const rec = err as Record<string, unknown>;
  return {
    code: typeof rec.code === "number" ? rec.code : undefined,
    data: rec.data,
  };
}

async function toText(raw: unknown): Promise<string | undefined> {
  if (typeof raw === "string") return raw;
  if (raw instanceof ArrayBuffer) return new TextDecoder().decode(raw);
  if (ArrayBuffer.isView(raw)) return new TextDecoder().decode(raw);
  if (typeof Blob !== "undefined" && raw instanceof Blob) return raw.text();
  return undefined;
}

function extractError(event: Event): Error {
  // Browser error events are typically bare Events; ErrorEvent may carry
  // .message or .error when the failure has detail.
  if (event instanceof ErrorEvent) {
    if (event.error instanceof Error) return event.error;
    if (event.message) return new Error(event.message);
  }
  return new Error("WebSocket error");
}
