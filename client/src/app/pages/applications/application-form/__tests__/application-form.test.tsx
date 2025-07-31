import React from "react";
import {
  render,
  waitFor,
  screen,
  fireEvent,
} from "@app/test-config/test-utils";

import userEvent from "@testing-library/user-event";

import "@testing-library/jest-dom";
import { ApplicationFormModal } from "../application-form-modal";
import { server } from "@mocks/server";
import { rest } from "msw";

describe("Component: application-form", () => {
  const mockChangeValue = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    server.use(
      rest.get("/hub/businessservices", (req, res, ctx) => {
        return res(ctx.status(200), ctx.json([{ id: 1, name: "service" }]));
      }),
      rest.get("/hub/stakeholders", (_, res, ctx) => res(ctx.json([]))),
      rest.get("/hub/applications", (_, res, ctx) => res(ctx.json([]))),
      rest.get("/hub/tagCategories", (_, res, ctx) => res(ctx.json([]))),
      rest.get("/hub/platforms", (_, res, ctx) => res(ctx.json([])))
    );
  });

  it("Validation tests", async () => {
    const data = {
      name: "app-name",
      businessService: "service",
      repoType: "Git",
      repoUrl: "https://github.com/username/tackle-testapp.git",
    };

    render(
      <ApplicationFormModal application={null} onClose={mockChangeValue} />
    );

    const createButton = screen.getByRole("button", { name: /submit/i });
    expect(createButton).not.toBeEnabled();

    // Type in a name -- this is all that should be required right now
    const nameInput = await screen.findByLabelText("Name *");
    await waitFor(() =>
      fireEvent.change(nameInput, {
        target: { value: data.name },
      })
    );
    expect(createButton).toBeEnabled();

    // select a business service from the mock data
    await waitFor(() => {
      fireEvent.click(
        screen.getByRole("button", {
          name: /Business service select dropdown toggle/i,
        })
      );
    });
    await userEvent.selectOptions(screen.getByRole("listbox"), [
      data.businessService,
    ]);

    // open the source code section
    await waitFor(() => {
      fireEvent.click(
        screen.getByRole("button", {
          name: "terms.sourceCode",
        })
      );
    });
    expect(createButton).toBeEnabled();

    // select a repository type of 'git'
    await waitFor(() => {
      fireEvent.click(
        screen.getByRole("button", {
          name: /Type select dropdown toggle/i,
        })
      );
    });
    await userEvent.selectOptions(screen.getByRole("listbox"), [data.repoType]);
    expect(createButton).not.toBeEnabled();

    // type in a valid git repo URL, and the create button should be enabled again
    const sourceRepositoryInput = await screen.findByLabelText(
      "source repository url"
    );
    await waitFor(() => {
      fireEvent.change(sourceRepositoryInput, {
        target: { value: data.repoUrl },
      });
    });

    // Wait for form validation to complete before checking if button is enabled
    await waitFor(() => {
      expect(createButton).toBeEnabled();
    });
  }, 10000);
});
