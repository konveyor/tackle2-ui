import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import {
  Chatbot,
  ChatbotAlert,
  ChatbotContent,
  ChatbotDisplayMode,
  ChatbotFooter,
  ChatbotFootnote,
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
  ButtonVariant,
  Checkbox,
  Form,
  FormGroup,
  Icon,
  Label,
  Radio,
  Spinner,
  TextArea,
  TextInput,
  Tooltip,
} from "@patternfly/react-core";
import {
  BookOpenIcon,
  CheckCircleIcon,
  CodeBranchIcon,
  CompressIcon,
  ExclamationCircleIcon,
  ExpandIcon,
  ExternalLinkAltIcon,
  PendingIcon,
  StopCircleIcon,
} from "@patternfly/react-icons";

import { isAgenticSteerEnabled } from "@app/Constants";
import { AcpSession, acpErrorInfo } from "@app/api/agentic/acp";
import type {
  AcpSessionCallbacks,
  ElicitationOutcome,
  ElicitationProperty,
  ElicitationRequest,
  PermissionOutcome,
  PermissionRequest,
  SessionUpdate,
  SteerResult,
  ToolCallDiff,
} from "@app/api/agentic/acp";
import type { AgentRunPhase, AgentRunStatus } from "@app/api/agentic/contract";
import {
  ACP_READY_CONDITION,
  isTerminalPhase,
  sleep,
} from "@app/api/agentic/contract";
import { getAgenticAcpUrl, mintAcpNonce } from "@app/api/rest";
import { useHasSomeScopes } from "@app/auth";
import { ConfirmDialog } from "@app/components/ConfirmDialog";
import { agenticAcpScopes, agenticSteerScopes } from "@app/scopes";

import { useChatAutoScroll } from "../useChatAutoScroll";

import { PhaseLabel } from "./PhaseLabel";

import "@patternfly/chatbot/dist/css/main.css";
import "../agent-runs.css";

// ------------------------------------------------------------- chat model

/**
 * Lifecycle of a redirect injected into the agent's active turn (goose
 * steer, relayed by the harness tee): the message is queued, the agent reads
 * it at its next step, and the turn keeps running.
 */
type SteerState =
  /** Request on its way to the harness. */
  | { state: "sending" }
  /** goose queued it; the agent reads it at its next step. */
  | { state: "queued"; messageId: string }
  /**
   * The running turn picked it up — goose echoed it back as a user
   * message. `streamed` marks a redirect this panel only knows from the
   * stream (another viewer's), whose text may still arrive in chunks.
   */
  | { state: "delivered"; messageId?: string; streamed?: boolean }
  /** The turn ended before the agent reached it; goose discards it. */
  | { state: "dropped"; messageId?: string }
  | { state: "failed"; message: string };

