import { waitFor } from "@testing-library/react";

import { AcpSession, GOOSE_UPDATE_METHOD } from "./acp";

class FakeWebSocket extends EventTarget {
  static OPEN = 1;
  static current: FakeWebSocket;
  static rejectInitialize = false;
  static holdInitialize = false;
  readyState = FakeWebSocket.OPEN;

  constructor(_url: string) {
    super();
    FakeWebSocket.current = this;
  }

  send(text: string): void {
    const request = JSON.parse(text);
    if (request.method === "initialize") {
      if (FakeWebSocket.holdInitialize) return;
      queueMicrotask(() => {
        this.receive({
          jsonrpc: "2.0",
          id: request.id,
          ...(FakeWebSocket.rejectInitialize
            ? { error: { code: -32000, message: "Initialization failed" } }
            : {
                result: {
                  protocolVersion: 1,
                  agentCapabilities: { loadSession: true },
                },
              }),
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
    this.dispatchEvent(new CloseEvent("close", { code: 1000 }));
  }
}

const originalWebSocket = globalThis.WebSocket;

beforeEach(() => {
  FakeWebSocket.rejectInitialize = false;
  FakeWebSocket.holdInitialize = false;
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

describe("ACP connection failure", () => {
  it("closes a socket whose initialization fails before returning a session", async () => {
    FakeWebSocket.rejectInitialize = true;
    const onUpdate = jest.fn();
    await expect(
      AcpSession.connect({
        url: "ws://fixture/acp",
        callbacks: { onUpdate },
      })
    ).rejects.toThrow("Initialization failed");
    const socket = FakeWebSocket.current;
    expect(socket.readyState).toBe(3);
    socket.receive({
      jsonrpc: "2.0",
      method: "session/update",
      params: {
        sessionId: "stale-session",
        update: { sessionUpdate: "usage_update", inputTokens: 99 },
      },
    });
    await Promise.resolve();
    expect(onUpdate).not.toHaveBeenCalled();
  });
});

describe("ACP connection cancellation", () => {
  it("closes a socket aborted during initialization", async () => {
    FakeWebSocket.holdInitialize = true;
    const abort = new AbortController();
    const pending = AcpSession.connect({
      url: "ws://fixture/acp",
      signal: abort.signal,
    });
    const rejected = expect(pending).rejects.toThrow("closed");
    abort.abort();
    await rejected;
    expect(FakeWebSocket.current.readyState).toBe(3);
  });

  it("ignores frames already queued when the session closes", async () => {
    const onUpdate = jest.fn();
    const onPermissionRequest = jest.fn();
    const session = await AcpSession.connect({
      url: "ws://fixture/acp",
      callbacks: { onUpdate, onPermissionRequest },
    });
    FakeWebSocket.current.receive({
      jsonrpc: "2.0",
      method: "session/update",
      params: {
        sessionId: "old-session",
        update: { sessionUpdate: "usage_update", inputTokens: 99 },
      },
    });
    FakeWebSocket.current.receive({
      jsonrpc: "2.0",
      id: "stale-ask",
      method: "session/request_permission",
      params: { sessionId: "old-session", options: [] },
    });
    await session.close();
    expect(onUpdate).not.toHaveBeenCalled();
    expect(onPermissionRequest).not.toHaveBeenCalled();
  });
});
