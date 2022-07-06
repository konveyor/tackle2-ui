import React from "react";
import "@testing-library/jest-dom";
import { render, screen } from "@app/test-config/test-utils";
import userEvent from "@testing-library/user-event";
import { AnalysisWizard } from "../analysis-wizard";
import { APPLICATIONS, TASKGROUPS } from "@app/api/rest";
import mock from "@app/test-config/mockInstance";
import { Application } from "@app/api/models";

jest.mock("react-i18next");
jest.mock("react-redux");

let applicationsDataDefault: Application[];

beforeAll(() => {
  applicationsDataDefault = [
    {
      id: 1,
      name: "App1",
    },
    {
      id: 2,
      name: "App2",
    },
  ];
});

describe("<AnalysisWizard />", () => {
  let isAnalyzeModalOpen = true;
  const setAnalyzeModalOpen = (toggle: boolean) =>
    (isAnalyzeModalOpen = toggle);

  it("allows to cancel an analysis wizard", async () => {
    mock.onGet(`${APPLICATIONS}`).reply(200, applicationsDataDefault);

    render(
      <AnalysisWizard
        applications={applicationsDataDefault}
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
    mock.onGet(`${APPLICATIONS}`).reply(200, applicationsDataDefault);
    render(
      <AnalysisWizard
        applications={applicationsDataDefault}
        isOpen={isAnalyzeModalOpen}
        onClose={() => {
          setAnalyzeModalOpen(false);
        }}
      />
    );

    const alert = screen.getByText(/warning alert:/i);
    const nextButton = screen.getByRole("button", { name: /next/i });
    expect(alert).toBeEnabled();
    expect(nextButton).toHaveAttribute("disabled", "");
  });

  it("has next button disabled when applications mode have no source code defined", async () => {
    mock.onGet(`${APPLICATIONS}`).reply(200, applicationsDataDefault);
    render(
      <AnalysisWizard
        applications={applicationsDataDefault}
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
    const nextButton = screen.getByRole("button", { name: /next/i });
    expect(alert).toBeEnabled();
    expect(nextButton).toHaveAttribute("disabled", "");
  });

  it("has next button disabled when applications mode have no source code + dependencies defined", async () => {
    mock.onGet(`${APPLICATIONS}`).reply(200, applicationsDataDefault);
    render(
      <AnalysisWizard
        applications={applicationsDataDefault}
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
    const nextButton = screen.getByRole("button", { name: /next/i });
    expect(alert).toBeEnabled();
    expect(nextButton).toHaveAttribute("disabled", "");
  });

  it("has next button enabled when applications mode have binary source defined", async () => {
    const applicationsData = [
      {
        ...applicationsDataDefault[0],
        binary: "io.konveyor.demo:customers-tomcat:0.0.1-SNAPSHOT:war",
      },
    ];

    const taskgroupData = {
      addon: "windup",
      data: {
        mode: {
          artifact: "",
          binary: false,
          withDeps: false,
        },
        output: "/windup/report",
        scope: {
          packages: {
            excluded: [],
            included: [],
          },
          withKnown: false,
        },
        sources: [],
        targets: [],
      },
      name: "taskgroup.windup",
      tasks: [
        {
          application: {
            id: 1,
            name: "App1",
          },
          data: {},
          name: "App1.1.windup",
        },
      ],
    };

    mock.onGet(`${APPLICATIONS}`).reply(200, applicationsData);
    mock.onPost(`${TASKGROUPS}`).reply(200, taskgroupData);

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
    const warning = screen.queryByLabelText(/warning alert/i);
    const nextButton = screen.getByRole("button", { name: /next/i });
    expect(warning).not.toBeInTheDocument();
    expect(nextButton).toBeEnabled();

    // set target
    await user.click(nextButton);
    const target = await screen.findByRole("heading", {
      name: /containerization/i,
    });
    await user.click(target);
    await user.click(nextButton);

    // set scope
    const scope = screen.getByRole("radio", {
      name: /wizard\.label\.scopealldeps/i,
    });
    await user.click(scope);
    // await user.click(screen.getByRole("button", { name: /next/i }));
  });
});
