import { waitFor } from "@testing-library/react";

import { AcpSession, GOOSE_UPDATE_METHOD } from "./acp";

class FakeWebSocket extends EventTarget {
  static OPEN = 1;
  static current: FakeWebSocket;
  readyState = FakeWebSocket.OPEN;

  constructor(_url: string) {
    super();
    FakeWebSocket.current = this;
  }

  send(text: string): void {
    const request = JSON.parse(text);
    if (request.method === "initialize") {
      queueMicrotask(() => {
        this.receive({
          jsonrpc: "2.0",
          id: request.id,
          result: {
            protocolVersion: 1,
            agentCapabilities: { loadSession: true },
          },
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
    this.dispatchEvent(new CloseEvent("close", { code: 1000 }));
  }
}

const originalWebSocket = globalThis.WebSocket;

beforeEach(() => {
  Object.defineProperty(globalThis, "WebSocket", {
    configurable: true,
    value: FakeWebSocket,
  });
});

afterEach(() => {
  Object.defineProperty(globalThis, "WebSocket", {
    configurable: true,
    value: originalWebSocket,
  });
});

describe("ACP runtime usage notifications", () => {
  it.each([
    "session/update",
    GOOSE_UPDATE_METHOD,
    "_lightspeed/session/update",
  ])("delivers %s snapshots with their session identity", async (method) => {
    const onUpdate = jest.fn();
    const session = await AcpSession.connect({
      url: "ws://fixture/acp",
      callbacks: { onUpdate },
    });
    const update = {
      sessionUpdate: "usage_update",
      inputTokens: 40,
      outputTokens: 0,
    };
    FakeWebSocket.current.receive({
      jsonrpc: "2.0",
      method,
      params: { sessionId: "run-session", update },
    });

    await waitFor(() =>
      expect(onUpdate).toHaveBeenCalledWith(update, "run-session")
    );
    expect(onUpdate).toHaveBeenCalledTimes(1);
    await session.close();
  });
});
