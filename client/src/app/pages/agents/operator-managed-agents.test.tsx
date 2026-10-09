import "@testing-library/jest-dom";
import { fireEvent, render, screen, within } from "@testing-library/react";

import type { AgentResource } from "@app/api/agentic/contract";

import AgentsPage from "./agents-page";

const agent = (name: string, managed: boolean): AgentResource => ({
  metadata: {
    name,
    ...(managed && {
      labels: { "app.kubernetes.io/managed-by": "agentic-controller-defaults" },
    }),
  },
  spec: { image: "quay.io/konveyor/agent-java:latest" },
});

const shipped = agent("migration-plan-agent", true);
const mine = agent("my-agent", false);

const mockDelete = jest.fn();

jest.mock("@app/queries/agents", () => ({
  useFetchAgents: () => ({
    agents: [shipped, mine],
    isLoading: false,
    fetchError: null,
    refetch: jest.fn(),
  }),
  useDeleteAgentMutation: () => ({ isLoading: false, mutate: mockDelete }),
  useCreateAgentMutation: () => ({ isLoading: false, mutate: jest.fn() }),
  useUpdateAgentMutation: () => ({ isLoading: false, mutate: jest.fn() }),
}));

jest.mock("@app/queries/agentic-catalog", () => ({
  useFetchGateways: () => ({ gateways: [], isLoading: false }),
}));

jest.mock("@app/queries/skills", () => ({
  useFetchSkillCards: () => ({ skillCards: [], isLoading: false }),
  useFetchSkillCollections: () => ({
    skillCollections: [],
    isLoading: false,
  }),
}));

jest.mock("@app/auth", () => ({ useHasSomeScopes: () => true }));

jest.mock("@app/components/NotificationsContext", () => ({
  useNotifications: () => ({ pushNotification: jest.fn() }),
}));

/** Open the kebab (the row's only button) on the row named `name`. */
const openRowActions = (name: string) => {
  const row = screen.getByRole("row", { name: new RegExp(name) });
  fireEvent.click(within(row).getByRole("button"));
};

describe("operator-managed agents", () => {
  beforeEach(() => jest.clearAllMocks());

  it("offers view instead of edit, and refuses to delete, a shipped default", () => {
    render(<AgentsPage />);
    openRowActions("migration-plan-agent");

    expect(
      screen.getByRole("menuitem", { name: "actions.view" })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("menuitem", { name: "actions.edit" })
    ).not.toBeInTheDocument();

    const del = screen.getByRole("menuitem", { name: "actions.delete" });
    expect(del).toHaveAttribute("aria-disabled", "true");

    // Clicking it must not even open the confirm dialog.
    fireEvent.click(del);
    expect(
      screen.queryByText("dialog.title.deleteWithName")
    ).not.toBeInTheDocument();
    expect(mockDelete).not.toHaveBeenCalled();
  });

  it("leaves a user-created agent fully editable", () => {
    render(<AgentsPage />);
    openRowActions("my-agent");

    expect(
      screen.getByRole("menuitem", { name: "actions.edit" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("menuitem", { name: "actions.delete" })
    ).not.toHaveAttribute("aria-disabled", "true");
  });

  it("opens the shipped default read-only: no save, image not editable", () => {
    render(<AgentsPage />);
    openRowActions("migration-plan-agent");
    fireEvent.click(screen.getByRole("menuitem", { name: "actions.view" }));

    expect(screen.getByDisplayValue(shipped.spec.image)).toBeDisabled();
    expect(
      screen.queryByRole("button", { name: "actions.save" })
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "actions.close" })
    ).toBeInTheDocument();
  });

  it("keeps the editor writable for a user-created agent", () => {
    render(<AgentsPage />);
    openRowActions("my-agent");
    fireEvent.click(screen.getByRole("menuitem", { name: "actions.edit" }));

    expect(screen.getByDisplayValue(mine.spec.image)).toBeEnabled();
    expect(
      screen.getByRole("button", { name: "actions.save" })
    ).toBeInTheDocument();
  });
});
