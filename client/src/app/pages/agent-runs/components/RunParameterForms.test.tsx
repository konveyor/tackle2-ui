import "@testing-library/jest-dom";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import type { AgentResource, AgentWorkflow } from "@app/api/agentic/contract";
import { getAgent } from "@app/api/rest";
import { CreateWorkflowRunModal } from "@app/pages/workflow-runs/components/CreateWorkflowRunModal";

import { CreateRunModal } from "./CreateRunModal";

const mockCreateAgentRun = jest.fn();
const mockCreateWorkflowRun = jest.fn();

const agent = (
  name: string,
  params: AgentResource["spec"]["params"]
): AgentResource => ({
  metadata: { name },
  spec: {
    image: "quay.io/konveyor/agent:latest",
    gateways: [{ ref: "default" }],
    params,
  },
});

const standaloneAgent = agent("standalone", [
  { name: "attempts", type: "number", required: true },
  { name: "dry_run", type: "boolean" },
]);
const planAgent = agent("plan", [
  { name: "plan_depth", type: "number", required: true },
]);
const verifyAgent = agent("verify", [{ name: "strict", type: "boolean" }]);

const workflow: AgentWorkflow = {
  metadata: { name: "migration" },
  spec: {
    params: [{ name: "application_name", type: "string", required: true }],
    stages: [
      { name: "plan", agentRef: "plan" },
      { name: "verify", agentRef: "verify" },
    ],
  },
};

jest.mock("@app/api/rest", () => ({
  getAgent: jest.fn(),
}));

jest.mock("@app/queries/agents", () => ({
  useFetchAgents: () => ({
    agents: [standaloneAgent],
    isLoading: false,
    fetchError: null,
  }),
}));

jest.mock("@app/queries/agent-runs", () => ({
  useCreateAgentRunMutation: () => ({
    isLoading: false,
    mutate: mockCreateAgentRun,
  }),
}));

jest.mock("@app/queries/workflows", () => ({
  useFetchWorkflows: () => ({
    workflows: [workflow],
    isLoading: false,
    fetchError: null,
  }),
}));

jest.mock("@app/queries/workflow-runs", () => ({
  useCreateWorkflowRunMutation: () => ({
    isLoading: false,
    mutate: mockCreateWorkflowRun,
  }),
}));

jest.mock("@app/queries/applications", () => ({
  useFetchApplications: () => ({ data: [], error: null }),
}));

jest.mock("@app/queries/agentic-catalog", () => ({
  useFetchGateways: () => ({ gateways: [] }),
}));

jest.mock("@app/queries/skills", () => ({
  useFetchSkillCards: () => ({
    skillCards: [],
    isLoading: false,
    fetchError: null,
  }),
  useFetchSkillCollections: () => ({
    skillCollections: [],
    isLoading: false,
    fetchError: null,
  }),
}));

describe("structured run parameter forms", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(getAgent).mockImplementation(async (name) => {
      if (name === "plan") return planAgent;
      if (name === "verify") return verifyAgent;
      throw new Error(`unexpected Agent ${name}`);
    });
  });

  it("renders typed Agent params and submits approve mode", async () => {
    render(<CreateRunModal onClose={jest.fn()} onCreated={jest.fn()} />);

    const attempts = await screen.findByRole("spinbutton", {
      name: /attempts/i,
    });
    const dryRun = screen.getByRole("checkbox", { name: /dry_run/i });
    const mode = screen.getByLabelText("agentic.createRun.executionMode");

    fireEvent.change(attempts, { target: { value: "3" } });
    fireEvent.click(dryRun);
    expect(
      screen.queryByText("agentic.createRun.executionModeApproveWarningTitle")
    ).not.toBeInTheDocument();
    fireEvent.change(mode, { target: { value: "approve" } });
    expect(
      screen.getByText("agentic.createRun.executionModeApproveWarningTitle")
    ).toBeInTheDocument();
    expect(
      screen.getByText("agentic.createRun.executionModeApproveWarningBody")
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "actions.create" }));

    await waitFor(() =>
      expect(mockCreateAgentRun).toHaveBeenCalledWith(
        expect.objectContaining({
          agentRef: "standalone",
          mode: "approve",
          params: { attempts: "3", dry_run: "true" },
        })
      )
    );
  });

  it("separates workflow params and submits stage-specific Agent params", async () => {
    render(
      <CreateWorkflowRunModal onClose={jest.fn()} onCreated={jest.fn()} />
    );

    expect(
      await screen.findByText("agentic.workflowRuns.workflowParameters")
    ).toBeInTheDocument();
    expect(
      await screen.findByText("agentic.workflowRuns.agentParameters")
    ).toBeInTheDocument();

    fireEvent.change(
      document.getElementById("workflow-param-application_name")!,
      {
        target: { value: "coolstore" },
      }
    );
    fireEvent.change(document.getElementById("agent-param-plan_depth")!, {
      target: { value: "4" },
    });
    fireEvent.click(document.getElementById("agent-param-strict")!);
    fireEvent.click(screen.getByRole("button", { name: "actions.create" }));

    await waitFor(() =>
      expect(mockCreateWorkflowRun).toHaveBeenCalledWith(
        expect.objectContaining({
          workflowRef: "migration",
          params: {
            application_name: "coolstore",
            plan_depth: "4",
            strict: "true",
          },
        })
      )
    );
  });
});
