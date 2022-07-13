import React from "react";
import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@app/test-config/test-utils";
import userEvent from "@testing-library/user-event";
import { AnalysisWizard } from "../analysis-wizard";
import { TASKGROUPS } from "@app/api/rest";
import mock from "@app/test-config/mockInstance";

jest.mock("react-i18next");
jest.mock("react-redux");

const applicationData1 = {
  id: 1,
  name: "App1",
};

const applicationData2 = {
  id: 2,
  name: "App2",
};

const taskgroupData = {
  id: 1,
  createUser: "admin",
  updateUser: "",
  createTime: "2022-07-13T13:20:49.838456782Z",
  name: "taskgroup.windup",
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
  bucket: "/buckets/cad7c340-e7c9-4935-8d7b-161d36667621",
  state: "Created",
  tasks: [
    {
      id: 0,
      createUser: "",
      updateUser: "",
      createTime: "0001-01-01T00:00:00Z",
      name: "App1.1.windup",
      data: {},
      application: {
        id: 1,
        name: "App1",
      },
      state: "",
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
    expect(alert).toBeEnabled();
    expect(nextButton).toHaveAttribute("disabled", "");
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
    render(
      <AnalysisWizard
        applications={[applicationData1, applicationData2]}
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

    mock.onPost(TASKGROUPS).reply(201, taskgroupData);

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

    // set default mode "Binary"
    const warning = screen.queryByLabelText(/warning alert/i);
    const nextButton = screen.getByRole("button", { name: /next/i });
    expect(warning).not.toBeInTheDocument();
    expect(nextButton).toBeEnabled();

    // set a target
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
    await user.click(screen.getByRole("button", { name: /next/i }));

    // no custom rules
    await user.click(screen.getByRole("button", { name: /next/i }));

    // no advanced options
    await user.click(screen.getByRole("button", { name: /next/i }));

    // review
    expect(screen.getByText("App1")).toBeInTheDocument();
    expect(screen.getByText("App2")).toBeInTheDocument();
    expect(screen.getByText("Binary")).toBeInTheDocument();
    expect(screen.getByText("cloud-readiness")).toBeInTheDocument();
    expect(
      screen.getByText("Application and internal dependencies")
    ).toBeInTheDocument();
    expect(screen.getByText("Known Open Source libraries")).toBeInTheDocument();

    const runButton = screen.getByRole("button", { name: /run/i });
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
    const user = userEvent.setup();

    const mode = screen.getByText(/binary/i);
    await user.click(mode);

    const uploadBinary = screen.queryByRole("option", {
      name: "Upload a local binary",
      hidden: true,
    });

    expect(uploadBinary).not.toBeInTheDocument();
  });

  it("allows uploading a binary file when analyzing one application", async () => {
    // http://localhost:8080/hub/taskgroups/7/bucket/binary/acmeair-webapp-1.0-SNAPSHOT.war

    mock.onPost(TASKGROUPS).reply(201, taskgroupData);
    mock.onPost(`${TASKGROUPS}/1/bucket/binary/example.jar`).reply(204);

    render(
      <AnalysisWizard
        applications={[applicationData1]}
        isOpen={isAnalyzeModalOpen}
        onClose={() => {
          setAnalyzeModalOpen(false);
        }}
      />
    );
    const user = userEvent.setup();

    const mode = screen.getByText(/binary/i);
    await user.click(mode);

    const uploadBinary = await screen.findByRole("option", {
      name: "Upload a local binary",
      hidden: true,
    });

    await user.click(uploadBinary);

    const warning = screen.queryByLabelText(/warning alert/i);
    expect(warning).not.toBeInTheDocument();

    const uploadButton = screen.getByRole("button", {
      name: /upload/i,
      hidden: true,
    });
    expect(uploadButton).toBeEnabled();

    const file = new File(["testing jar file"], "example.jar", {
      type: "application/java-archive",
    });

    fireEvent.change(uploadButton, {
      target: { files: [file] },
    });

    const nextButton = screen.getByRole("button", { name: /next/i });
    expect(nextButton).toBeEnabled();
  });
});
