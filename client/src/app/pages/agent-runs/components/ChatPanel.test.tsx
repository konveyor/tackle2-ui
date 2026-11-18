import type { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";

import { ChatPanel } from "./ChatPanel";

// Keep the real chat state, ACP transport and permission controls. Only the
// chatbot's layout/markdown shell is replaced to avoid its ESM-only renderer.
jest.mock("@patternfly/chatbot", () => {
  const React = jest.requireActual("react");
  const Layout = ({ children }: { children?: ReactNode }, _ref?: unknown) =>
    children;
  return {
    Chatbot: Layout,
    ChatbotAlert: Layout,
    ChatbotContent: Layout,
    ChatbotDisplayMode: { embedded: "embedded", fullscreen: "fullscreen" },
    ChatbotFooter: Layout,
    ChatbotFootnote: Layout,
    ChatbotHeader: Layout,
    ChatbotHeaderActions: Layout,
    ChatbotHeaderMain: Layout,
    ChatbotHeaderTitle: Layout,
    MessageBox: React.forwardRef(Layout),
    Message: ({ toolResponse }: { toolResponse?: { body?: ReactNode } }) =>
      toolResponse?.body ?? null,
    MessageBar: () => null,
    MessageDivider: () => null,
  };
});

jest.mock("@app/auth", () => ({ useHasSomeScopes: () => true }));

jest.mock("@app/api/rest", () => ({
  mintAcpNonce: jest.fn().mockResolvedValue("fixture-nonce"),
  getAgenticAcpUrl: () => "ws://fixture/acp",
  getAgentRun: jest.fn().mockResolvedValue({ status: { phase: "Running" } }),
}));

class FakeWebSocket extends EventTarget {
  static OPEN = 1;
  static current: FakeWebSocket;
  static beforeInitialize?: (socket: FakeWebSocket) => void;
  static onLoadSession?: (socket: FakeWebSocket) => void;
  readyState = FakeWebSocket.OPEN;
  sent: unknown[] = [];

  constructor(_url: string) {
    super();
    FakeWebSocket.current = this;
  }

  send(text: string): void {
    const request = JSON.parse(text);
    this.sent.push(request);
    if (
      request.method === "initialize" ||
      request.method === "session/new" ||
      request.method === "session/load"
    ) {
      queueMicrotask(() => {
        if (request.method === "initialize") {
          FakeWebSocket.beforeInitialize?.(this);
        } else if (request.method === "session/load") {
          FakeWebSocket.onLoadSession?.(this);
        }
        this.receive({
          jsonrpc: "2.0",
          id: request.id,
          result:
            request.method === "initialize"
              ? {
                  protocolVersion: 1,
                  agentCapabilities: { loadSession: true },
                }
              : request.method === "session/new"
                ? { sessionId: "viewer-session" }
                : {},
        });
      });
    }
  }

  receive(frame: unknown): void {
    this.dispatchEvent(
      new MessageEvent("message", { data: JSON.stringify(frame) })
    );
  }

  close(): void {
    this.readyState = 3;
  }

  disconnect(): void {
    this.readyState = 3;
    this.dispatchEvent(new CloseEvent("close", { code: 1006 }));
  }
}

const originalWebSocket = globalThis.WebSocket;
const originalThrowIfAborted = Object.getOwnPropertyDescriptor(
  AbortSignal.prototype,
  "throwIfAborted"
);

beforeEach(() => {
  FakeWebSocket.beforeInitialize = undefined;
  FakeWebSocket.onLoadSession = undefined;
  Object.defineProperty(AbortSignal.prototype, "throwIfAborted", {
    configurable: true,
    value: function (this: AbortSignal) {
      if (this.aborted) throw this.reason;
    },
  });
  Object.defineProperty(globalThis, "WebSocket", {
    configurable: true,
    value: FakeWebSocket,
  });
});

afterEach(() => {
  jest.useRealTimers();
  if (originalThrowIfAborted) {
    Object.defineProperty(
      AbortSignal.prototype,
      "throwIfAborted",
      originalThrowIfAborted
    );
  } else {
    Reflect.deleteProperty(AbortSignal.prototype, "throwIfAborted");
  }
  Object.defineProperty(globalThis, "WebSocket", {
    configurable: true,
    value: originalWebSocket,
  });
});

async function connectPanel() {
  render(
    <QueryClientProvider client={new QueryClient()}>
      <ChatPanel
        runName="demo-run"
        status={{
          phase: "Running",
          conditions: [{ type: "ACPReady", status: "True" }],
        }}
      />
    </QueryClientProvider>
  );
  await screen.findByText(/agentic.chat.connectedHint/);
  return FakeWebSocket.current;
}

describe("permission action details", () => {
  it("keeps replayed asks actionable when they arrive before reconnect initialization", async () => {
    jest.useFakeTimers({ doNotFake: ["queueMicrotask"] });
    const originalSocket = await connectPanel();
    FakeWebSocket.beforeInitialize = (socket) => {
      socket.receive({
        jsonrpc: "2.0",
        id: "kperm-reconnect",
        method: "session/request_permission",
        params: {
          sessionId: "run-session",
          toolCall: {
            toolCallId: "read-reconnect",
            title: "read_file",
            rawInput: { file_path: "/workspace/repo/README.md" },
          },
          options: [
            { optionId: "allow", name: "Allow once", kind: "allow_once" },
          ],
        },
      });
      socket.receive({
        jsonrpc: "2.0",
        id: "kask-reconnect",
        method: "elicitation/create",
        params: {
          sessionId: "run-session",
          message: "Which database service should the plan use?",
          requestedSchema: {
            type: "object",
            properties: { database: { type: "string", title: "Database" } },
            required: ["database"],
          },
        },
      });
    };
    FakeWebSocket.onLoadSession = (socket) => {
      socket.receive({
        jsonrpc: "2.0",
        method: "session/update",
        params: {
          sessionId: "run-session",
          update: {
            sessionUpdate: "tool_call",
            toolCallId: "read-reconnect",
            title: "read_file",
            rawInput: { file_path: "/workspace/repo/README.md" },
            status: "pending",
          },
        },
      });
    };

    await act(async () => originalSocket.disconnect());
    await act(async () => jest.advanceTimersByTimeAsync(4_000));
    await screen.findByText("terms.connected");
    const reconnectedSocket = FakeWebSocket.current;
    expect(reconnectedSocket).not.toBe(originalSocket);
    expect(reconnectedSocket.sent).toContainEqual(
      expect.objectContaining({
        method: "session/load",
        params: expect.objectContaining({ sessionId: "viewer-session" }),
      })
    );
    expect(screen.getByText("agentic.chat.noOutputYet")).toBeVisible();
    expect(screen.getByRole("button", { name: "Allow once" })).toBeVisible();
    expect(
      screen.getByText("Which database service should the plan use?")
    ).toBeVisible();
    expect(screen.getByRole("textbox", { name: "Database" })).toBeVisible();
    const askReplies = (socket: FakeWebSocket) =>
      socket.sent.filter(
        (frame) =>
          typeof frame === "object" &&
          frame !== null &&
          "id" in frame &&
          (frame.id === "kperm-reconnect" || frame.id === "kask-reconnect")
      );
    expect(askReplies(reconnectedSocket)).toEqual([]);

    fireEvent.click(screen.getByRole("button", { name: "Allow once" }));
    fireEvent.change(screen.getByRole("textbox", { name: "Database" }), {
      target: { value: "Reuse existing PostgreSQL" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "agentic.chat.askAnswer" })
    );
    await waitFor(() =>
      expect(askReplies(reconnectedSocket)).toEqual([
        {
          jsonrpc: "2.0",
          id: "kperm-reconnect",
          result: { outcome: { outcome: "selected", optionId: "allow" } },
        },
        {
          jsonrpc: "2.0",
          id: "kask-reconnect",
          result: {
            action: "accept",
            content: { database: "Reuse existing PostgreSQL" },
          },
        },
      ])
    );
    expect(askReplies(originalSocket)).toEqual([]);
    expect(
      screen.queryByRole("button", { name: "Allow once" })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "agentic.chat.askAnswer" })
    ).not.toBeInTheDocument();
  });

  it("shows the requested arguments before approval and preserves the reply", async () => {
    const socket = await connectPanel();
    const rawInput = {
      path: "/workspace/pom.xml",
      instruction: "<script>alert('fixture')</script>",
    };
    await act(async () => {
      socket.receive({
        jsonrpc: "2.0",
        id: "kperm-1",
        method: "session/request_permission",
        params: {
          sessionId: "run-session",
          toolCall: {
            toolCallId: "read-1",
            title: "read_file",
            rawInput,
            content: [
              { type: "diff", path: "pom.xml", oldText: "old", newText: "new" },
            ],
          },
          options: [
            { optionId: "allow", name: "Allow once", kind: "allow_once" },
            { optionId: "reject", name: "Reject", kind: "reject_once" },
          ],
        },
      });
    });

    expect(
      screen.getByText(JSON.stringify(rawInput, null, 2), {
        normalizer: (value) => value,
      })
    ).toBeVisible();
    expect(document.querySelector("script")).toBeNull();
    expect(screen.getByText("pom.xml")).toBeVisible();
    expect(socket.sent).not.toContainEqual(
      expect.objectContaining({ id: "kperm-1" })
    );
    fireEvent.click(screen.getByRole("button", { name: "Allow once" }));
    await waitFor(() =>
      expect(socket.sent).toContainEqual({
        jsonrpc: "2.0",
        id: "kperm-1",
        result: { outcome: { outcome: "selected", optionId: "allow" } },
      })
    );
    expect(
      screen.queryByRole("button", { name: "Allow once" })
    ).not.toBeInTheDocument();
    expect(
      screen.getByText(JSON.stringify(rawInput, null, 2), {
        normalizer: (value) => value,
      })
    ).toBeVisible();
  });

  it("shows tool arguments while waiting for output, including later input updates", async () => {
    const socket = await connectPanel();
    const update = (u: Record<string, unknown>) =>
      socket.receive({
        jsonrpc: "2.0",
        method: "session/update",
        params: { sessionId: "run-session", update: u },
      });
    await act(async () =>
      update({
        sessionUpdate: "tool_call",
        toolCallId: "read-1",
        title: "read_file",
        rawInput: { path: "/workspace/README.md" },
      })
    );
    expect(screen.getByText(/\/workspace\/README.md/)).toBeVisible();
    await act(async () =>
      update({
        sessionUpdate: "tool_call_update",
        toolCallId: "read-1",
        rawInput: { path: "/workspace/pom.xml" },
      })
    );
    expect(screen.getByText(/\/workspace\/pom.xml/)).toBeVisible();
    expect(
      screen.queryByText(/\/workspace\/README.md/)
    ).not.toBeInTheDocument();
  });
});
