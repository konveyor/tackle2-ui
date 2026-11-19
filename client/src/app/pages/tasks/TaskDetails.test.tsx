import { rest } from "msw";
import { MemoryRouter, Route, Routes } from "react-router-dom";

import { Paths } from "@app/Paths";
import { render, screen } from "@app/test-config/test-utils";
import { server } from "@mocks/server";

import { TaskDetails } from "./TaskDetails";

jest.mock("react-router-dom", () => jest.requireActual("react-router-dom"));
jest.mock("@patternfly/react-code-editor", () => ({
  CodeEditor: () => null,
  Language: { yaml: "yaml", json: "json", plaintext: "plaintext" },
}));

const renderDetails = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path={Paths.taskDetails} element={<TaskDetails />} />
        <Route path={Paths.taskDetailsAttachment} element={<TaskDetails />} />
        <Route path={Paths.applicationsTaskDetails} element={<TaskDetails />} />
        <Route path="/missing" element={<TaskDetails />} />
        <Route path={Paths.tasks} element={<h1>Tasks</h1>} />
        <Route path={Paths.applications} element={<h1>Applications</h1>} />
      </Routes>
    </MemoryRouter>
  );

describe("Task detail route params", () => {
  it.each([
    ["/missing", "Tasks"],
    ["/tasks/abc", "Tasks"],
    ["/tasks/0", "Tasks"],
    ["/tasks/-1", "Tasks"],
    ["/tasks/1.5", "Tasks"],
    ["/tasks/Infinity", "Tasks"],
    ["/applications/3/tasks/abc", "Applications"],
    ["/applications/abc/tasks/7", "Applications"],
  ])("redirects %s before fetching", async (path, destination) => {
    const request = jest.fn();
    server.use(
      rest.get("/hub/*", (_, res, ctx) => {
        request();
        return res(ctx.json({}));
      })
    );
    renderDetails(path);

    expect(
      await screen.findByRole("heading", { name: destination })
    ).toBeInTheDocument();
    expect(request).not.toHaveBeenCalled();
  });

  it.each([
    ["/tasks/7", "terms.tasks", "/tasks"],
    ["/tasks/7/attachments/9", "terms.tasks", "/tasks"],
    ["/applications/3/tasks/7", "terms.applications", "/applications"],
  ])("keeps optional params optional on %s", async (path, label, href) => {
    const applicationRequest = jest.fn();
    server.use(
      rest.get("/hub/tasks/7", (_, res, ctx) =>
        res(
          ctx.json({
            id: 7,
            name: "Import",
            state: "Succeeded",
            attached: [{ id: 9, name: "report.json" }],
          })
        )
      ),
      rest.get("/hub/applications/:id", (_, res, ctx) => {
        applicationRequest();
        return res(ctx.json({ id: 3, name: "Inventory app" }));
      }),
      rest.get("/hub/files/9", (_, res, ctx) => res(ctx.text("{}")))
    );
    renderDetails(path);

    expect(
      await screen.findByRole("heading", {
        name: "Task details for task 7, Import",
      })
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: label })).toHaveAttribute(
      "href",
      href
    );
    if (path.startsWith("/applications/")) {
      expect(
        await screen.findByRole("link", { name: "Inventory app" })
      ).toHaveAttribute("href", "/applications/?activeItem=3");
    } else {
      expect(applicationRequest).not.toHaveBeenCalled();
    }
    if (path.includes("/attachments/")) {
      expect(screen.getByText("terms.attachments")).toBeInTheDocument();
    }
  });
});
