import React from "react";
import "@testing-library/jest-dom";
import { render, waitFor, screen } from "@app/test-config/test-utils";

import { BUSINESS_SERVICES, TAG_TYPES } from "@app/api/rest";
import mock from "@app/test-config/mockInstance";
import { ApplicationForm } from "../application-form";

jest.mock("react-i18next");
const data = [];
mock.onGet(`${BUSINESS_SERVICES}`).reply(200, data);
mock.onGet(`${TAG_TYPES}`).reply(200, data);

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
    expect(tagsInput).toBeInTheDocument();
  });
});
