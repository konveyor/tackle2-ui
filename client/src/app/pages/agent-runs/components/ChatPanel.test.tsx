import type { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";

import { mintAcpNonce } from "@app/api/rest";

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
  static beforeInitialize?: (socket: FakeWebSocket) => boolean | void;
  static onLoadSession?: (socket: FakeWebSocket) => boolean | void;
  static loadSessionSupported = true;
  static rejectLoad = false;
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
          if (FakeWebSocket.beforeInitialize?.(this) === false) return;
        } else if (request.method === "session/load") {
          if (FakeWebSocket.onLoadSession?.(this) === false) return;
          if (FakeWebSocket.rejectLoad) {
            this.receive({
              jsonrpc: "2.0",
              id: request.id,
              error: { code: -32000, message: "Session unavailable" },
            });
            return;
          }
        }
        this.receive({
          jsonrpc: "2.0",
          id: request.id,
          result:
            request.method === "initialize"
              ? {
                  protocolVersion: 1,
                  agentCapabilities: {
                    loadSession: FakeWebSocket.loadSessionSupported,
                  },
                }
              : request.method === "session/new"
                ? { sessionId: "viewer-session" }
                : {},
        });
      });
    }
  }

  receive(frame: unknown): void {
    if (this.readyState !== FakeWebSocket.OPEN) return;
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
  FakeWebSocket.loadSessionSupported = true;
  FakeWebSocket.rejectLoad = false;
  jest.mocked(mintAcpNonce).mockReset().mockResolvedValue("fixture-nonce");
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

function renderPanel() {
  return render(
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
}

async function connectPanel() {
  renderPanel();
  await screen.findByText("terms.connected");
  return FakeWebSocket.current;
}

function receiveTool(socket: FakeWebSocket, toolCallId: string, text: string) {
  socket.receive({
    jsonrpc: "2.0",
    method: "session/update",
    params: {
      sessionId: "run-session",
      update: {
        sessionUpdate: "tool_call",
        toolCallId,
        title: "read_file",
        content: [{ type: "content", content: { type: "text", text } }],
      },
    },
  });
}

function receivePendingAsks(socket: FakeWebSocket) {
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
      options: [{ optionId: "allow", name: "Allow once", kind: "allow_once" }],
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
}

describe("permission action details", () => {
  it("keeps early asks on initial attach without a prior session", async () => {
    FakeWebSocket.beforeInitialize = (socket) => {
      receivePendingAsks(socket);
      receiveTool(socket, "initial-tool", "Initial output");
    };
    const socket = await connectPanel();
    expect(socket.sent).toContainEqual(
      expect.objectContaining({ method: "session/new" })
    );
    expect(socket.sent).not.toContainEqual(
      expect.objectContaining({ method: "session/load" })
    );
    expect(screen.getByText("Initial output")).toBeVisible();
    expect(screen.getByRole("button", { name: "Allow once" })).toBeVisible();
    expect(screen.getByRole("textbox", { name: "Database" })).toBeVisible();
  });

  it("closes an initializing socket on unmount without cancelling the agent's asks", async () => {
    FakeWebSocket.beforeInitialize = (socket) => {
      receivePendingAsks(socket);
      return false;
    };
    const panel = renderPanel();
    await screen.findByRole("button", { name: "Allow once" });
    const socket = FakeWebSocket.current;
    panel.unmount();
    await waitFor(() => expect(socket.readyState).toBe(3));
    expect(
      socket.sent.filter(
        (frame) =>
          typeof frame === "object" && frame !== null && "result" in frame
      )
    ).toEqual([]);
  });

  it.each(
    ["replay", "unsupported", "rejected"].flatMap((mode) =>
      ["goose", "lightspeed"].map((runtime) => ({ mode, runtime }))
    )
  )(
    "keeps $runtime usage and replacement asks with $mode session loading",
    async ({ mode, runtime }) => {
      jest.useFakeTimers({ doNotFake: ["queueMicrotask"] });
      const originalSocket = await connectPanel();
      await act(async () => {
        receiveTool(originalSocket, "old-tool", "Earlier tool output");
        receivePendingAsks(originalSocket);
      });
      FakeWebSocket.loadSessionSupported = mode !== "unsupported";
      FakeWebSocket.rejectLoad = mode === "rejected";
      const receiveUsage = (socket: FakeWebSocket) =>
        socket.receive({
          jsonrpc: "2.0",
          method:
            runtime === "goose"
              ? "_goose/unstable/session/update"
              : "_lightspeed/session/update",
          params: {
            sessionId: "run-session",
            update: {
              sessionUpdate: "usage_update",
              ...(runtime === "goose"
                ? {
                    accumulatedInputTokens: 40,
                    accumulatedOutputTokens: 10,
                    used: 100,
                    contextLimit: 200000,
                    accumulatedCost: 0,
                  }
                : { inputTokens: 40, outputTokens: 10 }),
            },
          },
        });
      FakeWebSocket.beforeInitialize = (socket) => {
        receivePendingAsks(socket);
        receiveUsage(socket);
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
      expect(screen.getByLabelText("agentic.chat.usage")).toHaveTextContent(
        runtime === "goose"
          ? "agentic.chat.usageChipContext"
          : "agentic.chat.usageTokens"
      );
      expect(reconnectedSocket.sent).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            method: mode === "unsupported" ? "session/new" : "session/load",
            params: expect.anything(),
          }),
        ])
      );
      if (mode === "replay") {
        expect(
          screen.queryByText("Earlier tool output")
        ).not.toBeInTheDocument();
        expect(screen.getByText("agentic.chat.noOutputYet")).toBeVisible();
        const history = screen.getByText("agentic.chat.noOutputYet");
        const permission = screen.getByRole("button", { name: "Allow once" });
        const question = screen.getByRole("textbox", { name: "Database" });
        expect(
          history.compareDocumentPosition(permission) &
            Node.DOCUMENT_POSITION_FOLLOWING
        ).toBeTruthy();
        expect(
          history.compareDocumentPosition(question) &
            Node.DOCUMENT_POSITION_FOLLOWING
        ).toBeTruthy();
      } else {
        expect(screen.getByText("Earlier tool output")).toBeVisible();
      }
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
    }
  );

  it.each(["nonce", "socket"])(
    "preserves history while reconnecting and after %s failure",
    async (failure) => {
      jest.useFakeTimers({ doNotFake: ["queueMicrotask"] });
      const originalSocket = await connectPanel();
      await act(async () => {
        receiveTool(originalSocket, "old-tool", "Earlier tool output");
        receivePendingAsks(originalSocket);
      });
      let resolveNonce!: (nonce: string) => void;
      let rejectNonce!: (error: Error) => void;
      jest.mocked(mintAcpNonce).mockImplementationOnce(
        () =>
          new Promise<string>((resolve, reject) => {
            resolveNonce = resolve;
            rejectNonce = reject;
          })
      );
      await act(async () => originalSocket.disconnect());
      await act(async () => jest.advanceTimersByTimeAsync(4_000));
      expect(screen.getByText("Earlier tool output")).toBeVisible();
      expect(
        screen.queryByRole("button", { name: "Allow once" })
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole("textbox", { name: "Database" })
      ).not.toBeInTheDocument();
      await act(async () => {
        if (failure === "nonce") {
          rejectNonce(new Error("Nonce unavailable"));
        } else {
          FakeWebSocket.beforeInitialize = (socket) => {
            receivePendingAsks(socket);
            socket.disconnect();
          };
          resolveNonce("replacement-nonce");
        }
      });
      expect(
        await screen.findByText("agentic.chat.connectionFailedHint")
      ).toBeVisible();
      expect(screen.getByText("Earlier tool output")).toBeVisible();
      expect(
        screen.queryByRole("button", { name: "Allow once" })
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole("textbox", { name: "Database" })
      ).not.toBeInTheDocument();
      expect(
        FakeWebSocket.current.sent.filter(
          (frame) =>
            typeof frame === "object" && frame !== null && "result" in frame
        )
      ).toEqual([]);
      expect(
        originalSocket.sent.filter(
          (frame) =>
            typeof frame === "object" && frame !== null && "result" in frame
        )
      ).toEqual([]);
    }
  );

  it.each([true, false])(
    "preserves history until replay finishes (success: %s)",
    async (success) => {
      jest.useFakeTimers({ doNotFake: ["queueMicrotask"] });
      const originalSocket = await connectPanel();
      await act(async () =>
        receiveTool(originalSocket, "same-tool", "Original output")
      );
      FakeWebSocket.onLoadSession = (socket) => {
        receiveTool(socket, "same-tool", "Replayed output");
        return false;
      };
      await act(async () => originalSocket.disconnect());
      await act(async () => jest.advanceTimersByTimeAsync(4_000));
      expect(screen.getByText("Original output")).toBeVisible();
      expect(screen.queryByText("Replayed output")).not.toBeInTheDocument();
      const replacement = FakeWebSocket.current;
      const load = replacement.sent.find(
        (frame): frame is { id: number; method: string } =>
          typeof frame === "object" &&
          frame !== null &&
          "method" in frame &&
          frame.method === "session/load"
      );
      expect(load).toBeDefined();
      await act(async () =>
        replacement.receive({
          jsonrpc: "2.0",
          id: load?.id,
          ...(success
            ? { result: {} }
            : { error: { code: -32000, message: "Session unavailable" } }),
        })
      );
      await screen.findByText("terms.connected");
      expect(screen.getByText("Replayed output")).toBeVisible();
      if (success) {
        expect(screen.queryByText("Original output")).not.toBeInTheDocument();
      } else {
        expect(screen.getByText("Original output")).toBeVisible();
        expect(replacement.sent).toContainEqual(
          expect.objectContaining({ method: "session/new" })
        );
      }
    }
  );

  it.each([null, {}])(
    "handles explicit empty tool arguments: %p",
    async (rawInput) => {
      const socket = await connectPanel();
      const update = (input: unknown) =>
        socket.receive({
          jsonrpc: "2.0",
          method: "session/update",
          params: {
            sessionId: "run-session",
            update: {
              sessionUpdate: "tool_call_update",
              toolCallId: "read-1",
              rawInput: input,
            },
          },
        });
      await act(async () => {
        receiveTool(socket, "read-1", "Tool output");
        update({ path: "/workspace/README.md" });
      });
      expect(screen.getByText(/\/workspace\/README.md/)).toBeVisible();
      await act(async () => update(rawInput));
      expect(
        screen.queryByText(/\/workspace\/README.md/)
      ).not.toBeInTheDocument();
      if (rawInput === null) {
        expect(
          screen.queryByText("agentic.chat.toolInput")
        ).not.toBeInTheDocument();
      } else {
        expect(screen.getByText("{}")).toBeVisible();
      }
    }
  );

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
