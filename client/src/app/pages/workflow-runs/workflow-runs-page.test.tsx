import "@testing-library/jest-dom";
import { MemoryRouter } from "react-router-dom";

import type {
  AgentWorkflowRun,
  AgentWorkflowRunPhase,
} from "@app/api/agentic/contract";
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@app/test-config/test-utils";

import WorkflowRunsPage from "./workflow-runs-page";

const mockGetWorkflowRuns = jest.fn();
const mockDeleteWorkflowRun = jest.fn();

jest.mock("@app/api/rest", () => ({
  ...jest.requireActual("@app/api/rest"),
  getWorkflowRuns: () => mockGetWorkflowRuns(),
  deleteWorkflowRun: (name: string) => mockDeleteWorkflowRun(name),
}));

jest.mock("@app/queries/applications", () => ({
  useFetchApplications: () => ({ data: [], error: null }),
}));

jest.mock("@app/auth", () => ({
  ...jest.requireActual("@app/auth"),
  useHasSomeScopes: () => true,
}));

const workflowRun = (
  name: string,
  phase: AgentWorkflowRunPhase
): AgentWorkflowRun => ({
  metadata: { name, creationTimestamp: "2026-09-08T12:00:00Z" },
  spec: { workflowRef: "workflow" },
  status: { phase },
});

const renderPage = () =>
  render(
    <MemoryRouter>
      <WorkflowRunsPage />
    </MemoryRouter>
  );

describe("workflow runs delete", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetWorkflowRuns.mockResolvedValue([
      workflowRun("run-running", "Running"),
      workflowRun("run-failed", "Failed"),
      workflowRun("run-succeeded", "Succeeded"),
    ]);
    mockDeleteWorkflowRun.mockResolvedValue(undefined);
  });

  it("deletes the selected run after confirmation, warning that it is active", async () => {
    renderPage();
    await screen.findByText("run-running");

    const deleteSelected = screen.getByRole("button", {
      name: "agentic.workflowRuns.deleteSelected",
    });
    expect(deleteSelected).toBeDisabled();

    fireEvent.click(screen.getByRole("checkbox", { name: /select row 0/i }));
    expect(deleteSelected).toBeEnabled();
    fireEvent.click(deleteSelected);

    expect(
      await screen.findByText("agentic.workflowRuns.deleteTitle")
    ).toBeInTheDocument();
    expect(
      screen.getByText("agentic.workflowRuns.activeDeleteWarning")
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "actions.delete" }));

    await waitFor(() =>
      expect(mockDeleteWorkflowRun).toHaveBeenCalledWith("run-running")
    );
    expect(mockDeleteWorkflowRun).toHaveBeenCalledTimes(1);
  });

  it("'Delete finished' targets only Succeeded and Failed runs", async () => {
    renderPage();
    await screen.findByText("run-running");

    fireEvent.click(
      screen.getByRole("button", {
        name: "agentic.workflowRuns.deleteFinishedWithCount",
      })
    );

    expect(
      await screen.findByText("agentic.workflowRuns.deleteTitle")
    ).toBeInTheDocument();
    expect(
      screen.queryByText("agentic.workflowRuns.activeDeleteWarning")
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "actions.delete" }));

    await waitFor(() => expect(mockDeleteWorkflowRun).toHaveBeenCalledTimes(2));
    expect(mockDeleteWorkflowRun).toHaveBeenCalledWith("run-failed");
    expect(mockDeleteWorkflowRun).toHaveBeenCalledWith("run-succeeded");
  });
});
