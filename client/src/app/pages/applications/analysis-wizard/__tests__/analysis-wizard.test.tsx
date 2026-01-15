import "@testing-library/jest-dom";
import userEvent from "@testing-library/user-event";
import { rest } from "msw";

import { render, screen, waitFor } from "@app/test-config/test-utils";
import { server } from "@mocks/server";

import { AnalysisWizard } from "../analysis-wizard";

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

const mockAnalysisProfile = {
  id: 1,
  name: "Test Profile",
  description: "A test analysis profile",
  mode: { withDeps: true },
  scope: { withKnownLibs: false, packages: {} },
  rules: { labels: {} },
};

/**
 * Helper function to navigate from Mode step to Analysis Source step
 * by clicking Next (manual mode is selected by default)
 */
const navigateToAnalysisSourceStep = async () => {
  // The wizard starts on Mode step with "Manual selection" selected by default
  // Click Next to proceed to Analysis Source step
  const nextButton = screen.getByRole("button", { name: /next/i });
  await userEvent.click(nextButton);
};

describe("<AnalysisWizard />", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    server.use(
      rest.get("/hub/identities", (_, res, ctx) => res(ctx.json([]))),
      rest.get("/hub/archetypes", (_, res, ctx) => res(ctx.json([]))),
      rest.get("/hub/analysis/profiles", (_, res, ctx) => res(ctx.json([])))
    );
  });

  let isAnalyzeModalOpen = true;
  const setAnalyzeModalOpen = (toggle: boolean) =>
    (isAnalyzeModalOpen = toggle);

  describe("General wizard behavior", () => {
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

      const cancelButton = await screen.findByRole("button", {
        name: /Cancel/,
      });
      expect(cancelButton).toBeEnabled();
    });

    it("starts on Mode step with manual selection by default", async () => {
      render(
        <AnalysisWizard
          applications={[applicationData1, applicationData2]}
          isOpen={isAnalyzeModalOpen}
          onClose={() => {
            setAnalyzeModalOpen(false);
          }}
        />
      );

      // Should see the Mode step content - look for radio by translation key (mock i18n returns keys)
      const manualRadio = await screen.findByRole("radio", {
        name: /wizard\.label\.manualSelection/i,
      });
      expect(manualRadio).toBeChecked();

      const profileRadio = screen.getByRole("radio", {
        name: /wizard\.label\.useAnalysisProfile/i,
      });
      expect(profileRadio).not.toBeChecked();
    });
  });

  describe("Manual mode flow", () => {
    it("has next button disabled on Analysis Source step when applications have no binary source defined", async () => {
      render(
        <AnalysisWizard
          applications={[applicationData1, applicationData2]}
          isOpen={isAnalyzeModalOpen}
          onClose={() => {
            setAnalyzeModalOpen(false);
          }}
        />
      );

      // Navigate from Mode step to Analysis Source step
      await navigateToAnalysisSourceStep();

      // Now we should be on Analysis Source step
      const alert = await screen.findByText(/warning alert:/i);
      const nextButton = screen.getByRole("button", { name: /next/i });

      await waitFor(() => expect(alert).toBeVisible());
      await waitFor(() => expect(nextButton).toHaveAttribute("disabled", ""));
    });

    it("has next button disabled on Analysis Source step when applications have no source code defined", async () => {
      render(
        <AnalysisWizard
          applications={[applicationData1, applicationData2]}
          isOpen={isAnalyzeModalOpen}
          onClose={() => {
            setAnalyzeModalOpen(false);
          }}
        />
      );

      // Navigate from Mode step to Analysis Source step
      await navigateToAnalysisSourceStep();

      // The analysis source dropdown has toggleAriaLabel="Analysis source dropdown toggle"
      const modeDropdown = await screen.findByRole("button", {
        name: /analysis source dropdown toggle/i,
      });
      await userEvent.click(modeDropdown);

      // Options are hardcoded, not translated
      const sourceCode = await screen.findByRole("option", {
        name: "Source code",
        hidden: true,
      });
      await userEvent.click(sourceCode);

      const alert = screen.getByText(/warning alert:/i);
      const nextButton = screen.getByRole("button", { name: /next/i });
      await waitFor(() => expect(alert).toBeVisible());
      await waitFor(() => expect(nextButton).toHaveAttribute("disabled", ""));
    });

    it("has next button disabled on Analysis Source step when applications have no source code + dependencies defined", async () => {
      let isOpen = true;
      render(
        <AnalysisWizard
          applications={[applicationData1, applicationData2]}
          isOpen={isOpen}
          onClose={() => {
            isOpen = false;
          }}
        />
      );

      // Navigate from Mode step to Analysis Source step
      await navigateToAnalysisSourceStep();

      // The analysis source dropdown has toggleAriaLabel="Analysis source dropdown toggle"
      const modeDropdown = await screen.findByRole("button", {
        name: /analysis source dropdown toggle/i,
      });
      await userEvent.click(modeDropdown);

      // Options are hardcoded, not translated
      const sourceCodePlusDependencies = await screen.findByRole("option", {
        name: "Source code + dependencies",
        hidden: true,
      });
      await userEvent.click(sourceCodePlusDependencies);

      const alert = screen.getByText(/warning alert:/i);
      const nextButton = screen.getByRole("button", { name: /next/i });
      await waitFor(() => expect(alert).toBeVisible());
      await waitFor(() => expect(nextButton).toHaveAttribute("disabled", ""));
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

      // Navigate from Mode step to Analysis Source step
      await navigateToAnalysisSourceStep();

      // Open the mode dropdown
      const modeDropdown = await screen.findByRole("button", {
        name: /analysis source dropdown toggle/i,
      });
      await userEvent.click(modeDropdown);

      // "Upload a local binary" should not be available for multiple applications
      const uploadBinary = screen.queryByRole("option", {
        name: "Upload a local binary",
        hidden: true,
      });

      expect(uploadBinary).not.toBeInTheDocument();
    });
  });

  describe("Profile mode flow", () => {
    it("shows profile selection when profile mode is selected", async () => {
      server.use(
        rest.get("/hub/analysis/profiles", (_, res, ctx) =>
          res(ctx.json([mockAnalysisProfile]))
        )
      );

      render(
        <AnalysisWizard
          applications={[applicationData1, applicationData2]}
          isOpen={isAnalyzeModalOpen}
          onClose={() => {
            setAnalyzeModalOpen(false);
          }}
        />
      );

      // Select profile mode
      const profileRadio = await screen.findByRole("radio", {
        name: /wizard\.label\.useAnalysisProfile/i,
      });
      await userEvent.click(profileRadio);

      // Should show profile selection dropdown
      await waitFor(() => {
        const profileSelect = screen.getByRole("button", {
          name: /analysis profile selection/i,
        });
        expect(profileSelect).toBeInTheDocument();
      });
    });

    it("shows empty state when no profiles are available", async () => {
      server.use(
        rest.get("/hub/analysis/profiles", (_, res, ctx) => res(ctx.json([])))
      );

      render(
        <AnalysisWizard
          applications={[applicationData1, applicationData2]}
          isOpen={isAnalyzeModalOpen}
          onClose={() => {
            setAnalyzeModalOpen(false);
          }}
        />
      );

      // Select profile mode
      const profileRadio = await screen.findByRole("radio", {
        name: /wizard\.label\.useAnalysisProfile/i,
      });
      await userEvent.click(profileRadio);

      // Should show empty state heading (exact match to avoid matching description)
      const emptyState = await screen.findByRole("heading", {
        name: "wizard.label.noProfilesAvailable",
      });
      expect(emptyState).toBeInTheDocument();
    });

    it("disables Next button when profile mode is selected but no profile is chosen", async () => {
      server.use(
        rest.get("/hub/analysis/profiles", (_, res, ctx) =>
          res(ctx.json([mockAnalysisProfile]))
        )
      );

      render(
        <AnalysisWizard
          applications={[applicationData1, applicationData2]}
          isOpen={isAnalyzeModalOpen}
          onClose={() => {
            setAnalyzeModalOpen(false);
          }}
        />
      );

      // Select profile mode
      const profileRadio = await screen.findByRole("radio", {
        name: /wizard\.label\.useAnalysisProfile/i,
      });
      await userEvent.click(profileRadio);

      // Next button should be disabled
      const nextButton = screen.getByRole("button", { name: /next/i });
      await waitFor(() => expect(nextButton).toHaveAttribute("disabled", ""));
    });

    it("enables Next button when a profile is selected", async () => {
      server.use(
        rest.get("/hub/analysis/profiles", (_, res, ctx) =>
          res(ctx.json([mockAnalysisProfile]))
        )
      );

      render(
        <AnalysisWizard
          applications={[applicationData1, applicationData2]}
          isOpen={isAnalyzeModalOpen}
          onClose={() => {
            setAnalyzeModalOpen(false);
          }}
        />
      );

      // Select profile mode
      const profileRadio = await screen.findByRole("radio", {
        name: /wizard\.label\.useAnalysisProfile/i,
      });
      await userEvent.click(profileRadio);

      // Wait for profile dropdown to appear
      const profileDropdown = await screen.findByRole("button", {
        name: /analysis profile selection/i,
      });
      await userEvent.click(profileDropdown);

      // Select the profile
      const profileOption = await screen.findByRole("option", {
        name: "Test Profile",
        hidden: true,
      });
      await userEvent.click(profileOption);

      // Next button should be enabled
      const nextButton = screen.getByRole("button", { name: /next/i });
      await waitFor(() => expect(nextButton).toBeEnabled());
    });

    it("switches back to manual mode and hides profile selection", async () => {
      server.use(
        rest.get("/hub/analysis/profiles", (_, res, ctx) =>
          res(ctx.json([mockAnalysisProfile]))
        )
      );

      render(
        <AnalysisWizard
          applications={[applicationData1, applicationData2]}
          isOpen={isAnalyzeModalOpen}
          onClose={() => {
            setAnalyzeModalOpen(false);
          }}
        />
      );

      // Select profile mode
      const profileRadio = await screen.findByRole("radio", {
        name: /wizard\.label\.useAnalysisProfile/i,
      });
      await userEvent.click(profileRadio);

      // Verify profile selection is shown
      await waitFor(() => {
        const profileSelect = screen.getByRole("button", {
          name: /analysis profile selection/i,
        });
        expect(profileSelect).toBeInTheDocument();
      });

      // Switch back to manual mode
      const manualRadio = screen.getByRole("radio", {
        name: /wizard\.label\.manualSelection/i,
      });
      await userEvent.click(manualRadio);

      // Profile selection should be hidden
      await waitFor(() => {
        expect(
          screen.queryByRole("button", { name: /analysis profile selection/i })
        ).not.toBeInTheDocument();
      });

      // Next button should be enabled (manual is always valid)
      const nextButton = screen.getByRole("button", { name: /next/i });
      expect(nextButton).toBeEnabled();
    });
  });
});
