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
}));

class FakeWebSocket extends EventTarget {
  static OPEN = 1;
  static current: FakeWebSocket;
  readyState = FakeWebSocket.OPEN;
  sent: unknown[] = [];

  constructor(_url: string) {
    super();
    FakeWebSocket.current = this;
  }

  send(text: string): void {
    const request = JSON.parse(text);
    this.sent.push(request);
    if (request.method === "initialize" || request.method === "session/new") {
      queueMicrotask(() => {
        this.receive({
          jsonrpc: "2.0",
          id: request.id,
          result:
            request.method === "initialize"
              ? { protocolVersion: 1, agentCapabilities: {} }
              : { sessionId: "viewer-session" },
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
}

const originalWebSocket = globalThis.WebSocket;
const originalThrowIfAborted = Object.getOwnPropertyDescriptor(
  AbortSignal.prototype,
  "throwIfAborted"
);

beforeEach(() => {
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
