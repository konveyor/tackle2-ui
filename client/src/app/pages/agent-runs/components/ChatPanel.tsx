import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Chatbot,
  ChatbotAlert,
  ChatbotContent,
  ChatbotDisplayMode,
  ChatbotFooter,
  ChatbotHeader,
  ChatbotHeaderActions,
  ChatbotHeaderMain,
  ChatbotHeaderTitle,
  Message,
  MessageBar,
  MessageBox,
  MessageDivider,
} from "@patternfly/chatbot";
import {
  AlertActionLink,
  Button,
  Icon,
  Label,
  Spinner,
} from "@patternfly/react-core";
import {
  CheckCircleIcon,
  CodeBranchIcon,
  ExclamationCircleIcon,
  ExternalLinkAltIcon,
  PendingIcon,
} from "@patternfly/react-icons";

import { AcpSession } from "@app/api/agentic/acp";
import type {
  AcpSessionCallbacks,
  PermissionOutcome,
  PermissionRequest,
  SessionUpdate,
  ToolCallDiff,
} from "@app/api/agentic/acp";
import type { AgentRunPhase } from "@app/api/agentic/contract";
import {
  isTerminalPhase,
  sleep,
  waitForRunning,
} from "@app/api/agentic/contract";
import { getAgentRun, getAgenticAcpUrl } from "@app/api/rest";

import { useChatAutoScroll } from "../useChatAutoScroll";

import { PhaseLabel } from "./PhaseLabel";

import "@patternfly/chatbot/dist/css/main.css";
import "../agent-runs.css";

// ------------------------------------------------------------- chat model

interface UserItem {
  kind: "user";
  id: number;
  /** Creation time (epoch ms) -- PF Message re-stamps "now" without one. */
  at: number;
  text: string;
}
interface AgentItem {
  kind: "agent";
  id: number;
  at: number;
  text: string;
}
interface ThoughtItem {
  kind: "thought";
  id: number;
  at: number;
  text: string;
}
interface ToolItem {
  kind: "tool";
  id: number;
  at: number;
  toolCallId: string;
  title: string;
  status: string;
  detail: string;
}
interface PlanEntry {
  content: string;
  status: string;
}
/** The agent's task ladder; each plan update replaces the previous one. */
interface PlanItem {
  kind: "plan";
  id: number;
  entries: PlanEntry[];
}
interface PermissionItem {
  kind: "permission";
  id: number;
  title?: string;
  /** File modifications to preview before answering (ACP diff blocks). */
  diffs?: ToolCallDiff[];
  options: PermissionRequest["options"];
  /** optionId chosen by the user, or "cancelled". Unset while pending. */
  chosen?: string;
}
interface StopItem {
  kind: "stop";
  id: number;
  stopReason: string;
}
interface ErrorItem {
  kind: "error";
  id: number;
  message: string;
}

type ChatItem =
  | UserItem
  | AgentItem
  | ThoughtItem
  | ToolItem
  | PlanItem
  | PermissionItem
  | StopItem
  | ErrorItem;

type ConnState =
  /** Polling run status until phase=Running with a sandbox. */
  | { kind: "waiting"; phase?: string; seconds?: number }
  /** Run is Running; dialing the ACP endpoint until it accepts. */
  | { kind: "starting"; attempt: number; seconds: number }
  | { kind: "connected"; sessionId: string }
  /** Connection dropped on a live run; an automatic re-dial is underway. */
  | { kind: "reconnecting" }
  /** Auto-reconnect budget exhausted; waiting for a manual reconnect. */
  | { kind: "disconnected" }
  | { kind: "failed"; message: string }
  | { kind: "finished"; phase: string };

// ----------------------------------------------------------- dial retry

/**
 * phase=Running races ahead of the agent process actually listening on the
 * ACP port (the sandbox pod has no readiness probe), so refused/dropped
 * sockets right after startup are expected. First dials get a long budget
 * (image pull + agent boot); re-dials a short one (it was up moments ago).
 */
const ACP_DIAL_BUDGET_MS = 180_000;
const ACP_REDIAL_BUDGET_MS = 45_000;

/** Auto-reconnects allowed inside DROP_WINDOW_MS before going manual. */
const MAX_DROPS_IN_WINDOW = 5;
const DROP_WINDOW_MS = 10 * 60_000;

