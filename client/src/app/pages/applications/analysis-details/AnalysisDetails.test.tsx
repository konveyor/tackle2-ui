import { rest } from "msw";
import { MemoryRouter, Route, Routes } from "react-router-dom";

import { Paths } from "@app/Paths";
import { render, screen } from "@app/test-config/test-utils";
import { server } from "@mocks/server";

import { AnalysisDetails } from "./AnalysisDetails";

jest.mock("react-router-dom", () => jest.requireActual("react-router-dom"));
jest.mock("@patternfly/react-code-editor", () => ({
  CodeEditor: () => null,
  Language: { yaml: "yaml", json: "json", plaintext: "plaintext" },
}));

describe("Analysis detail route params", () => {
  it.each([
    "/missing",
    "/applications/abc/analysis-details/7",
    "/applications/0/analysis-details/7",
    "/applications/3/analysis-details/abc",
    "/applications/3/analysis-details/0",
    "/applications/3/analysis-details/1.5",
    "/applications/3/analysis-details/Infinity",
  ])("redirects %s before fetching", async (path) => {
    const request = jest.fn();
    server.use(
      rest.get("/hub/*", (_, res, ctx) => {
        request();
        return res(ctx.json({}));
      })
    );
    render(
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route
            path={Paths.applicationsAnalysisDetails}
            element={<AnalysisDetails />}
          />
          <Route path="/missing" element={<AnalysisDetails />} />
          <Route path={Paths.applications} element={<h1>Applications</h1>} />
        </Routes>
      </MemoryRouter>
    );

    expect(
      await screen.findByRole("heading", { name: "Applications" })
    ).toBeInTheDocument();
    expect(request).not.toHaveBeenCalled();
  });

  it.each([false, true])(
    "renders valid analysis with optional attachment present: %s",
    async (withAttachment) => {
      server.use(
        rest.get("/hub/tasks/7", (_, res, ctx) =>
          res(
            ctx.json({
              id: 7,
              name: "Java analysis",
              state: "Succeeded",
              attached: [{ id: 9, name: "report.json" }],
            })
          )
        ),
        rest.get("/hub/applications/3", (_, res, ctx) =>
          res(ctx.json({ id: 3, name: "Inventory app" }))
        ),
        rest.get("/hub/files/9", (_, res, ctx) => res(ctx.text("{}")))
      );
      render(
        <MemoryRouter
          initialEntries={[
            `/applications/3/analysis-details/7${withAttachment ? "/attachments/9" : ""}`,
          ]}
        >
          <Routes>
            <Route
              path={Paths.applicationsAnalysisDetails}
              element={<AnalysisDetails />}
            />
            <Route
              path={Paths.applicationsAnalysisDetailsAttachment}
              element={<AnalysisDetails />}
            />
          </Routes>
        </MemoryRouter>
      );

      expect(
        await screen.findByRole("heading", {
          name: "Analysis details for Java analysis",
        })
      ).toBeInTheDocument();
      expect(
        await screen.findByRole("link", { name: "Inventory app" })
      ).toHaveAttribute("href", "/applications/?activeItem=3");
      if (withAttachment) {
        expect(
          screen.getByRole("link", { name: "actions.analysisDetails" })
        ).toHaveAttribute("href", "/applications/3/analysis-details/7");
        expect(screen.getByText("terms.attachments")).toBeInTheDocument();
      } else {
        expect(screen.queryByText("terms.attachments")).not.toBeInTheDocument();
      }
    }
  );
});
