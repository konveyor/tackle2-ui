import { rest } from "msw";
import { MemoryRouter, Route, Routes } from "react-router-dom";

import { Paths } from "@app/Paths";
import { render, screen } from "@app/test-config/test-utils";
import { server } from "@mocks/server";

import { ManageImportsDetails } from "./manage-imports-details";

jest.mock("react-router-dom", () => jest.requireActual("react-router-dom"));

describe("Import details route validation", () => {
  it.each(["abc", "12abc", "0", "-1", "1.5", "Infinity"])(
    "returns to imports without requesting data for %s",
    async (importId) => {
      const request = jest.fn();
      server.use(
        rest.get("/hub/*", (_, res, ctx) => {
          request();
          return res(ctx.json([]));
        })
      );

      render(
        <MemoryRouter
          initialEntries={[`/applications/application-imports/${importId}`]}
        >
          <Routes>
            <Route
              path={Paths.applicationsImportsDetails}
              element={<ManageImportsDetails />}
            />
            <Route
              path={Paths.applicationsImports}
              element={<h1>Imports</h1>}
            />
          </Routes>
        </MemoryRouter>
      );

      expect(
        await screen.findByRole("heading", { name: "Imports" })
      ).toBeInTheDocument();
      expect(request).not.toHaveBeenCalled();
    }
  );
});
