import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Alert,
  AlertActionLink,
  Button,
  ExpandableSection,
  Icon,
  Label,
  Spinner,
  TextArea,
} from "@patternfly/react-core";
import {
  CheckCircleIcon,
  ExclamationCircleIcon,
} from "@patternfly/react-icons";

import { AcpSession } from "@app/api/agentic/acp";
import type {
  PermissionOutcome,
  PermissionRequest,
  SessionUpdate,
  ToolCallDiff,
} from "@app/api/agentic/acp";
import { isTerminalPhase, waitForRunning } from "@app/api/agentic/contract";
import { getAgentRun, getAgenticAcpUrl } from "@app/api/rest";

import "../agent-runs.css";

// ------------------------------------------------------------- chat model

interface UserItem {
  kind: "user";
  id: number;
  text: string;
}
interface AgentItem {
  kind: "agent";
  id: number;
  text: string;
}
interface ThoughtItem {
  kind: "thought";
  id: number;
  text: string;
}
interface ToolItem {
  kind: "tool";
  id: number;
  toolCallId: string;
  title: string;
  status: string;
  detail: string;
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
  | PermissionItem
  | StopItem
  | ErrorItem;

type ConnState =
  | { kind: "waiting"; phase?: string; seconds?: number }
  | { kind: "connecting" }
  | { kind: "connected"; sessionId: string }
  | { kind: "disconnected" }
  | { kind: "failed"; message: string }
  | { kind: "finished"; phase: string };

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
      return [...items, { kind: "agent", id: nextId(), text }];
    }
    case "agent_thought_chunk": {
      const text = contentText(u.content);
      if (!text) return items;
      const last = items[items.length - 1];
      if (last && last.kind === "thought") {
        return [...items.slice(0, -1), { ...last, text: last.text + text }];
      }
      return [...items, { kind: "thought", id: nextId(), text }];
    }
    case "tool_call": {
      return [
        ...items,
        {
          kind: "tool",
          id: nextId(),
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

// --------------------------------------------------- error message helper

function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

// ----------------------------------------------------------------- panel

interface ChatPanelProps {
  runName: string;
}

export function ChatPanel({ runName }: ChatPanelProps) {
  const { t } = useTranslation();
  const [conn, setConn] = useState<ConnState>({ kind: "waiting" });
  const [items, setItems] = useState<ChatItem[]>([]);
  const [session, setSession] = useState<AcpSession | null>(null);
  const [input, setInput] = useState("");
  const [turnActive, setTurnActive] = useState(false);
  const [attempt, setAttempt] = useState(0); // bumped by Retry / Reconnect

  const idRef = useRef(0);
  const sessionRef = useRef<AcpSession | null>(null);
  const lastSessionIdRef = useRef<string | null>(null);
  const permissionResolvers = useRef(
    new Map<number, (o: PermissionOutcome) => void>()
  );
  const logRef = useRef<HTMLDivElement | null>(null);

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

  // Connect flow: wait for Running (status line), open the ACP WebSocket,
  // then new-session (or load-session to replay history after a reconnect).
  useEffect(() => {
    let disposed = false;
    const abort = new AbortController();
    let localSession: AcpSession | null = null;

    const connect = async () => {
      setConn({ kind: "waiting" });
      const current = await getAgentRun(runName);
      const phase = current.status?.phase ?? "Pending";
      if (isTerminalPhase(phase)) {
        setConn({ kind: "finished", phase });
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
      setConn({ kind: "connecting" });
      localSession = await AcpSession.connect({
        url: getAgenticAcpUrl(runName),
        callbacks: {
          onUpdate: handleUpdate,
          onPermissionRequest: handlePermission,
        },
      });
      if (disposed) {
        void localSession.close();
        return;
      }
      sessionRef.current = localSession;
      localSession.onClosed(() => {
        if (!disposed) {
          setConn({ kind: "disconnected" });
          setSession(null);
        }
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

  // Keep the transcript pinned to the bottom as updates stream in.
  useEffect(() => {
    const el = logRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [items, conn]);

  const send = async () => {
    const text = input.trim();
    const s = session;
    if (!text || !s || turnActive) return;
    setInput("");
    pushItem({ kind: "user", id: nextId(), text });
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

  const reconnectLabel = lastSessionIdRef.current
    ? t("agentic.chat.reconnect")
    : t("agentic.chat.retry");

  return (
    <div className="chat-panel">
      <div className="chat-status">
        {conn.kind === "waiting" && (
          <>
            <Spinner size="sm" aria-label={t("agentic.chat.waiting")} />{" "}
            <span>
              {conn.phase
                ? t("agentic.chat.waitingForSandbox", {
                    phase: conn.phase,
                    seconds: conn.seconds,
                  })
                : t("agentic.chat.checkingRunStatus")}
            </span>
          </>
        )}
        {conn.kind === "connecting" && (
          <>
            <Spinner size="sm" aria-label={t("agentic.chat.connecting")} />{" "}
            <span>{t("agentic.chat.connectingToAcp")}</span>
          </>
        )}
        {conn.kind === "connected" && (
          <>
            <Label color="green">{t("terms.connected")}</Label>
            <span className="chat-status-detail">
              {t("agentic.chat.session", { sessionId: conn.sessionId })}
            </span>
          </>
        )}
        {conn.kind === "finished" && (
          <Alert
            variant="info"
            isInline
            isPlain
            title={t("agentic.chat.runAlreadyFinished", { phase: conn.phase })}
          />
        )}
        {conn.kind === "disconnected" && (
          <Alert
            variant="warning"
            isInline
            isPlain
            title={t("agentic.chat.disconnectedFromAgent")}
            actionLinks={
              <AlertActionLink onClick={() => setAttempt((a) => a + 1)}>
                {reconnectLabel}
              </AlertActionLink>
            }
          />
        )}
        {conn.kind === "failed" && (
          <Alert
            variant="danger"
            isInline
            isPlain
            title={t("agentic.chat.connectionFailed", {
              message: conn.message,
            })}
            actionLinks={
              <AlertActionLink onClick={() => setAttempt((a) => a + 1)}>
                {reconnectLabel}
              </AlertActionLink>
            }
          />
        )}
      </div>

      <div className="chat-log" ref={logRef}>
        {items.length === 0 && conn.kind === "connected" && (
          <div className="chat-meta">{t("agentic.chat.connectedHint")}</div>
        )}
        {items.map((item) => (
          <ChatItemView
            key={item.id}
            item={item}
            onPermission={choosePermission}
          />
        ))}
      </div>

      <div className="chat-input-row">
        <div className="chat-input-text">
          <TextArea
            aria-label={t("agentic.chat.messageToAgent")}
            value={input}
            onChange={(_e, v) => setInput(v)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void send();
              }
            }}
            rows={2}
            resizeOrientation="vertical"
            isDisabled={!session || turnActive}
            placeholder={t("agentic.chat.messagePlaceholder")}
          />
        </div>
        <div className="chat-input-actions">
          <Button
            variant="primary"
            onClick={() => void send()}
            isDisabled={!session || turnActive || !input.trim()}
            isLoading={turnActive}
          >
            {t("agentic.chat.send")}
          </Button>
          {turnActive && (
            <Button
              variant="secondary"
              onClick={() => void sessionRef.current?.cancel()}
            >
              {t("agentic.chat.cancelTurn")}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
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

function ChatItemView({
  item,
  onPermission,
}: {
  item: ChatItem;
  onPermission: (id: number, optionId: string | null) => void;
}) {
  const { t } = useTranslation();
  switch (item.kind) {
    case "user":
      return <div className="chat-bubble chat-user">{item.text}</div>;
    case "agent":
      return <div className="chat-bubble chat-agent">{item.text}</div>;
    case "thought":
      return <div className="chat-bubble chat-thought">{item.text}</div>;
    case "stop":
      return (
        <div className="chat-meta">
          {t("agentic.chat.turnEnded", { stopReason: item.stopReason })}
        </div>
      );
    case "error":
      return (
        <Alert variant="danger" isInline title={t("agentic.chat.chatError")}>
          {item.message}
        </Alert>
      );
    case "tool":
      return (
        <div className="chat-tool">
          <ExpandableSection
            toggleContent={
              <span className="chat-tool-toggle">
                <ToolStatusIcon status={item.status} />{" "}
                {item.title || t("agentic.chat.toolCall")}{" "}
                <Label color={toolStatusColor(item.status)} variant="outline">
                  {item.status}
                </Label>
              </span>
            }
          >
            <pre className="chat-tool-detail">
              {item.detail || t("agentic.chat.noOutputYet")}
            </pre>
          </ExpandableSection>
        </div>
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
