import "@testing-library/jest-dom";
import { createElement } from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

import type {
  AgentRun,
  AgentWorkflowRun,
  AgentWorkflowRunPhase,
} from "@app/api/agentic/contract";

import WorkflowRunDetailPage from "./workflow-run-detail-page";

const mockUseFetchWorkflowRun = jest.fn();
const mockUseFetchAgentRun = jest.fn();
const mockChatPanel = jest.fn();

jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useHistory: () => ({ push: jest.fn() }),
  useParams: () => ({ runName: "workflow-run" }),
}));

jest.mock("@app/queries/workflow-runs", () => ({
  useFetchWorkflowRun: (...args: unknown[]) => mockUseFetchWorkflowRun(...args),
}));

jest.mock("@app/queries/agent-runs", () => ({
  useFetchAgentRun: (...args: unknown[]) => mockUseFetchAgentRun(...args),
}));

jest.mock("@app/queries/applications", () => ({
  useFetchApplications: () => ({ data: [], error: null }),
}));

jest.mock("@app/auth", () => ({
  useHasSomeScopes: () => true,
}));

jest.mock("@app/pages/agent-runs/components/ChatPanel", () => ({
  ChatPanel: (props: unknown) => {
    mockChatPanel(props);
    return createElement("div", { "data-testid": "chat-panel" });
  },
}));

const workflowRun = (
  phase: AgentWorkflowRunPhase,
  stagePhase: "Pending" | "Running" | "Succeeded" | "Failed",
  agentRunName?: string
): AgentWorkflowRun => ({
  metadata: {
    name: "workflow-run",
    creationTimestamp: "2026-09-08T12:00:00Z",
  },
  spec: {
    workflowRef: "workflow",
    env: [{ name: "TARGET_BRANCH", value: "migration/demo" }],
  },
  status: {
    phase,
    currentStage: "plan",
    stages: [{ name: "plan", phase: stagePhase, agentRunName }],
  },
});

const agentRun: AgentRun = {
  metadata: { name: "ui-plan" },
  spec: { agentRef: "planner" },
  status: {
    phase: "Running",
    conditions: [{ type: "ACPReady", status: "True" }],
  },
};

describe("workflow live-stage viewer", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("automatically mounts the active child AgentRun viewer", () => {
    mockUseFetchWorkflowRun.mockReturnValue({
      workflowRun: workflowRun("Running", "Running", "ui-plan"),
      isLoading: false,
      fetchError: null,
    });
    mockUseFetchAgentRun.mockReturnValue({
      agentRun,
      isLoading: false,
      fetchError: null,
    });

    render(
      <MemoryRouter>
        <WorkflowRunDetailPage />
      </MemoryRouter>
    );

    expect(mockUseFetchAgentRun).toHaveBeenCalledWith("ui-plan");
    expect(
      screen.getByText("agentic.workflowRuns.approvalViewerTitle")
    ).toBeInTheDocument();
    expect(screen.getByTestId("chat-panel")).toBeInTheDocument();
    expect(mockChatPanel).toHaveBeenCalledWith(
      expect.objectContaining({
        runName: "ui-plan",
        status: agentRun.status,
        agentRef: "planner",
        targetBranch: "migration/demo",
      })
    );
  });

  it("does not mount a viewer after the workflow finishes", () => {
    mockUseFetchWorkflowRun.mockReturnValue({
      workflowRun: workflowRun("Succeeded", "Succeeded", "ui-plan"),
      isLoading: false,
      fetchError: null,
    });
    mockUseFetchAgentRun.mockReturnValue({
      agentRun: undefined,
      isLoading: false,
      fetchError: null,
    });

    render(
      <MemoryRouter>
        <WorkflowRunDetailPage />
      </MemoryRouter>
    );

    expect(mockUseFetchAgentRun).toHaveBeenCalledWith("");
    expect(
      screen.queryByText("agentic.workflowRuns.approvalViewerTitle")
    ).not.toBeInTheDocument();
    expect(screen.queryByTestId("chat-panel")).not.toBeInTheDocument();
  });
});
