import React, { HTMLInputTypeAttribute } from "react";
import {
  render,
  waitFor,
  screen,
  fireEvent,
} from "@app/test-config/test-utils";

import {
  APPLICATIONS,
  BUSINESS_SERVICES,
  REVIEWS,
  TAG_TYPES,
} from "@app/api/rest";
import mock from "@app/test-config/mockInstance";
import { ApplicationForm } from "../application-form";
import userEvent from "@testing-library/user-event";

import "@testing-library/jest-dom/extend-expect";
import "@testing-library/jest-dom";
import { BusinessService } from "@app/api/models";

const data: any[] = [];
mock.onGet(`${BUSINESS_SERVICES}`).reply(200, data);
mock.onGet(`${TAG_TYPES}`).reply(200, data);
mock.onGet(`${APPLICATIONS}`).reply(200, data);
mock.onGet(`${REVIEWS}`).reply(200, data);

describe("Component: application-form", () => {
  const mockChangeValue = jest.fn();

  it("Display form on initial load", async () => {
    render(
      <ApplicationForm onCancel={mockChangeValue} onSaved={mockChangeValue} />
    );
    const applicationNameInput = await waitFor(() =>
      screen.getByTestId("application-name")
    );
    expect(applicationNameInput).toBeInTheDocument();

    const descriptionInput = await waitFor(() =>
      screen.getByTestId("description")
    );
    expect(descriptionInput).toBeInTheDocument();

    const businessServiceInput = await waitFor(() =>
      screen.getByText("terms.businessService")
    );
    expect(businessServiceInput).toBeInTheDocument();

    const tagsInput = await waitFor(() => screen.getByText("terms.tags"));
    expect(tagsInput).toBeInTheDocument();

    const commentsInput = await waitFor(() =>
      screen.getByLabelText("comments")
    );
    expect(commentsInput).toBeInTheDocument();
  });

  it("Render Source code section", async () => {
    render(
      <ApplicationForm onCancel={mockChangeValue} onSaved={mockChangeValue} />
    );

    fireEvent.click(screen.getByTestId("source-code-toggle"));

    const repoTypeInput = await waitFor(
      () => screen.getByTestId("repository-type"),
      {
        timeout: 3000,
      }
    );
    expect(repoTypeInput).toBeInTheDocument();

    const repoURLInput = await waitFor(
      () => screen.getByTestId("repository-url"),
      {
        timeout: 3000,
      }
    );
    expect(repoURLInput).toBeInTheDocument();

    const branchInput = await waitFor(
      () => screen.getByTestId("repository-branch"),
      {
        timeout: 3000,
      }
    );
    expect(branchInput).toBeInTheDocument();

    const rootInput = await waitFor(
      () => screen.getByTestId("repository-root"),
      {
        timeout: 3000,
      }
    );
    expect(rootInput).toBeInTheDocument();
  });

  it("Render Binary section", async () => {
    render(
      <ApplicationForm onCancel={mockChangeValue} onSaved={mockChangeValue} />
    );

    fireEvent.click(screen.getByTestId("binary-toggle"));

    const groupInput = await waitFor(() => screen.getByTestId("binary-group"), {
      timeout: 3000,
    });

    expect(groupInput).toBeInTheDocument();

    const artifactInput = await waitFor(
      () => screen.getByTestId("binary-artifact"),
      {
        timeout: 3000,
      }
    );
    expect(artifactInput).toBeInTheDocument();

    const versionInput = await waitFor(
      () => screen.getByTestId("binary-version"),
      {
        timeout: 3000,
      }
    );
    expect(versionInput).toBeInTheDocument();

    const packagingInput = await waitFor(
      () => screen.getByTestId("binary-packaging"),
      {
        timeout: 3000,
      }
    );
    expect(packagingInput).toBeInTheDocument();
  });

  it("Validation tests", async () => {
    const businessServices: BusinessService[] = [{ id: 1, name: "service" }];

    mock.onGet(`${BUSINESS_SERVICES}`).reply(200, businessServices);

    render(
      <ApplicationForm onCancel={mockChangeValue} onSaved={mockChangeValue} />
    );

    fireEvent.change(screen.getByTestId("application-name"), {
      target: { value: "app-name" },
    });

    await waitFor(
      () => {
        fireEvent.click(
          screen.getByRole("button", {
            name: /business-service/i,
          })
        );
      },
      {
        timeout: 3000,
      }
    );

    await userEvent.selectOptions(screen.getByRole("listbox"), ["service"]);

    await waitFor(
      () => {
        fireEvent.change(screen.getByTestId("repository-branch"), {
          target: { value: "branch-test" },
        });
      },
      {
        timeout: 3000,
      }
    );

    const createButton = screen.getByRole("button", { name: /submit/i });

    expect(createButton).not.toBeEnabled();

    await waitFor(
      () => {
        fireEvent.change(screen.getByTestId("repository-root"), {
          target: { value: "path-test" },
        });
      },
      {
        timeout: 3000,
      }
    );

    expect(createButton).not.toBeEnabled();
    const testURL = "https://github.com/username/tackle-testapp.git";

    await waitFor(
      () => {
        fireEvent.change(screen.getByTestId("repository-url"), {
          target: { value: testURL },
        });
      },
      {
        timeout: 3000,
      }
    );

    expect(createButton).toBeEnabled();

    await waitFor(
      () => {
        fireEvent.change(screen.getByTestId("binary-group"), {
          target: { value: "group-test" },
        });
      },
      {
        timeout: 3000,
      }
    );

    expect(createButton).not.toBeEnabled();

    await waitFor(
      () => {
        fireEvent.change(screen.getByTestId("binary-artifact"), {
          target: { value: "artifact-test" },
        });
      },
      {
        timeout: 3000,
      }
    );

    expect(createButton).not.toBeEnabled();

    await waitFor(
      () => {
        fireEvent.change(screen.getByTestId("binary-version"), {
          target: { value: "version-test" },
        });
      },
      {
        timeout: 3000,
      }
    );

    expect(createButton).toBeEnabled();
  });
});