function dialDelayMs(attempt: number): number {
  return Math.min(1_000 * attempt, 5_000);
}

/**
 * Dial the ACP endpoint until it accepts, the run reaches a terminal phase,
 * or the budget runs out (then the last connect error is thrown).
 */
async function dialAcp(opts: {
  url: string;
  budgetMs: number;
  signal: AbortSignal;
  callbacks: AcpSessionCallbacks;
  getPhase: () => Promise<string>;
  onAttempt: (attempt: number, elapsedMs: number) => void;
}): Promise<AcpSession | { finishedPhase: string }> {
  const started = Date.now();
  for (let attempt = 1; ; attempt++) {
    opts.signal.throwIfAborted();
    opts.onAttempt(attempt, Date.now() - started);
    try {
      const session = await AcpSession.connect({
        url: opts.url,
        callbacks: opts.callbacks,
      });
      if (opts.signal.aborted) {
        void session.close();
        opts.signal.throwIfAborted();
      }
      return session;
    } catch (err) {
      opts.signal.throwIfAborted();
      // Between attempts, let a finished run win over a dead endpoint.
      let phase: string | undefined;
      try {
        phase = await opts.getPhase();
      } catch {
        // transient status failure -- keep dialing
      }
      if (phase && isTerminalPhase(phase)) return { finishedPhase: phase };
      if (Date.now() - started >= opts.budgetMs) throw err;
      await sleep(dialDelayMs(attempt), opts.signal);
    }
  }
}

// -------------------------------------------------- session/update mapping

const str = (v: unknown): string => (typeof v === "string" ? v : "");

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

/** Text of an ACP content block ({type:"text", text}). */
function contentText(content: unknown): string {
  if (
    isRecord(content) &&
    content.type === "text" &&
    typeof content.text === "string"
  ) {
    return content.text;
  }
  return "";
}

/** Text carried by tool_call_update.content: [{type:"content", content:{...}}]. */
function toolUpdateText(content: unknown): string {
  if (!Array.isArray(content)) return "";
  return content
    .map((c) =>
      isRecord(c) && c.type === "content" ? contentText(c.content) : ""
    )
    .filter(Boolean)
    .join("\n");
}

/** Pure reducer from an ACP session/update onto the chat item list. */
function reduceUpdate(
  items: ChatItem[],
  u: SessionUpdate,
  nextId: () => number
): ChatItem[] {
  switch (u.sessionUpdate) {
    case "agent_message_chunk": {
      const text = contentText(u.content);
      if (!text) return items;
      const last = items[items.length - 1];
      if (last && last.kind === "agent") {
        return [...items.slice(0, -1), { ...last, text: last.text + text }];
      }
      return [...items, { kind: "agent", id: nextId(), at: Date.now(), text }];
    }
    case "agent_thought_chunk": {
      const text = contentText(u.content);
      if (!text) return items;
      const last = items[items.length - 1];
      if (last && last.kind === "thought") {
        return [...items.slice(0, -1), { ...last, text: last.text + text }];
      }
      return [
        ...items,
        { kind: "thought", id: nextId(), at: Date.now(), text },
      ];
    }
    case "plan": {
      const entries: PlanEntry[] = Array.isArray(u.entries)
        ? u.entries
            .filter(isRecord)
            .map((e) => ({
              content: str(e.content),
              status: str(e.status) || "pending",
            }))
            .filter((e) => e.content)
        : [];
      if (entries.length === 0) return items;
      // Each plan update carries the whole ladder -- replace in place.
      for (let i = items.length - 1; i >= 0; i--) {
        const it = items[i];
        if (it && it.kind === "plan") {
          const next: PlanItem = { ...it, entries };
          return [...items.slice(0, i), next, ...items.slice(i + 1)];
        }
      }
      return [...items, { kind: "plan", id: nextId(), entries }];
    }
    case "tool_call": {
      return [
        ...items,
        {
          kind: "tool",
          id: nextId(),
          at: Date.now(),
          toolCallId: str(u.toolCallId),
          title: str(u.title),
          status: str(u.status) || "pending",
          detail: toolUpdateText(u.content),
        },
      ];
    }
    case "tool_call_update": {
      const toolCallId = str(u.toolCallId);
      let idx = -1;
      for (let i = items.length - 1; i >= 0; i--) {
        const it = items[i];
        if (it && it.kind === "tool" && it.toolCallId === toolCallId) {
          idx = i;
          break;
        }
      }
      if (idx < 0) return items;
      const tool = items[idx] as ToolItem;
      const extra = toolUpdateText(u.content);
      const next: ToolItem = {
        ...tool,
        status: str(u.status) || tool.status,
        title: str(u.title) || tool.title,
        detail: extra
          ? tool.detail
            ? `${tool.detail}\n${extra}`
            : extra
          : tool.detail,
      };
      return [...items.slice(0, idx), next, ...items.slice(idx + 1)];
    }
    default:
      return items;
  }
}

