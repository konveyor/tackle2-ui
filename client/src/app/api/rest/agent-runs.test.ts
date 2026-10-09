import axios from "axios";

import { createAgentRun, createWorkflowRun } from "./agent-runs";

jest.mock("axios");

const mockedAxios = jest.mocked(axios);

describe("agentic run request serialization", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedAxios.post.mockResolvedValue({ data: { metadata: {}, spec: {} } });
  });

  it("sends the AgentRun supervision mode in execution", async () => {
    await createAgentRun({
      agentRef: "migrate",
      params: { dry_run: "true", attempts: "3" },
      mode: "approve",
    });

    expect(mockedAxios.post).toHaveBeenCalledWith(expect.any(String), {
      metadata: { generateName: "ui-" },
      spec: {
        agentRef: "migrate",
        params: [
          { name: "dry_run", value: "true" },
          { name: "attempts", value: "3" },
        ],
        execution: { mode: "approve" },
      },
    });
  });

  it("sends askUser alongside the supervision mode in execution", async () => {
    await createAgentRun({
      agentRef: "migrate",
      mode: "approve",
      askUser: true,
    });

    expect(mockedAxios.post).toHaveBeenCalledWith(expect.any(String), {
      metadata: { generateName: "ui-" },
      spec: {
        agentRef: "migrate",
        execution: { mode: "approve", askUser: true },
      },
    });
  });

  it("omits askUser from execution unless the run opts in", async () => {
    await createAgentRun({ agentRef: "migrate", mode: "auto", askUser: false });

    const body = mockedAxios.post.mock.calls[0][1] as {
      spec: { execution?: Record<string, unknown> };
    };
    expect(body.spec.execution).toEqual({ mode: "auto" });
  });

  it("preserves workflow run parameter names for controller-side routing", async () => {
    await createWorkflowRun({
      workflowRef: "migrate-app",
      params: { application_name: "coolstore", verify_only: "false" },
    });

    expect(mockedAxios.post).toHaveBeenCalledWith(expect.any(String), {
      metadata: { generateName: "ui-" },
      spec: {
        workflowRef: "migrate-app",
        params: [
          { name: "application_name", value: "coolstore" },
          { name: "verify_only", value: "false" },
        ],
      },
    });
  });
});
