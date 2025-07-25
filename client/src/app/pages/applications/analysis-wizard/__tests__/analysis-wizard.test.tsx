import React from "react";
import "@testing-library/jest-dom";
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@app/test-config/test-utils";
import { AnalysisWizard } from "../analysis-wizard";
import userEvent from "@testing-library/user-event";
import { server } from "@mocks/server";
import { rest } from "msw";

const applicationData1 = {
  id: 1,
  name: "App1",
  migrationWave: null,
};

const applicationData2 = {
  id: 2,
  name: "App2",
  migrationWave: null,
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
      withKnownLibs: false,
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
  beforeEach(() => {
    jest.clearAllMocks();
    server.use(rest.get("/hub/identities", (_, res, ctx) => res(ctx.json([]))));
  });

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

    const mode = screen.getByText(/binary|source code/i);
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
    let isOpen = true;
    const { container } = render(
      <AnalysisWizard
        applications={[applicationData1, applicationData2]}
        isOpen={isOpen}
        onClose={() => {
          isOpen = false;
        }}
      />
    );

    expect(container).toBeVisible();
    const mode = screen.getByText(/binary|source code/i);
    await userEvent.click(mode);

    const sourceCodePlusDependencies = await screen.findByRole("option", {
      name: "Source code + dependencies",
      hidden: true,
    });
    await userEvent.click(sourceCodePlusDependencies);

    // screen.debug(screen.getAllByRole("button", { hidden: true }));

    const alert = screen.getByText(/warning alert:/i);
    const nextButton = screen.getByRole("button", { name: /next/i });
    await waitFor(() => expect(alert).toBeEnabled());
    await waitFor(() => expect(nextButton).toHaveAttribute("disabled", ""));
  });

  // TODO
  it.skip("can run analysis on applications with a binary definition using defaults", async () => {
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

    server.use(
      rest.get("/hub/taskgroups", (req, res, ctx) => {
        return res(ctx.json([taskgroupData]));
      })
    );

    render(
      <AnalysisWizard
        applications={applicationsData}
        isOpen={isAnalyzeModalOpen}
        onClose={() => {
          setAnalyzeModalOpen(false);
        }}
      />
    );

    // set mode to "Binary"
    const modeSelector = await screen.findByLabelText("Source for analysis");
    expect(modeSelector).toBeInTheDocument();
    fireEvent.click(modeSelector);
    const binaryOption = await screen.findByText("Binary");
    fireEvent.click(binaryOption);

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

    const mode = screen.getByText(/binary|source code/i);
    await userEvent.click(mode);

    const uploadBinary = screen.queryByRole("option", {
      name: "Upload a local binary",
      hidden: true,
    });

    expect(uploadBinary).not.toBeInTheDocument();
  });
});
