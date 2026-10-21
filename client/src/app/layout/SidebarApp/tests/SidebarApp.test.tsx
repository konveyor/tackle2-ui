import { BrowserRouter as Router, MemoryRouter } from "react-router-dom";

import { UniversalPaths } from "@app/Paths";
import { render, screen } from "@app/test-config/test-utils";

import { SidebarApp } from "../SidebarApp";

it.skip("Renders without crashing", () => {
  const wrapper = render(
    <Router>
      <SidebarApp />
    </Router>
  );
  expect(wrapper).toMatchSnapshot();
});

describe("SidebarApp perspective on universal routes", () => {
  const renderAt = (path: string) =>
    render(
      <MemoryRouter initialEntries={[path]}>
        <SidebarApp />
      </MemoryRouter>
    );

  const personaToggle = () =>
    screen.getByRole("button", { name: "Select persona dropdown" });

  beforeEach(() => {
    window.sessionStorage.clear();
  });

  it("defaults to the Migration perspective", () => {
    renderAt(UniversalPaths.tokens);
    expect(personaToggle()).toHaveTextContent("Migration");
  });

  it("restores the Administration perspective after a reload", () => {
    renderAt("/general").unmount();
    expect(window.sessionStorage.getItem("sidebar-last-persona")).toBe(
      JSON.stringify("ADMINISTRATION")
    );

    // A fresh render stands in for a full page reload: only session storage survives.
    renderAt(UniversalPaths.tasks);
    expect(personaToggle()).toHaveTextContent("Administration");
  });
});