// --------------------------------------------------------------- helpers

function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

/** Stable per-message stamp; PF Message would otherwise show render time. */
function messageTime(at: number): string {
  return new Date(at).toLocaleTimeString();
}

const svgAvatar = (svg: string) =>
  `data:image/svg+xml,${encodeURIComponent(svg)}`;

const BOT_AVATAR = svgAvatar(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 36"><circle cx="18" cy="18" r="18" fill="#0066cc"/><rect x="9" y="13" width="18" height="12" rx="3" fill="#fff"/><circle cx="14.5" cy="19" r="2" fill="#0066cc"/><circle cx="21.5" cy="19" r="2" fill="#0066cc"/><rect x="16.9" y="8" width="2.2" height="4" rx="1" fill="#fff"/><circle cx="18" cy="7" r="1.8" fill="#fff"/></svg>'
);
const USER_AVATAR = svgAvatar(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 36"><circle cx="18" cy="18" r="18" fill="#6a6e73"/><circle cx="18" cy="14.5" r="5.5" fill="#fff"/><path d="M7.5 30.5a10.5 10.5 0 0 1 21 0 18 18 0 0 1-21 0z" fill="#fff"/></svg>'
);

// ----------------------------------------------------------------- panel

interface ChatPanelProps {
  runName: string;
  /** spec.agentRef -- names the bot in the transcript and header. */
  agentRef?: string;
  /** Target branch of the run, pinned in the chat header. */
  targetBranch?: string;
  /** Web URL for targetBranch; renders as plain text when unset. */
  targetBranchUrl?: string;
}

