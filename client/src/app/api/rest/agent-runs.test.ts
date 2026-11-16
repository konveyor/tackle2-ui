import axios from "axios";

import {
  createAgentRun,
  createWorkflowRun,
  getAgent,
  getAgents,
  getWorkflow,
  getWorkflows,
} from "./agent-runs";

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

describe("agentic catalog list requests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedAxios.get.mockResolvedValue({ data: [] });
  });

  // The hub lists every CR in the namespace unless filtered; the catalog
  // keeps to hub-managed ones (konveyor/tackle2-hub#1186).
  it("lists only hub-managed agents", async () => {
    await getAgents();

    expect(mockedAxios.get).toHaveBeenCalledWith(
      "/hub/agentic/agents?filter=managed:true"
    );
  });

  it("lists only hub-managed workflows", async () => {
    await getWorkflows();

    expect(mockedAxios.get).toHaveBeenCalledWith(
      "/hub/agentic/workflows?filter=managed:true"
    );
  });

  it("gets a single agent or workflow by name without a filter", async () => {
    await getAgent("my-agent");
    await getWorkflow("my-workflow");

    expect(mockedAxios.get).toHaveBeenNthCalledWith(
      1,
      "/hub/agentic/agents/my-agent"
    );
    expect(mockedAxios.get).toHaveBeenNthCalledWith(
      2,
      "/hub/agentic/workflows/my-workflow"
    );
  });
});