interface UserItem {
  kind: "user";
  id: number;
  /** Creation time (epoch ms) -- PF Message re-stamps "now" without one. */
  at: number;
  text: string;
  /** Set when the message is a mid-turn redirect rather than a prompt. */
  steer?: SteerState;
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
  /** The call's rawInput as announced (e.g. load_skill's `{name}`), if any. */
  input?: Record<string, unknown>;
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
/**
 * The agent asking the human a question (elicitation/create, e.g. the
 * harness's ask_user tool). The agent's turn is blocked until it is
 * answered, declined, or the harness times it out.
 */
interface AskItem {
  kind: "ask";
  id: number;
  at: number;
  message: string;
  schema: ElicitationRequest["requestedSchema"];
  /** Set once answered: what went back to the agent. */
  outcome?: ElicitationOutcome;
}
/** A one-line transcript divider (e.g. "stop requested"). */
interface NoticeItem {
  kind: "notice";
  id: number;
  text: string;
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
  | AskItem
  | NoticeItem
  | ErrorItem;

/** The agent's active turn, as goose announces it on the run's session. */
interface ActiveRun {
  runId: string;
}

/** State of the dial itself; only meaningful while the run is dialable. */
type ConnState =
  /** Dialing the ACP endpoint until it accepts. */
  | { kind: "connecting"; seconds: number }
  | { kind: "connected"; sessionId: string }
  /** Connection dropped on a live run; an automatic re-dial is underway. */
  | { kind: "reconnecting" }
  /** Auto-reconnect budget exhausted; waiting for a manual reconnect. */
  | { kind: "disconnected" }
  | { kind: "failed"; message: string };

/** What the panel shows: the run's status (from the page's poll) frames conn. */
type ChatView =
  | ConnState
  /** Run has no dialable sandbox yet. */
  | { kind: "waiting" }
  /** The user's role cannot open the ACP channel (no nonce for them). */
  | { kind: "forbidden" }
  | { kind: "finished" };

// ----------------------------------------------------------- dial retry

/**
 * Controllers that report the ACPReady condition (agentic-controller#160)
 * say exactly when the agent's ACP endpoint accepts, so the panel dials
 * once. Older controllers only offer phase=Running, which fires when the
 * sandbox object exists — before the agent listens — so there the panel
 * keeps dialing at a fixed cadence until the endpoint accepts or the budget
 * runs out; a run that finishes meanwhile is stopped by its status flipping.
 */
const ACP_DIAL_BUDGET_MS = 180_000;
const ACP_DIAL_RETRY_MS = 3_000;

/** Auto-reconnects allowed inside DROP_WINDOW_MS before going manual. */
const MAX_DROPS_IN_WINDOW = 5;
const DROP_WINDOW_MS = 10 * 60_000;

/**
 * Dial until the endpoint accepts or the budget runs out (last error thrown)
 * -- or exactly once when `retry` is false: a controller that reports the
 * ACPReady condition has already vouched that the endpoint accepts.
 */
async function dialAcp(opts: {
  /** Built fresh per attempt — the hub's ACP nonce is single-use. */
  getUrl: () => Promise<string>;
  signal: AbortSignal;
  callbacks: AcpSessionCallbacks;
  onAttempt: (elapsedMs: number) => void;
  retry: boolean;
}): Promise<AcpSession> {
  const started = Date.now();
  for (;;) {
    opts.signal.throwIfAborted();
    opts.onAttempt(Date.now() - started);
    try {
      const session = await AcpSession.connect({
        url: await opts.getUrl(),
        callbacks: opts.callbacks,
      });
      if (opts.signal.aborted) {
        void session.close();
        opts.signal.throwIfAborted();
      }
      return session;
    } catch (err) {
      opts.signal.throwIfAborted();
      if (!opts.retry || Date.now() - started >= ACP_DIAL_BUDGET_MS) throw err;
      await sleep(ACP_DIAL_RETRY_MS, opts.signal);
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

/** goose's vendor metadata on an update (`_meta.goose`), or {}. */
function gooseMeta(u: SessionUpdate): Record<string, unknown> {
  return isRecord(u._meta) && isRecord(u._meta.goose) ? u._meta.goose : {};
}

/** Id goose stamps on a streamed message; a steer pickup carries the steer's. */
function updateMessageId(u: SessionUpdate): string | undefined {
  return str(gooseMeta(u).messageId) || str(u.messageId) || undefined;
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
          input: isRecord(u.rawInput) ? u.rawInput : undefined,
        },
      ];
    }
    case "user_message_chunk": {
      // Only redirects are transcript material here: when the running turn
      // picks up a steer, goose echoes it as a user message flagged
      // _meta.goose.steer. Other user chunks are replays of the prompt the
      // harness sent -- the live view is the agent's stream, not the prompt.
      const goose = gooseMeta(u);
      if (goose.steer !== true) return items;
      const text = contentText(u.content);
      const messageId = updateMessageId(u);
      // A redirect this viewer sent already sits in the list: flip it to
      // delivered instead of echoing a second bubble. Match by id, or by
      // text for one whose id has not come back yet.
      for (let i = items.length - 1; i >= 0; i--) {
        const it = items[i];
        if (!it || it.kind !== "user" || !it.steer) continue;
        const st = it.steer;
        const knownId = "messageId" in st ? st.messageId : undefined;
        const byId = !!messageId && knownId === messageId;
        const pending = st.state === "sending" || st.state === "queued";
        if (!byId && !(pending && it.text === text)) continue;
        if (st.state === "delivered") {
          // A later chunk of the same pickup: ours is already complete.
          if (!st.streamed || !text) return items;
          return [
            ...items.slice(0, i),
            { ...it, text: it.text + text },
            ...items.slice(i + 1),
          ];
        }
        const next: UserItem = {
          ...it,
          steer: { state: "delivered", messageId: messageId ?? knownId },
        };
        return [...items.slice(0, i), next, ...items.slice(i + 1)];
      }
      if (!text) return items;
      // Another viewer's redirect -- show it.
      return [
        ...items,
        {
          kind: "user",
          id: nextId(),
          at: Date.now(),
          text,
          steer: { state: "delivered", messageId, streamed: true },
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
  /** Live run status from the page's poll; decides when the panel dials. */
  status?: AgentRunStatus;
  /** spec.agentRef -- names the bot in the transcript and header. */
  agentRef?: string;
  /** Target branch of the run, pinned in the chat header. */
  targetBranch?: string;
  /** Web URL for targetBranch; renders as plain text when unset. */
  targetBranchUrl?: string;
}

export function ChatPanel({
  runName,
  status,
  agentRef,
  targetBranch,
  targetBranchUrl,
}: ChatPanelProps) {
  const { t } = useTranslation();
  // The hub mints the ACP nonce under agentic.agentruns.acp (admin,
  // architect, migrator); a project manager gets a 403 — so don't dial,
  // say so. Steering rides the same bit until tackle2-hub#1116 splits it.
  const canOpenSession = useHasSomeScopes(agenticAcpScopes);
  const canIntervene = useHasSomeScopes(agenticSteerScopes);
  const phase = status?.phase;
  const finished = isTerminalPhase(phase);
  // ACPReady (when the controller reports it) is the signal to dial on.
  // Without it, fall back to phase=Running plus the fields the hub needs
  // to relay (sandboxName + secretKeyRef) and let the dial loop ride out
  // the agent's startup.
  const acpReady = status?.conditions?.find(
    (c) => c.type === ACP_READY_CONDITION
  );
  const dialable =
    canOpenSession &&
    !finished &&
    (acpReady
      ? acpReady.status === "True"
      : phase === "Running" &&
        !!status?.sandboxName &&
        !!status?.secretKeyRef?.name);

  const acpReadyKnown = !!acpReady;

  const [conn, setConn] = useState<ConnState>({
    kind: "connecting",
    seconds: 0,
  });
  const [items, setItems] = useState<ChatItem[]>([]);
  const [session, setSession] = useState<AcpSession | null>(null);
  const [attempt, setAttempt] = useState(0); // bumped to rerun the connect flow
  // The run's own session and active turn, learned from the teed stream.
  // activeRun: undefined = not observed yet, null = goose said the turn is
  // over, object = the turn steer must name.
  const [runSession, setRunSession] = useState<string | null>(null);
  const [activeRun, setActiveRun] = useState<ActiveRun | null | undefined>(
    undefined
  );
  const [steerBusy, setSteerBusy] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  // Full-screen transcript: PF's fullscreen display mode pins the chatbot
  // over the viewport; Escape (or the header button) brings it back inline.
  const [expanded, setExpanded] = useState(false);
  useEffect(() => {
    if (!expanded) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setExpanded(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [expanded]);

  const idRef = useRef(0);
  const sessionRef = useRef<AcpSession | null>(null);
  const lastSessionIdRef = useRef<string | null>(null);
  const runSessionRef = useRef<string | null>(null);
  const activeRunRef = useRef<ActiveRun | null | undefined>(undefined);
  const dropTimesRef = useRef<number[]>([]);
  const { messageBoxRef, pinToBottom } = useChatAutoScroll();
  const permissionResolvers = useRef(
    new Map<number, (o: PermissionOutcome) => void>()
  );
  const askResolvers = useRef(
    new Map<number, (o: ElicitationOutcome) => void>()
  );

  const nextId = () => ++idRef.current;

  const pushItem = (item: ChatItem) => setItems((prev) => [...prev, item]);

  const noteActiveRun = useCallback((run: ActiveRun | null | undefined) => {
    activeRunRef.current = run;
    setActiveRun(run);
  }, []);

  const handleUpdate = useCallback(
    (u: SessionUpdate, sid: string) => {
      // Through the tee, the RUN's session streams alongside this viewer's
      // own (which stays silent -- the panel never prompts it). The run's
      // is the session steer and cancel must name.
      const isRun = !!sid && sid !== lastSessionIdRef.current;
      if (isRun && runSessionRef.current !== sid) {
        runSessionRef.current = sid;
        setRunSession(sid);
      }
      if (isRun && u.sessionUpdate === "session_info_update") {
        const goose = gooseMeta(u);
        if ("activeRunId" in goose) {
          const id = goose.activeRunId;
          if (typeof id === "string" && id) {
            noteActiveRun({ runId: id });
          } else if (id === null) {
            noteActiveRun(null);
            // goose discards steers the turn never reached.
            setItems((prev) =>
              prev.map((it) =>
                it.kind === "user" &&
                it.steer &&
                (it.steer.state === "sending" || it.steer.state === "queued")
                  ? {
                      ...it,
                      steer: {
                        state: "dropped",
                        messageId:
                          "messageId" in it.steer
                            ? it.steer.messageId
                            : undefined,
                      },
                    }
                  : it
              )
            );
          }
        }
        // Any viewer's accepted steer names the run it landed in.
        const queued = goose.queuedSteer;
        if (
          isRecord(queued) &&
          typeof queued.runId === "string" &&
          queued.runId
        ) {
          noteActiveRun({ runId: queued.runId });
        }
      }
      setItems((prev) => reduceUpdate(prev, u, () => ++idRef.current));
    },
    [noteActiveRun]
  );

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

  // The agent's question renders inline as a form; the returned promise
  // resolves when the user answers or declines (see answerAsk). Answerable
  // regardless of the steer flag: like a permission ask it is solicited by
  // the agent, which is blocked until someone responds.
  const handleElicitation = useCallback(
    (r: ElicitationRequest): Promise<ElicitationOutcome> => {
      return new Promise((resolve) => {
        const id = ++idRef.current;
        askResolvers.current.set(id, resolve);
        setItems((prev) => [
          ...prev,
          {
            kind: "ask",
            id,
            at: Date.now(),
            message: r.message,
            schema: r.requestedSchema,
          },
        ]);
      });
    },
    []
  );

  const answerAsk = (id: number, outcome: ElicitationOutcome) => {
    const resolve = askResolvers.current.get(id);
    if (!resolve) return;
    askResolvers.current.delete(id);
    resolve(outcome);
    setItems((prev) =>
      prev.map((it) =>
        it.id === id && it.kind === "ask" ? { ...it, outcome } : it
      )
    );
  };

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

  // Connect flow, run once the page's poll says the run is dialable: dial
  // ACP until it accepts, then new-session -- or load-session to replay
  // history after a reconnect. The run finishing (or the page leaving)
  // flips `dialable`, which aborts the dial and closes the session.
  useEffect(() => {
    if (!dialable) return;
    const abort = new AbortController();
    const live = () => !abort.signal.aborted;
    let localSession: AcpSession | null = null;

    // Drop on a live run: auto-reconnect (bounded), else surface it. A run
    // that just finished shows as finished as soon as the poll catches up.
    const handleDrop = () => {
      setSession(null);
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
      localSession = await dialAcp({
        getUrl: async () =>
          getAgenticAcpUrl(runName, (await mintAcpNonce(runName)) ?? undefined),
        signal: abort.signal,
        callbacks: {
          onUpdate: handleUpdate,
          onPermissionRequest: handlePermission,
          onElicitation: handleElicitation,
        },
        onAttempt: (elapsedMs) => {
          if (live()) {
            setConn({
              kind: "connecting",
              seconds: Math.round(elapsedMs / 1000),
            });
          }
        },
        retry: !acpReadyKnown,
      });
      sessionRef.current = localSession;
      localSession.onClosed(() => {
        if (live()) handleDrop();
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
      if (live()) {
        setSession(localSession);
        setConn({ kind: "connected", sessionId });
      }
    };

    connect().catch((err) => {
      if (live()) setConn({ kind: "failed", message: errorMessage(err) });
    });

    return () => {
      abort.abort();
      const s = sessionRef.current ?? localSession;
      sessionRef.current = null;
      if (s) void s.close();
      setSession(null);
    };
  }, [
    runName,
    dialable,
    acpReadyKnown,
    attempt,
    handleUpdate,
    handlePermission,
    handleElicitation,
  ]);

  // Redirect the agent: goose steer on the RUN's session, relayed by the
  // harness tee onto the run connection (rejected there with -32601 when
  // HARNESS_HITL_STEER=off). The message is queued into the active turn and
  // read at the agent's next step; the turn keeps running.
  const steerRun = async (raw: string | number) => {
    const text = String(raw).trim();
    const s = session;
    const runSid = runSessionRef.current;
    if (!text || !s || !runSid || steerBusy) return;
    const id = nextId();
    pushItem({
      kind: "user",
      id,
      at: Date.now(),
      text,
      steer: { state: "sending" },
    });
    pinToBottom(); // sending is a request to watch the reply
    setSteerBusy(true);
    const setSteer = (steer: SteerState, onlyWhileSending = false) =>
      setItems((prev) =>
        prev.map((it) =>
          it.id === id &&
          it.kind === "user" &&
          (!onlyWhileSending || it.steer?.state === "sending")
            ? { ...it, steer }
            : it
        )
      );
    try {
      const expected = activeRunRef.current?.runId ?? DISCOVER_RUN_ID;
      let result: SteerResult;
      try {
        result = await s.steer(runSid, expected, text);
      } catch (err) {
        // Late attach: goose refuses an id we never saw but names the
        // current one -- adopt it and go again.
        const actual = actualRunIdFrom(err);
        if (!actual || actual === expected) throw err;
        noteActiveRun({ runId: actual });
        result = await s.steer(runSid, actual, text);
      }
      if (result.runId) noteActiveRun({ runId: result.runId });
      // The pickup may already have flipped it to delivered: keep that.
      setSteer({ state: "queued", messageId: result.messageId }, true);
    } catch (err) {
      if (isNoActiveRun(err)) noteActiveRun(null);
      setSteer({ state: "failed", message: steerErrorMessage(err, t) });
    } finally {
      setSteerBusy(false);
    }
  };

  // Stop the agent's turn: session/cancel naming the run session, relayed by
  // the tee. A human abort fails the stage -- hence the confirm.
  const cancelRunTurn = () => {
    setConfirmCancel(false);
    const s = sessionRef.current;
    const runSid = runSessionRef.current;
    if (!s || !runSid) return;
    s.cancelSession(runSid);
    pushItem({
      kind: "notice",
      id: nextId(),
      text: t("agentic.chat.cancelRequested"),
    });
  };

  // Steer needs a live connection, the run's session, and a turn that is not
  // known to be over (unknown is fine: the run id is discovered on send).
  const canSteer = !!session && !!runSession && activeRun !== null && !finished;

  const manualRetry = () => {
    dropTimesRef.current = [];
    setAttempt((a) => a + 1);
  };

  const reconnectLabel = lastSessionIdRef.current
    ? t("agentic.chat.reconnect")
    : t("agentic.chat.retry");

  const botName = agentRef ?? t("agentic.chat.agentName");
  const userName = t("agentic.chat.you");

  const view: ChatView = finished
    ? { kind: "finished" }
    : !canOpenSession
      ? { kind: "forbidden" }
      : !dialable
        ? { kind: "waiting" }
        : conn;

  const notice = (() => {
    switch (view.kind) {
      case "waiting":
        return acpReady && phase === "Running"
          ? t("agentic.chat.waitingForAcp", {
              detail: acpReady.message || acpReady.reason || "",
            })
          : t("agentic.chat.waitingForSandbox", {
              phase: phase ?? "Pending",
            });
      case "connecting":
        return t("agentic.chat.startingAcp", { seconds: view.seconds });
      case "reconnecting":
        return t("agentic.chat.reconnectingToAgent");
      default:
        return null;
    }
  })();

  const chatbot = (
    <Chatbot
      displayMode={
        expanded ? ChatbotDisplayMode.fullscreen : ChatbotDisplayMode.embedded
      }
      className="agent-run-chatbot"
      ariaLabel={t("agentic.chat.title")}
    >
      <ChatbotHeader>
        <ChatbotHeaderMain>
          <ChatbotHeaderTitle>
            <span className="agent-run-chatbot-title">
              {botName}
              <ConnBadge view={view} phase={phase} />
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
          <Tooltip
            content={
              expanded ? t("agentic.chat.collapse") : t("agentic.chat.expand")
            }
          >
            <Button
              variant="plain"
              aria-label={
                expanded ? t("agentic.chat.collapse") : t("agentic.chat.expand")
              }
              aria-pressed={expanded}
              icon={expanded ? <CompressIcon /> : <ExpandIcon />}
              onClick={() => setExpanded((v) => !v)}
            />
          </Tooltip>
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
              onAsk={answerAsk}
            />
          ))}
          {notice && (
            <div className="chat-conn-notice">
              <Spinner size="sm" aria-label={notice} /> <span>{notice}</span>
            </div>
          )}
          {view.kind === "connected" && items.length === 0 && (
            <div className="chat-meta">
              {t("agentic.chat.connectedHint")}{" "}
              {t("agentic.chat.session", { sessionId: view.sessionId })}
            </div>
          )}
          {view.kind === "forbidden" && (
            <ChatbotAlert
              variant="info"
              title={t("agentic.chat.noSessionAccessTitle")}
            >
              {t("agentic.chat.noSessionAccessBody")}
            </ChatbotAlert>
          )}
          {view.kind === "disconnected" && (
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
          {view.kind === "failed" && (
            <ChatbotAlert
              variant="danger"
              title={t("agentic.chat.connectionFailed", {
                message: view.message,
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
          {view.kind === "finished" &&
            (items.length > 0 ? (
              <MessageDivider
                content={t("agentic.chat.runFinishedLive", { phase })}
              />
            ) : (
              <ChatbotAlert
                variant="info"
                title={t("agentic.chat.runAlreadyFinished", { phase })}
              >
                {t("agentic.chat.finishedNoTranscript")}
              </ChatbotAlert>
            ))}
        </MessageBox>
      </ChatbotContent>
      {/* Steering (and stopping a turn) is an intervention — hidden unless
          the deployment opts in. Permission prompts stay answerable above:
          those are solicited by the agent, and an unanswered ask hangs the
          turn. */}
      {isAgenticSteerEnabled && canIntervene && (
        <ChatbotFooter>
          <MessageBar
            onSendMessage={(m) => void steerRun(m)}
            hasAttachButton={false}
            alwayShowSendButton
            isSendButtonDisabled={!canSteer || steerBusy}
            isDisabled={!session}
            placeholder={
              activeRun === null
                ? t("agentic.chat.steerTurnOver")
                : t("agentic.chat.steerPlaceholder")
            }
            buttonProps={{
              send: { tooltipContent: t("agentic.chat.steerSend") },
            }}
          />
          <div className="chat-steer-footer">
            <ChatbotFootnote
              label={t("agentic.chat.steerFootnote")}
              popover={{
                title: t("agentic.chat.steerFootnoteTitle"),
                description: t("agentic.chat.steerFootnoteBody"),
              }}
            />
            <Button
              variant="link"
              isDanger
              size="sm"
              icon={<StopCircleIcon />}
              isDisabled={!canSteer}
              onClick={() => setConfirmCancel(true)}
            >
              {t("agentic.chat.cancelTurn")}
            </Button>
          </div>
          <ConfirmDialog
            isOpen={confirmCancel}
            title={t("agentic.chat.cancelTurnTitle")}
            titleIconVariant="warning"
            message={t("agentic.chat.cancelTurnBody")}
            confirmBtnLabel={t("agentic.chat.cancelTurnConfirm")}
            cancelBtnLabel={t("actions.cancel")}
            confirmBtnVariant={ButtonVariant.danger}
            onClose={() => setConfirmCancel(false)}
            onCancel={() => setConfirmCancel(false)}
            onConfirm={cancelRunTurn}
          />
        </ChatbotFooter>
      )}
    </Chatbot>
  );
  // Expanded: PF's fullscreen mode is position: fixed, but the page's main
  // region is its own stacking context, so inline it would still sit under
  // the masthead and sidebar -- portal it to <body> for the duration.
  return expanded ? createPortal(chatbot, document.body) : chatbot;
}

// ------------------------------------------------------------------ steer

/**
 * expectedRunId for a steer sent before this viewer has seen the run id.
 * goose checks the id before queuing anything and answers a mismatch with
 * the current id in the error data -- the only way a viewer that attached
 * mid-turn can learn it, since the tee replays harness frames to late
 * viewers but not goose's one-off session_info_update.
 */
const DISCOVER_RUN_ID = "discover";

/** The run id goose reports on an expectedRunId mismatch, if any. */
function actualRunIdFrom(err: unknown): string | undefined {
  const { data } = acpErrorInfo(err);
  return isRecord(data) && typeof data.actualRunId === "string"
    ? data.actualRunId
    : undefined;
}

function isNoActiveRun(err: unknown): boolean {
  const { data } = acpErrorInfo(err);
  return typeof data === "string" && data.includes("no active run");
}

function steerErrorMessage(
  err: unknown,
  t: (key: string, opts?: Record<string, unknown>) => string
): string {
  const { code } = acpErrorInfo(err);
  const message = errorMessage(err);
  if (
    code === -32601 &&
    /HARNESS_HITL_STEER|steering is disabled/i.test(message)
  ) {
    return t("agentic.chat.steerDisabledByPolicy");
  }
  if (isNoActiveRun(err)) return t("agentic.chat.steerNoActiveRun");
  return message;
}

function SteerStatus({ steer }: { steer: SteerState }) {
  const { t } = useTranslation();
  switch (steer.state) {
    case "sending":
      return (
        <Label isCompact color="blue" icon={<Spinner size="sm" />}>
          {t("agentic.chat.steerSending")}
        </Label>
      );
    case "queued":
      return (
        <Label isCompact color="blue" icon={<PendingIcon />}>
          {t("agentic.chat.steerQueued")}
        </Label>
      );
    case "delivered":
      return (
        <Label isCompact color="green" icon={<CheckCircleIcon />}>
          {t("agentic.chat.steerDelivered")}
        </Label>
      );
    case "dropped":
      return (
        <Label isCompact color="orange">
          {t("agentic.chat.steerDropped")}
        </Label>
      );
    case "failed":
      return (
        <Label isCompact color="red" icon={<ExclamationCircleIcon />}>
          {t("agentic.chat.steerFailed", { message: steer.message })}
        </Label>
      );
  }
}

// -------------------------------------------------------- connection badge

function ConnBadge({ view, phase }: { view: ChatView; phase?: AgentRunPhase }) {
  const { t } = useTranslation();
  switch (view.kind) {
    case "waiting":
      return (
        <Label isCompact color="grey" icon={<Spinner size="sm" />}>
          {t("agentic.chat.waiting")}
        </Label>
      );
    case "connecting":
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
    case "forbidden":
      return (
        <Label isCompact color="grey">
          {t("agentic.chat.noAccessShort")}
        </Label>
      );
    case "finished":
      return <PhaseLabel phase={phase} />;
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

/** A load_skill call: the skill named, and the supporting file within it if one was asked for. */
interface SkillLoad {
  skill: string;
  file?: string;
}

/**
 * goose loads a skill's content on demand through its `load_skill` tool
 * (ADR 0014): the call is titled with the tool name and carries the skill
 * as `rawInput.name` -- `"<skill>"`, or `"<skill>/relative/file"` for one
 * of its supporting files. Either signal (title or input) identifies it.
 */
function skillLoadOf(
  item: Pick<ToolItem, "title" | "input">
): SkillLoad | undefined {
  const name = item.input?.name;
  if (typeof name !== "string" || !name.trim()) return undefined;
  if (!/^load_skill\b/i.test(item.title) && !/skill/i.test(item.title)) {
    return undefined;
  }
  const slash = name.indexOf("/");
  if (slash < 0) return { skill: name };
  const file = name.slice(slash + 1);
  return file
    ? { skill: name.slice(0, slash), file }
    : { skill: name.slice(0, slash) };
}

function skillLoadText(
  load: SkillLoad,
  status: string,
  t: (key: string, opts?: Record<string, unknown>) => string
): string {
  const { skill: name, file } = load;
  if (status === "completed") {
    return file
      ? t("agentic.chat.loadedSkillFile", { name, file })
      : t("agentic.chat.loadedSkill", { name });
  }
  const text =
    status === "failed" || status === "error"
      ? t("agentic.chat.skillLoadFailed", { name })
      : t("agentic.chat.loadingSkill", { name });
  return file ? `${text} · ${file}` : text;
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
  onAsk,
}: {
  item: ChatItem;
  botName: string;
  userName: string;
  onPermission: (id: number, optionId: string | null) => void;
  onAsk: (id: number, outcome: ElicitationOutcome) => void;
}) {
  const { t } = useTranslation();
  switch (item.kind) {
    case "user":
      return (
        <Message
          role="user"
          avatar={USER_AVATAR}
          name={
            item.steer?.state === "delivered" && item.steer.streamed
              ? t("agentic.chat.viewer")
              : userName
          }
          timestamp={messageTime(item.at)}
          content={item.text}
          extraContent={
            item.steer
              ? { afterMainContent: <SteerStatus steer={item.steer} /> }
              : undefined
          }
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
    case "tool": {
      const skillLoad = skillLoadOf(item);
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
                {skillLoad ? (
                  <>
                    <Icon>
                      <BookOpenIcon aria-hidden="true" />
                    </Icon>{" "}
                    {skillLoadText(skillLoad, item.status, t)}
                  </>
                ) : (
                  item.title || t("agentic.chat.toolCall")
                )}{" "}
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
    }
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
    case "notice":
      return <MessageDivider content={item.text} />;
    case "ask":
      return <AskView item={item} botName={botName} onAsk={onAsk} />;
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

// --------------------------------------------------------------- ask view

/** Answer values keyed by property name, as typed (strings) or toggled. */
type AskDraft = Record<string, string | boolean | undefined>;

function askDefaults(schema: ElicitationRequest["requestedSchema"]): AskDraft {
  const draft: AskDraft = {};
  for (const [name, prop] of Object.entries(schema.properties)) {
    if (prop.type === "boolean") {
      draft[name] = prop.default === true;
    } else if (prop.default !== undefined && prop.default !== null) {
      draft[name] = String(prop.default);
    }
  }
  return draft;
}

/** Enum choices of a string property: plain `enum` or titled `oneOf`. */
function askChoices(
  prop: ElicitationProperty
): { value: string; label: string }[] | null {
  if (Array.isArray(prop.oneOf) && prop.oneOf.length > 0) {
    return prop.oneOf
      .filter((o) => isRecord(o) && typeof o.const === "string")
      .map((o) => ({ value: o.const, label: o.title || o.const }));
  }
  if (Array.isArray(prop.enum) && prop.enum.length > 0) {
    return prop.enum
      .filter((v): v is string => typeof v === "string")
      .map((v) => ({ value: v, label: v }));
  }
  return null;
}

/** Coerce the typed draft into schema-shaped content. */
function askContent(
  schema: ElicitationRequest["requestedSchema"],
  draft: AskDraft
): Record<string, unknown> {
  const content: Record<string, unknown> = {};
  for (const [name, prop] of Object.entries(schema.properties)) {
    const v = draft[name];
    if (v === undefined || v === "") continue;
    if (prop.type === "boolean") content[name] = v === true;
    else if (prop.type === "number" || prop.type === "integer") {
      const n = Number(v);
      if (!Number.isNaN(n))
        content[name] = prop.type === "integer" ? Math.trunc(n) : n;
    } else content[name] = String(v);
  }
  return content;
}

function AskView({
  item,
  botName,
  onAsk,
}: {
  item: AskItem;
  botName: string;
  onAsk: (id: number, outcome: ElicitationOutcome) => void;
}) {
  const { t } = useTranslation();
  const [draft, setDraft] = useState<AskDraft>(() => askDefaults(item.schema));
  const names = Object.keys(item.schema.properties);
  const missing = item.schema.required.filter((r) => {
    const v = draft[r];
    const prop = item.schema.properties[r];
    if (prop?.type === "boolean") return false;
    return v === undefined || v === "";
  });
  const answered = item.outcome;

  const summary = (() => {
    if (!answered) return null;
    if (answered.action !== "accept") return t("agentic.chat.askDeclined");
    const parts = Object.entries(answered.content ?? {}).map(([k, v]) =>
      names.length > 1 ? `${k}: ${String(v)}` : String(v)
    );
    return t("agentic.chat.askAnswered", { answer: parts.join(", ") });
  })();

  return (
    <div className="chat-permission chat-ask">
      <div className="chat-permission-title">
        {t("agentic.chat.askTitle", { name: botName })}
      </div>
      <div className="chat-ask-message">{item.message}</div>
      {summary ? (
        <Label color="blue">{summary}</Label>
      ) : (
        <Form
          isHorizontal={false}
          onSubmit={(e) => {
            e.preventDefault();
            if (missing.length === 0) {
              onAsk(item.id, {
                action: "accept",
                content: askContent(item.schema, draft),
              });
            }
          }}
        >
          {names.map((name) => {
            const prop = item.schema.properties[name];
            const required = item.schema.required.includes(name);
            const choices = prop.type === "array" ? null : askChoices(prop);
            const label = prop.title || (names.length > 1 ? name : "");
            const fieldId = `ask-${item.id}-${name}`;
            const field = (() => {
              if (choices) {
                return choices.map((c) => (
                  <Radio
                    key={c.value}
                    id={`${fieldId}-${c.value}`}
                    name={fieldId}
                    label={c.label}
                    isChecked={draft[name] === c.value}
                    onChange={() =>
                      setDraft((d) => ({ ...d, [name]: c.value }))
                    }
                  />
                ));
              }
              if (prop.type === "boolean") {
                return (
                  <Checkbox
                    id={fieldId}
                    label={prop.description || label || name}
                    isChecked={draft[name] === true}
                    onChange={(_e, checked) =>
                      setDraft((d) => ({ ...d, [name]: checked }))
                    }
                  />
                );
              }
              if (prop.type === "number" || prop.type === "integer") {
                return (
                  <TextInput
                    id={fieldId}
                    type="number"
                    value={typeof draft[name] === "string" ? draft[name] : ""}
                    onChange={(_e, v) => setDraft((d) => ({ ...d, [name]: v }))}
                  />
                );
              }
              return (
                <TextArea
                  id={fieldId}
                  aria-label={label || name}
                  resizeOrientation="vertical"
                  rows={2}
                  value={typeof draft[name] === "string" ? draft[name] : ""}
                  onChange={(_e, v) => setDraft((d) => ({ ...d, [name]: v }))}
                />
              );
            })();
            return (
              <FormGroup
                key={name}
                fieldId={fieldId}
                label={label || undefined}
                isRequired={required}
                role={choices ? "radiogroup" : undefined}
              >
                {field}
                {prop.description && !choices && prop.type !== "boolean" && (
                  <div className="chat-meta">{prop.description}</div>
                )}
              </FormGroup>
            );
          })}
          <div className="chat-permission-actions">
            <Button
              size="sm"
              variant="primary"
              type="submit"
              isDisabled={missing.length > 0}
            >
              {t("agentic.chat.askAnswer")}
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => onAsk(item.id, { action: "decline" })}
            >
              {t("agentic.chat.askDecline")}
            </Button>
          </div>
          <div className="chat-meta">{t("agentic.chat.askHint")}</div>
        </Form>
      )}
    </div>
  );
}