export function ChatPanel({
  runName,
  agentRef,
  targetBranch,
  targetBranchUrl,
}: ChatPanelProps) {
  const { t } = useTranslation();
  const [conn, setConn] = useState<ConnState>({ kind: "waiting" });
  const [items, setItems] = useState<ChatItem[]>([]);
  const [session, setSession] = useState<AcpSession | null>(null);
  const [turnActive, setTurnActive] = useState(false);
  const [attempt, setAttempt] = useState(0); // bumped to rerun the connect flow

  const idRef = useRef(0);
  const sessionRef = useRef<AcpSession | null>(null);
  const lastSessionIdRef = useRef<string | null>(null);
  const dropTimesRef = useRef<number[]>([]);
  const { messageBoxRef, pinToBottom } = useChatAutoScroll();
  const permissionResolvers = useRef(
    new Map<number, (o: PermissionOutcome) => void>()
  );

  const nextId = () => ++idRef.current;

  const pushItem = (item: ChatItem) => setItems((prev) => [...prev, item]);

  const handleUpdate = useCallback((u: SessionUpdate) => {
    setItems((prev) => reduceUpdate(prev, u, () => ++idRef.current));
  }, []);

  // Render permission asks inline; the returned promise resolves when the
  // user clicks an option (see choosePermission).
  const handlePermission = useCallback(
    (r: PermissionRequest): Promise<PermissionOutcome> => {
      return new Promise((resolve) => {
        const id = ++idRef.current;
        permissionResolvers.current.set(id, resolve);
        setItems((prev) => [
          ...prev,
          {
            kind: "permission",
            id,
            title: r.toolCall?.title,
            diffs: r.toolCall?.diffs,
            options: r.options,
          },
        ]);
      });
    },
    []
  );

  const choosePermission = (id: number, optionId: string | null) => {
    const resolve = permissionResolvers.current.get(id);
    if (!resolve) return;
    permissionResolvers.current.delete(id);
    resolve(
      optionId
        ? { outcome: { outcome: "selected", optionId } }
        : { outcome: { outcome: "cancelled" } }
    );
    setItems((prev) =>
      prev.map((it) =>
        it.id === id && it.kind === "permission"
          ? { ...it, chosen: optionId ?? "cancelled" }
          : it
      )
    );
  };

  // Connect flow: wait for Running, dial ACP until it accepts (the pod's
  // agent process lags phase=Running), then new-session -- or load-session
  // to replay history after a reconnect.
  useEffect(() => {
    let disposed = false;
    const abort = new AbortController();
    let localSession: AcpSession | null = null;

    // Non-terminal drop: auto-reconnect (bounded), else surface it.
    const handleDrop = async () => {
      setSession(null);
      let phase: string | undefined;
      try {
        phase = (await getAgentRun(runName)).status?.phase;
      } catch {
        // status unavailable -- treat as a plain drop
      }
      if (disposed) return;
      if (phase && isTerminalPhase(phase)) {
        setConn({ kind: "finished", phase });
        return;
      }
      const now = Date.now();
      dropTimesRef.current = dropTimesRef.current
        .filter((tms) => now - tms < DROP_WINDOW_MS)
        .concat(now);
      if (dropTimesRef.current.length > MAX_DROPS_IN_WINDOW) {
        setConn({ kind: "disconnected" });
        return;
      }
      setConn({ kind: "reconnecting" });
      setAttempt((a) => a + 1); // rerun this effect; session/load replays
    };

    const connect = async () => {
      setConn({ kind: "waiting" });
      const current = await getAgentRun(runName);
      const currentPhase = current.status?.phase ?? "Pending";
      if (isTerminalPhase(currentPhase)) {
        setConn({ kind: "finished", phase: currentPhase });
        return;
      }
      await waitForRunning({ getRun: getAgentRun }, runName, {
        signal: abort.signal,
        onPhase: (p, elapsedMs) => {
          if (!disposed) {
            setConn({
              kind: "waiting",
              phase: p,
              seconds: Math.round(elapsedMs / 1000),
            });
          }
        },
      });
      if (disposed) return;
      const dialed = await dialAcp({
        url: getAgenticAcpUrl(runName),
        budgetMs: lastSessionIdRef.current
          ? ACP_REDIAL_BUDGET_MS
          : ACP_DIAL_BUDGET_MS,
        signal: abort.signal,
        callbacks: {
          onUpdate: handleUpdate,
          onPermissionRequest: handlePermission,
        },
        getPhase: async () =>
          (await getAgentRun(runName)).status?.phase ?? "Pending",
        onAttempt: (n, elapsedMs) => {
          if (!disposed) {
            setConn({
              kind: "starting",
              attempt: n,
              seconds: Math.round(elapsedMs / 1000),
            });
          }
        },
      });
      if ("finishedPhase" in dialed) {
        if (!disposed)
          setConn({ kind: "finished", phase: dialed.finishedPhase });
        return;
      }
      localSession = dialed;
      if (disposed) {
        void localSession.close();
        return;
      }
      sessionRef.current = localSession;
      localSession.onClosed(() => {
        if (!disposed) void handleDrop();
      });
      // Prefer resuming the previous session after a drop -- the agent
      // replays its history as session/update notifications.
      let sessionId: string;
      const prior = lastSessionIdRef.current;
      if (prior && localSession.loadSessionSupported) {
        setItems([]); // the replay repopulates the transcript
        try {
          await localSession.loadSession(prior);
          sessionId = prior;
        } catch {
          sessionId = await localSession.newSession();
        }
      } else {
        sessionId = await localSession.newSession();
      }
      lastSessionIdRef.current = sessionId;
      if (!disposed) {
        setSession(localSession);
        setConn({ kind: "connected", sessionId });
      }
    };

    connect().catch((err) => {
      if (!disposed) setConn({ kind: "failed", message: errorMessage(err) });
    });

    return () => {
      disposed = true;
      abort.abort();
      const s = sessionRef.current ?? localSession;
      sessionRef.current = null;
      if (s) void s.close();
      setSession(null);
      setTurnActive(false);
    };
  }, [runName, attempt, handleUpdate, handlePermission]);

  const send = async (raw: string | number) => {
    const text = String(raw).trim();
    const s = session;
    if (!text || !s || turnActive) return;
    pushItem({ kind: "user", id: nextId(), at: Date.now(), text });
    pinToBottom(); // sending is a request to watch the reply
    setTurnActive(true);
    try {
      const stopReason = await s.prompt(text);
      pushItem({ kind: "stop", id: nextId(), stopReason });
    } catch (err) {
      pushItem({ kind: "error", id: nextId(), message: errorMessage(err) });
    } finally {
      setTurnActive(false);
    }
  };

  const manualRetry = () => {
    dropTimesRef.current = [];
    setAttempt((a) => a + 1);
  };

  const reconnectLabel = lastSessionIdRef.current
    ? t("agentic.chat.reconnect")
    : t("agentic.chat.retry");

  const botName = agentRef ?? t("agentic.chat.agentName");
  const userName = t("agentic.chat.you");

  const notice = (() => {
    switch (conn.kind) {
      case "waiting":
        return conn.phase
          ? t("agentic.chat.waitingForSandbox", {
              phase: conn.phase,
              seconds: conn.seconds,
            })
          : t("agentic.chat.checkingRunStatus");
      case "starting":
        return t("agentic.chat.startingAcp", {
          attempt: conn.attempt,
          seconds: conn.seconds,
        });
      case "reconnecting":
        return t("agentic.chat.reconnectingToAgent");
      default:
        return null;
    }
  })();

  return (
    <Chatbot
      displayMode={ChatbotDisplayMode.embedded}
      className="agent-run-chatbot"
      ariaLabel={t("agentic.chat.title")}
    >
      <ChatbotHeader>
        <ChatbotHeaderMain>
          <ChatbotHeaderTitle>
            <span className="agent-run-chatbot-title">
              {botName}
              <ConnBadge conn={conn} />
            </span>
          </ChatbotHeaderTitle>
        </ChatbotHeaderMain>
        <ChatbotHeaderActions>
          {targetBranch &&
            (targetBranchUrl ? (
              <Button
                component="a"
                variant="link"
                isInline
                href={targetBranchUrl}
                target="_blank"
                rel="noreferrer"
                icon={<CodeBranchIcon />}
              >
                <code>{targetBranch}</code>{" "}
                <ExternalLinkAltIcon aria-hidden="true" />
              </Button>
            ) : (
              <Label variant="outline" icon={<CodeBranchIcon />}>
                <code>{targetBranch}</code>
              </Label>
            ))}
        </ChatbotHeaderActions>
      </ChatbotHeader>
      <ChatbotContent>
        {/* No enableSmartScroll: useChatAutoScroll is the sole authority on
            scroll position, and MessageBox's version reports reader intent
            through state that lags a render behind the stream. */}
        <MessageBox
          ref={messageBoxRef}
          onScrollToBottomClick={pinToBottom}
          ariaLabel={t("agentic.chat.title")}
        >
          {items.map((item) => (
            <ChatItemView
              key={item.id}
              item={item}
              botName={botName}
              userName={userName}
              onPermission={choosePermission}
            />
          ))}
          {notice && (
            <div className="chat-conn-notice">
              <Spinner size="sm" aria-label={notice} /> <span>{notice}</span>
            </div>
          )}
          {conn.kind === "connected" && items.length === 0 && (
            <div className="chat-meta">
              {t("agentic.chat.connectedHint")}{" "}
              {t("agentic.chat.session", { sessionId: conn.sessionId })}
            </div>
          )}
          {conn.kind === "disconnected" && (
            <ChatbotAlert
              variant="warning"
              title={t("agentic.chat.disconnectedFromAgent")}
              actionLinks={
                <AlertActionLink onClick={manualRetry}>
                  {reconnectLabel}
                </AlertActionLink>
              }
            >
              {t("agentic.chat.disconnectedBody")}
            </ChatbotAlert>
          )}
          {conn.kind === "failed" && (
            <ChatbotAlert
              variant="danger"
              title={t("agentic.chat.connectionFailed", {
                message: conn.message,
              })}
              actionLinks={
                <AlertActionLink onClick={manualRetry}>
                  {reconnectLabel}
                </AlertActionLink>
              }
            >
              {t("agentic.chat.connectionFailedHint")}
            </ChatbotAlert>
          )}
          {conn.kind === "finished" &&
            (items.length > 0 ? (
              <MessageDivider
                content={t("agentic.chat.runFinishedLive", {
                  phase: conn.phase,
                })}
              />
            ) : (
              <ChatbotAlert
                variant="info"
                title={t("agentic.chat.runAlreadyFinished", {
                  phase: conn.phase,
                })}
              >
                {t("agentic.chat.finishedNoTranscript")}
              </ChatbotAlert>
            ))}
        </MessageBox>
      </ChatbotContent>
      <ChatbotFooter>
        <MessageBar
          onSendMessage={(m) => void send(m)}
          hasAttachButton={false}
          alwayShowSendButton
          isSendButtonDisabled={!session || turnActive}
          hasStopButton={turnActive}
          handleStopButton={() => void sessionRef.current?.cancel()}
          placeholder={t("agentic.chat.messagePlaceholder")}
          isDisabled={!session}
          buttonProps={{
            stop: { tooltipContent: t("agentic.chat.cancelTurn") },
          }}
        />
      </ChatbotFooter>
    </Chatbot>
  );
}

