import React from "react";
import "@testing-library/jest-dom";
import { render, screen, waitFor } from "@app/test-config/test-utils";
import { AnalysisWizard } from "../analysis-wizard";
import { TASKGROUPS } from "@app/api/rest";
import mock from "@app/test-config/mockInstance";
import userEvent from "@testing-library/user-event";

const applicationData1 = {
  id: 1,
  name: "App1",
};

const applicationData2 = {
  id: 2,
  name: "App2",
};

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

describe("<AnalysisWizard />", () => {
  let isAnalyzeModalOpen = true;
  const setAnalyzeModalOpen = (toggle: boolean) =>
    (isAnalyzeModalOpen = toggle);

  it("allows to cancel an analysis wizard", async () => {
    render(
      <AnalysisWizard
        applications={[applicationData1, applicationData2]}
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
    render(
      <AnalysisWizard
        applications={[applicationData1, applicationData2]}
        isOpen={isAnalyzeModalOpen}
        onClose={() => {
          setAnalyzeModalOpen(false);
        }}
      />
    );

    const alert = screen.getByText(/warning alert:/i);
    const nextButton = screen.getByRole("button", { name: /next/i });

    await waitFor(() => expect(alert).toBeEnabled());
    await waitFor(() => expect(nextButton).toHaveAttribute("disabled", ""));
  });

  it("has next button disabled when applications mode have no source code defined", async () => {
    render(
      <AnalysisWizard
        applications={[applicationData1, applicationData2]}
        isOpen={isAnalyzeModalOpen}
        onClose={() => {
          setAnalyzeModalOpen(false);
        }}
      />
    );

    const mode = screen.getByText(/binary/i);
    await userEvent.click(mode);

    const sourceCode = await screen.findByRole("option", {
      name: "Source code",
      hidden: true,
    });

    await userEvent.click(sourceCode);

    const alert = screen.getByText(/warning alert:/i);
    const nextButton = screen.getByRole("button", { name: /next/i });
    await waitFor(() => expect(alert).toBeEnabled());
    await waitFor(() => expect(nextButton).toHaveAttribute("disabled", ""));
  });

  it("has next button disabled when applications mode have no source code + dependencies defined", async () => {
    render(
      <AnalysisWizard
        applications={[applicationData1, applicationData2]}
        isOpen={isAnalyzeModalOpen}
        onClose={() => {
          setAnalyzeModalOpen(false);
        }}
      />
    );

    const mode = screen.getByText(/binary/i);
    await userEvent.click(mode);

    const sourceCodePlusDependencies = await screen.findByRole("option", {
      name: "Source code + dependencies",
      hidden: true,
    });

    await userEvent.click(sourceCodePlusDependencies);

    const alert = screen.getByText(/warning alert:/i);
    const nextButton = screen.getByRole("button", { name: /next/i });
    await waitFor(() => expect(alert).toBeEnabled());
    await waitFor(() => expect(nextButton).toHaveAttribute("disabled", ""));
  });

  it("can run analysis on applications with a binary definition using defaults", async () => {
    const applicationsData = [
      {
        ...applicationData1,
        binary: "io.konveyor.demo:customers-tomcat:0.0.1-SNAPSHOT:war",
      },
      {
        ...applicationData2,
        binary: "io.konveyor.demo:customers-tomcat:0.0.1-SNAPSHOT:war",
      },
    ];

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

    // set default mode "Binary"
    const warning = screen.queryByLabelText(/warning alert/i);
    const nextButton = screen.getByRole("button", { name: /next/i });
    await waitFor(() => expect(warning).not.toBeInTheDocument());
    await waitFor(() => expect(nextButton).toBeEnabled());

    // set a target
    await userEvent.click(nextButton);
    const target = await screen.findByRole("heading", {
      name: /containerization/i,
    });
    await userEvent.click(target);
    await userEvent.click(nextButton);

    // set scope
    const scope = screen.getByRole("radio", {
      name: /wizard\.label\.scopealldeps/i,
    });
    await userEvent.click(scope);
    await userEvent.click(screen.getByRole("button", { name: /next/i }));

    // no custom rules
    await userEvent.click(screen.getByRole("button", { name: /next/i }));

    // no advanced options
    await userEvent.click(screen.getByRole("button", { name: /next/i }));

    // review
    expect(screen.getByText("App1")).toBeInTheDocument();
    expect(screen.getByText("App2")).toBeInTheDocument();
    expect(screen.getByText("Binary")).toBeInTheDocument();
    expect(screen.getByText("cloud-readiness")).toBeInTheDocument();
    expect(
      screen.getByText("Application and internal dependencies")
    ).toBeInTheDocument();
    expect(screen.getByText("Known Open Source libraries")).toBeInTheDocument();

    const runButton = await screen.findByRole("button", { name: /run/i });
    expect(runButton).toBeEnabled();
  });

  it("cannot upload a binary file when analyzing multiple applications", async () => {
    render(
      <AnalysisWizard
        applications={[applicationData1, applicationData2]}
        isOpen={isAnalyzeModalOpen}
        onClose={() => {
          setAnalyzeModalOpen(false);
        }}
      />
    );

    const mode = screen.getByText(/binary/i);
    await userEvent.click(mode);

    const uploadBinary = screen.queryByRole("option", {
      name: "Upload a local binary",
      hidden: true,
    });

    expect(uploadBinary).not.toBeInTheDocument();
  });
});
