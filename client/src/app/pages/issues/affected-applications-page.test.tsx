import { rest } from "msw";
import { MemoryRouter, Route, Routes } from "react-router-dom";

import { Paths } from "@app/Paths";
import { render, screen } from "@app/test-config/test-utils";
import { server } from "@mocks/server";

import { AffectedApplicationsPage } from "./affected-applications-page";

jest.mock("react-router-dom", () => jest.requireActual("react-router-dom"));
jest.mock("react-markdown", () => () => null);
jest.mock("@app/components/code-snip-viewer", () => ({
  IncidentCodeSnipViewer: () => null,
}));

describe("Affected applications required issue filters", () => {
  it.each([
    "/missing",
    "/issues/all/%20/rule/affected-applications",
    "/issues/all/ruleset/%20/affected-applications",
    "/issues/all/%25/rule/affected-applications",
    "/issues/all/ruleset/%E0%A4%A/affected-applications",
  ])(
    "redirects invalid params without an unfiltered request: %s",
    async (path) => {
      const request = jest.fn();
      server.use(
        rest.get("/hub/*", (_, res, ctx) => {
          request();
          return res(ctx.json([]));
        })
      );

      render(
        <MemoryRouter initialEntries={[path]}>
          <Routes>
            <Route
              path={Paths.issuesAllAffectedApplications}
              element={<AffectedApplicationsPage />}
            />
            <Route path="/missing" element={<AffectedApplicationsPage />} />
            <Route path={Paths.issuesAllTab} element={<h1>All issues</h1>} />
          </Routes>
        </MemoryRouter>
      );

      expect(
        await screen.findByRole("heading", { name: "All issues" })
      ).toBeInTheDocument();
      expect(request).not.toHaveBeenCalled();
    }
  );
});