// -------------------------------------------------------- connection badge

function ConnBadge({ conn }: { conn: ConnState }) {
  const { t } = useTranslation();
  switch (conn.kind) {
    case "waiting":
      return (
        <Label isCompact color="grey" icon={<Spinner size="sm" />}>
          {t("agentic.chat.waiting")}
        </Label>
      );
    case "starting":
    case "reconnecting":
      return (
        <Label isCompact color="blue" icon={<Spinner size="sm" />}>
          {t("agentic.chat.connecting")}
        </Label>
      );
    case "connected":
      return (
        <Label isCompact color="green">
          {t("terms.connected")}
        </Label>
      );
    case "disconnected":
      return (
        <Label isCompact color="orange">
          {t("agentic.chat.disconnectedShort")}
        </Label>
      );
    case "failed":
      return (
        <Label isCompact color="red">
          {t("agentic.chat.failedShort")}
        </Label>
      );
    case "finished":
      return <PhaseLabel phase={conn.phase as AgentRunPhase} />;
  }
}

// ------------------------------------------------------------- item views

type DiffLine = { op: "add" | "del" | "ctx"; text: string };

/** Classic LCS line diff -- fine at permission-preview sizes. */
function diffLines(oldText: string, newText: string): DiffLine[] {
  const a = oldText.split("\n");
  const b = newText.split("\n");
  const m = a.length;
  const n = b.length;
  const lcs: number[][] = Array.from({ length: m + 1 }, () =>
    new Array<number>(n + 1).fill(0)
  );
  for (let i = m - 1; i >= 0; i--) {
    for (let j = n - 1; j >= 0; j--) {
      lcs[i][j] =
        a[i] === b[j]
          ? lcs[i + 1][j + 1] + 1
          : Math.max(lcs[i + 1][j], lcs[i][j + 1]);
    }
  }
  const out: DiffLine[] = [];
  let i = 0;
  let j = 0;
  while (i < m && j < n) {
    if (a[i] === b[j]) {
      out.push({ op: "ctx", text: a[i] });
      i++;
      j++;
    } else if (lcs[i + 1][j] >= lcs[i][j + 1]) {
      out.push({ op: "del", text: a[i++] });
    } else {
      out.push({ op: "add", text: b[j++] });
    }
  }
  while (i < m) out.push({ op: "del", text: a[i++] });
  while (j < n) out.push({ op: "add", text: b[j++] });
  return out;
}

