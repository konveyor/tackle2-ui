import React from "react";
import "@testing-library/jest-dom";
import { render, screen, waitFor } from "@app/test-config/test-utils";
import userEvent from "@testing-library/user-event";
import { AnalysisWizard } from "../analysis-wizard";
import { APPLICATIONS } from "@app/api/rest";
import mock from "@app/test-config/mockInstance";

jest.mock("react-i18next");
jest.mock("react-redux");

describe("<AnalysisWizard />", () => {
  let isAnalyzeModalOpen = true;
  const setAnalyzeModalOpen = (toggle: boolean) =>
    (isAnalyzeModalOpen = toggle);

  it("allows to cancel an analysis wizard", async () => {
    const applicationsData = [
      {
        id: 1,
        name: "App1",
      },
    ];

    mock.onGet(`${APPLICATIONS}`).reply(200, applicationsData);

    render(
      <AnalysisWizard
        applications={applicationsData}
        isOpen={isAnalyzeModalOpen}
        onClose={() => {
          setAnalyzeModalOpen(false);
        }}
      />
    );

    const cancelButton = await screen.findByRole("button", { name: /Cancel/ });
    expect(cancelButton).toBeEnabled();
  });

  it("has next button disabled when applications mode have no binary source defined", async () => {
    const applicationsData = [
      {
        id: 1,
        name: "App1",
      },
      {
        id: 2,
        name: "App2",
      },
    ];

    mock.onGet(`${APPLICATIONS}`).reply(200, applicationsData);
    render(
      <AnalysisWizard
        applications={applicationsData}
        isOpen={isAnalyzeModalOpen}
        onClose={() => {
          setAnalyzeModalOpen(false);
        }}
      />
    );

    const alert = screen.getByText(/warning alert:/i);
    const runButton = screen.getByRole("button", { name: /next/i });
    expect(alert).toBeEnabled();
    expect(runButton).toHaveAttribute("disabled", "");
  });

  it("has next button disabled when applications mode have no source code defined", async () => {
    const applicationsData = [
      {
        id: 1,
        name: "App1",
      },
      {
        id: 2,
        name: "App2",
      },
    ];

    mock.onGet(`${APPLICATIONS}`).reply(200, applicationsData);
    render(
      <AnalysisWizard
        applications={applicationsData}
        isOpen={isAnalyzeModalOpen}
        onClose={() => {
          setAnalyzeModalOpen(false);
        }}
      />
    );

    const user = userEvent.setup();

    const mode = screen.getByText(/binary/i);
    await user.click(mode);

    const sourceCode = await screen.findByRole("option", {
      name: "Source code",
      hidden: true,
    });

    await user.click(sourceCode);

    const alert = screen.getByText(/warning alert:/i);
    const runButton = screen.getByRole("button", { name: /next/i });
    expect(alert).toBeEnabled();
    expect(runButton).toHaveAttribute("disabled", "");
  });

  it("has next button disabled when applications mode have no source code + dependencies defined", async () => {
    const applicationsData = [
      {
        id: 1,
        name: "App1",
      },
      {
        id: 2,
        name: "App2",
      },
    ];

    mock.onGet(`${APPLICATIONS}`).reply(200, applicationsData);
    render(
      <AnalysisWizard
        applications={applicationsData}
        isOpen={isAnalyzeModalOpen}
        onClose={() => {
          setAnalyzeModalOpen(false);
        }}
      />
    );
    const user = userEvent.setup();

    const mode = screen.getByText(/binary/i);
    await user.click(mode);

    const sourceCodePlusDependencies = await screen.findByRole("option", {
      name: "Source code + dependencies",
      hidden: true,
    });

    await user.click(sourceCodePlusDependencies);

    const alert = screen.getByText(/warning alert:/i);
    const runButton = screen.getByRole("button", { name: /next/i });
    expect(alert).toBeEnabled();
    expect(runButton).toHaveAttribute("disabled", "");
  });
});
