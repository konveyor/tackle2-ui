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
      rest.get("/hub/tagCategories", (_, res, ctx) => res(ctx.json([])))
    );
  });

  it("Validation tests", async () => {
    render(
      <ApplicationFormModal application={null} onClose={mockChangeValue} />
    );
    const nameInput = await screen.findByLabelText("Name *");
    fireEvent.change(nameInput, {
      target: { value: "app-name" },
    });
    await waitFor(
      () => {
        fireEvent.click(
          screen.getByRole("button", {
            name: /Business service select dropdown toggle/i,
          })
        );
      },
      {
        timeout: 3000,
      }
    );

    await userEvent.selectOptions(screen.getByRole("listbox"), ["service"]);

    const sourceCodeButton = screen.getByRole("button", {
      name: "terms.sourceCode",
    });

    await waitFor(
      () => {
        fireEvent.click(sourceCodeButton);
      },
      {
        timeout: 3000,
      }
    );

    const branchInput = screen.getByRole("textbox", {
      name: "Repository branch",
    });

    await waitFor(
      () => {
        fireEvent.change(branchInput, {
          target: { value: "branch-test" },
        });
      },
      {
        timeout: 3000,
      }
    );

    const createButton = screen.getByRole("button", { name: /submit/i });

    expect(createButton).not.toBeEnabled();

    const rootInput = screen.getByRole("textbox", {
      name: "terms.sourceRootPath",
    });

    await waitFor(
      () => {
        fireEvent.change(rootInput, {
          target: { value: "path-test" },
        });
      },
      {
        timeout: 3000,
      }
    );

    expect(createButton).not.toBeEnabled();
    const urlInput = screen.getByRole("textbox", {
      name: "terms.sourceRepo",
    });
    const testURL = "https://github.com/username/tackle-testapp.git";

    await waitFor(
      () => {
        fireEvent.change(urlInput, {
          target: { value: testURL },
        });
      },
      {
        timeout: 3000,
      }
    );

    expect(createButton).toBeEnabled();
  }, 10000);
});