function DiffPreview({ diff }: { diff: ToolCallDiff }) {
  const { t } = useTranslation();
  const isNewFile = diff.oldText == null;
  const lines: DiffLine[] = isNewFile
    ? diff.newText.split("\n").map((text) => ({ op: "add" as const, text }))
    : diffLines(diff.oldText ?? "", diff.newText);
  return (
    <div className="chat-diff">
      <div className="chat-diff-path">
        <code>{diff.path}</code>
        {isNewFile ? (
          <Label color="green">{t("agentic.chat.newFile")}</Label>
        ) : null}
      </div>
      <pre className="chat-diff-body">
        {lines.map((l, idx) => (
          <div key={idx} className={`chat-diff-line chat-diff-${l.op}`}>
            <span className="chat-diff-sign">
              {l.op === "add" ? "+" : l.op === "del" ? "-" : " "}
            </span>
            {l.text}
          </div>
        ))}
      </pre>
    </div>
  );
}

function ToolStatusIcon({ status }: { status: string }) {
  const { t } = useTranslation();
  if (status === "completed") {
    return (
      <Icon status="success">
        <CheckCircleIcon aria-label={t("terms.completed")} />
      </Icon>
    );
  }
  if (status === "failed" || status === "error") {
    return (
      <Icon status="danger">
        <ExclamationCircleIcon aria-label={t("terms.failed")} />
      </Icon>
    );
  }
  return <Spinner size="sm" aria-label={status} />;
}

