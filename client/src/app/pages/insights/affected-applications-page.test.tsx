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

describe("Affected applications required insight filters", () => {
  it.each([
    "/missing",
    "/insights/all/%20/rule/affected-applications",
    "/insights/all/ruleset/%20/affected-applications",
    "/insights/all/%25/rule/affected-applications",
    "/insights/all/ruleset/%E0%A4%A/affected-applications",
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
              path={Paths.insightsAllAffectedApplications}
              element={<AffectedApplicationsPage />}
            />
            <Route path="/missing" element={<AffectedApplicationsPage />} />
            <Route
              path={Paths.insightsAllTab}
              element={<h1>All insights</h1>}
            />
          </Routes>
        </MemoryRouter>
      );

      expect(
        await screen.findByRole("heading", { name: "All insights" })
      ).toBeInTheDocument();
      expect(request).not.toHaveBeenCalled();
    }
  );
});