function toolStatusColor(status: string): "green" | "red" | "blue" {
  if (status === "completed") return "green";
  if (status === "failed" || status === "error") return "red";
  return "blue";
}

function PlanEntryIcon({ status }: { status: string }) {
  if (status === "completed") {
    return (
      <Icon status="success" size="sm">
        <CheckCircleIcon aria-hidden="true" />
      </Icon>
    );
  }
  if (status === "in_progress") {
    return <Spinner size="sm" aria-label={status} />;
  }
  return (
    <Icon size="sm">
      <PendingIcon aria-hidden="true" />
    </Icon>
  );
}

function ChatItemView({
  item,
  botName,
  userName,
  onPermission,
}: {
  item: ChatItem;
  botName: string;
  userName: string;
  onPermission: (id: number, optionId: string | null) => void;
}) {
  const { t } = useTranslation();
  switch (item.kind) {
    case "user":
      return (
        <Message
          role="user"
          avatar={USER_AVATAR}
          name={userName}
          timestamp={messageTime(item.at)}
          content={item.text}
        />
      );
    case "agent":
      return (
        <Message
          role="bot"
          avatar={BOT_AVATAR}
          name={botName}
          timestamp={messageTime(item.at)}
          content={item.text}
        />
      );
    case "thought":
      // Wrapper div, NOT className on Message: Message spreads consumer
      // props over its own className, which would wipe the pf-chatbot
      // layout classes (avatar then overlaps the text).
      return (
        <div className="chat-thought-message">
          <Message
            role="bot"
            avatar={BOT_AVATAR}
            name={botName}
            timestamp={messageTime(item.at)}
            content={item.text}
          />
        </div>
      );
    case "tool":
      return (
        <Message
          role="bot"
          avatar={BOT_AVATAR}
          name={botName}
          timestamp={messageTime(item.at)}
          toolResponse={{
            toggleContent: (
              <span className="chat-tool-toggle">
                <ToolStatusIcon status={item.status} />{" "}
                {item.title || t("agentic.chat.toolCall")}{" "}
                <Label
                  isCompact
                  color={toolStatusColor(item.status)}
                  variant="outline"
                >
                  {item.status}
                </Label>
              </span>
            ),
            body: (
              <pre className="chat-tool-detail">
                {item.detail || t("agentic.chat.noOutputYet")}
              </pre>
            ),
          }}
        />
      );
    case "plan":
      return (
        <div className="chat-plan">
          <div className="chat-plan-title">{t("agentic.chat.plan")}</div>
          {item.entries.map((e, idx) => (
            <div key={idx} className="chat-plan-entry">
              <PlanEntryIcon status={e.status} />
              <span
                className={
                  e.status === "completed" ? "chat-plan-done" : undefined
                }
              >
                {e.content}
              </span>
            </div>
          ))}
        </div>
      );
    case "stop":
      return (
        <MessageDivider
          content={t("agentic.chat.turnEnded", { stopReason: item.stopReason })}
        />
      );
    case "error":
      return (
        <ChatbotAlert variant="danger" title={t("agentic.chat.chatError")}>
          {item.message}
        </ChatbotAlert>
      );
    case "permission": {
      const chosenName = item.chosen
        ? (item.options.find((o) => o.optionId === item.chosen)?.name ??
          item.chosen)
        : null;
      return (
        <div className="chat-permission">
          <div className="chat-permission-title">
            {item.title
              ? t("agentic.chat.permissionRequestedFor", { title: item.title })
              : t("agentic.chat.permissionRequested")}
          </div>
          {item.diffs?.map((d) => (
            <DiffPreview key={d.path} diff={d} />
          ))}
          {chosenName ? (
            <Label color="blue">
              {t("agentic.chat.answered", { choice: chosenName })}
            </Label>
          ) : (
            <div className="chat-permission-actions">
              {item.options.map((o) => (
                <Button
                  key={o.optionId}
                  size="sm"
                  variant={o.kind.startsWith("allow") ? "primary" : "secondary"}
                  onClick={() => onPermission(item.id, o.optionId)}
                >
                  {o.name}
                </Button>
              ))}
            </div>
          )}
        </div>
      );
    }
  }
}
