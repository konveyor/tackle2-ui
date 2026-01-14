import { act, waitFor } from "@testing-library/react";
import { rest } from "msw";

import { AnalysisProfile, Taskgroup } from "@app/api/models";
import {
  createMockApplication,
  createMockNotifications,
  renderHook,
} from "@app/test-config/test-utils";
import { server } from "@mocks/server";

import { useTaskGroupManager } from "../useTaskGroupManager";
import { WizardState } from "../useWizardReducer";

// Track API calls for assertions
let capturedTaskgroupCreate: unknown = null;
let capturedTaskgroupSubmit: unknown = null;
let capturedTaskgroupDeleteId: number | null = null;

/**
 * Mock applications for testing
 */
const mockApplications = [
  createMockApplication({
    id: 1,
    name: "App1",
    repository: { url: "https://github.com/test/app1" },
  }),
  createMockApplication({
    id: 2,
    name: "App2",
    binary: "io.test:app2:1.0.0:war",
  }),
];

/**
 * Mock analysis profile for testing
 */
const mockAnalysisProfile: AnalysisProfile = {
  id: 42,
  name: "Test Profile",
  description: "A test profile for analysis",
  mode: { withDeps: true },
  scope: { withKnownLibs: false, packages: {} },
  rules: { labels: {} },
};

/**
 * Create a minimal valid wizard state for manual mode
 */
const createManualWizardState = (
  overrides: Partial<WizardState> = {}
): WizardState => ({
  flowMode: {
    flowMode: "manual",
    selectedProfile: null,
    isValid: true,
  },
  mode: {
    mode: "source-code-deps",
    artifact: null,
    isValid: true,
  },
  targets: {
    selectedTargets: [],
    targetStatus: {},
    isValid: true,
  },
  scope: {
    withKnownLibs: "app",
    includedPackages: [],
    hasExcludedPackages: false,
    excludedPackages: [],
    isValid: true,
  },
  customRules: {
    rulesKind: "manual",
    customRulesFiles: [],
    customLabels: [],
    isValid: true,
  },
  options: {
    additionalTargetLabels: [],
    additionalSourceLabels: [],
    excludedLabels: [],
    autoTaggingEnabled: true,
    advancedAnalysisEnabled: false,
    saveAsProfile: false,
    profileName: undefined,
    isValid: true,
  },
  isReady: true,
  ...overrides,
});

/**
 * Create a minimal valid wizard state for profile mode
 */
const createProfileWizardState = (
  profile: AnalysisProfile,
  overrides: Partial<WizardState> = {}
): WizardState => ({
  flowMode: {
    flowMode: "profile",
    selectedProfile: profile,
    isValid: true,
  },
  mode: {
    mode: "source-code-deps",
    artifact: null,
    isValid: false,
  },
  targets: {
    selectedTargets: [],
    targetStatus: {},
    isValid: true,
  },
  scope: {
    withKnownLibs: "app",
    includedPackages: [],
    hasExcludedPackages: false,
    excludedPackages: [],
    isValid: true,
  },
  customRules: {
    rulesKind: "manual",
    customRulesFiles: [],
    customLabels: [],
    isValid: true,
  },
  options: {
    additionalTargetLabels: [],
    additionalSourceLabels: [],
    excludedLabels: [],
    autoTaggingEnabled: true,
    advancedAnalysisEnabled: false,
    saveAsProfile: false,
    profileName: undefined,
    isValid: true,
  },
  isReady: true,
  ...overrides,
});

describe("useTaskGroupManager", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    capturedTaskgroupCreate = null;
    capturedTaskgroupSubmit = null;
    capturedTaskgroupDeleteId = null;

    // Set up MSW handlers to capture API calls
    server.use(
      // Create taskgroup endpoint
      rest.post("/hub/taskgroups", async (req, res, ctx) => {
        capturedTaskgroupCreate = await req.json();
        const createdTaskgroup: Taskgroup = {
          id: 100,
          name: "taskgroup.analyzer",
          kind: "analyzer",
          data: capturedTaskgroupCreate as Taskgroup["data"],
          tasks: [],
        };
        return res(ctx.status(201), ctx.json(createdTaskgroup));
      }),

      // Submit taskgroup endpoint
      rest.put("/hub/taskgroups/:id/submit", async (req, res, ctx) => {
        capturedTaskgroupSubmit = await req.json();
        return res(ctx.status(204));
      }),

      // Delete taskgroup endpoint
      rest.delete("/hub/taskgroups/:id", (req, res, ctx) => {
        capturedTaskgroupDeleteId = Number(req.params.id);
        return res(ctx.status(204));
      })
    );
  });

  describe("ensureTaskGroup", () => {
    it("creates a taskgroup when none exists", async () => {
      const { result } = renderHook(() => useTaskGroupManager());

      let taskgroup: Taskgroup | undefined;
      await act(async () => {
        taskgroup = await result.current.ensureTaskGroup();
      });

      expect(taskgroup).toBeDefined();
      expect(taskgroup?.id).toBe(100);
      expect(capturedTaskgroupCreate).toBeDefined();
    });

    it("returns existing taskgroup on subsequent calls", async () => {
      const { result } = renderHook(() => useTaskGroupManager());

      let taskgroup1: Taskgroup | undefined;
      let taskgroup2: Taskgroup | undefined;

      await act(async () => {
        taskgroup1 = await result.current.ensureTaskGroup();
        taskgroup2 = await result.current.ensureTaskGroup();
      });

      // Both should return the same taskgroup
      expect(taskgroup1?.id).toBe(taskgroup2?.id);
    });
  });

  describe("submitAnalysis - Manual mode", () => {
    it("sends correct taskgroup data shape for manual mode", async () => {
      const { result } = renderHook(() => useTaskGroupManager());
      const wizardState = createManualWizardState();

      await act(async () => {
        await result.current.submitAnalysis(wizardState, mockApplications, []);
      });

      await waitFor(() => {
        expect(capturedTaskgroupSubmit).toBeDefined();
      });

      const submittedData = capturedTaskgroupSubmit as Taskgroup;

      // Manual mode should have mode, scope, and rules
      expect(submittedData.data).toHaveProperty("mode");
      expect(submittedData.data).toHaveProperty("scope");
      expect(submittedData.data).toHaveProperty("rules");
      expect(submittedData.data).toHaveProperty("tagger");
      expect(submittedData.data).toHaveProperty("verbosity");

      // Should NOT have profile field
      expect(submittedData.data).not.toHaveProperty("profile");
    });

    it("sets withDeps true for source-code-deps mode", async () => {
      const { result } = renderHook(() => useTaskGroupManager());
      const wizardState = createManualWizardState({
        mode: { mode: "source-code-deps", artifact: null, isValid: true },
      });

      await act(async () => {
        await result.current.submitAnalysis(wizardState, mockApplications, []);
      });

      await waitFor(() => {
        expect(capturedTaskgroupSubmit).toBeDefined();
      });

      const submittedData = capturedTaskgroupSubmit as Taskgroup;
      expect(submittedData.data?.mode?.withDeps).toBe(true);
      expect(submittedData.data?.mode?.binary).toBe(false);
    });

    it("sets binary true for binary mode", async () => {
      const { result } = renderHook(() => useTaskGroupManager());
      const wizardState = createManualWizardState({
        mode: { mode: "binary", artifact: null, isValid: true },
      });

      await act(async () => {
        await result.current.submitAnalysis(wizardState, mockApplications, []);
      });

      await waitFor(() => {
        expect(capturedTaskgroupSubmit).toBeDefined();
      });

      const submittedData = capturedTaskgroupSubmit as Taskgroup;
      expect(submittedData.data?.mode?.binary).toBe(true);
      expect(submittedData.data?.mode?.withDeps).toBe(false);
    });

    it("sets scope with known libs when oss is selected", async () => {
      const { result } = renderHook(() => useTaskGroupManager());
      const wizardState = createManualWizardState({
        scope: {
          withKnownLibs: "app,oss",
          includedPackages: [],
          hasExcludedPackages: false,
          excludedPackages: [],
          isValid: true,
        },
      });

      await act(async () => {
        await result.current.submitAnalysis(wizardState, mockApplications, []);
      });

      await waitFor(() => {
        expect(capturedTaskgroupSubmit).toBeDefined();
      });

      const submittedData = capturedTaskgroupSubmit as Taskgroup;
      expect(submittedData.data?.scope?.withKnownLibs).toBe(true);
    });

    it("includes excluded packages when hasExcludedPackages is true", async () => {
      const { result } = renderHook(() => useTaskGroupManager());
      const wizardState = createManualWizardState({
        scope: {
          withKnownLibs: "app",
          includedPackages: [],
          hasExcludedPackages: true,
          excludedPackages: ["com.excluded.package"],
          isValid: true,
        },
      });

      await act(async () => {
        await result.current.submitAnalysis(wizardState, mockApplications, []);
      });

      await waitFor(() => {
        expect(capturedTaskgroupSubmit).toBeDefined();
      });

      const submittedData = capturedTaskgroupSubmit as Taskgroup;
      expect(submittedData.data?.scope?.packages?.excluded).toEqual([
        "com.excluded.package",
      ]);
    });

    it("sets tagger enabled based on autoTaggingEnabled option", async () => {
      const { result } = renderHook(() => useTaskGroupManager());
      const wizardState = createManualWizardState({
        options: {
          additionalTargetLabels: [],
          additionalSourceLabels: [],
          excludedLabels: [],
          autoTaggingEnabled: false,
          advancedAnalysisEnabled: false,
          saveAsProfile: false,
          profileName: undefined,
          isValid: true,
        },
      });

      await act(async () => {
        await result.current.submitAnalysis(wizardState, mockApplications, []);
      });

      await waitFor(() => {
        expect(capturedTaskgroupSubmit).toBeDefined();
      });

      const submittedData = capturedTaskgroupSubmit as Taskgroup;
      expect(submittedData.data?.tagger?.enabled).toBe(false);
    });

    it("sets verbosity to 1 when advancedAnalysisEnabled is true", async () => {
      const { result } = renderHook(() => useTaskGroupManager());
      const wizardState = createManualWizardState({
        options: {
          additionalTargetLabels: [],
          additionalSourceLabels: [],
          excludedLabels: [],
          autoTaggingEnabled: true,
          advancedAnalysisEnabled: true,
          saveAsProfile: false,
          profileName: undefined,
          isValid: true,
        },
      });

      await act(async () => {
        await result.current.submitAnalysis(wizardState, mockApplications, []);
      });

      await waitFor(() => {
        expect(capturedTaskgroupSubmit).toBeDefined();
      });

      const submittedData = capturedTaskgroupSubmit as Taskgroup;
      expect(submittedData.data?.verbosity).toBe(1);
    });

    it("creates tasks for each application", async () => {
      const { result } = renderHook(() => useTaskGroupManager());
      const wizardState = createManualWizardState();

      await act(async () => {
        await result.current.submitAnalysis(wizardState, mockApplications, []);
      });

      await waitFor(() => {
        expect(capturedTaskgroupSubmit).toBeDefined();
      });

      const submittedData = capturedTaskgroupSubmit as Taskgroup;
      expect(submittedData.tasks).toHaveLength(2);
      expect(submittedData.tasks?.[0].name).toBe("App1.1.analyzer");
      expect(submittedData.tasks?.[0].application?.id).toBe(1);
      expect(submittedData.tasks?.[1].name).toBe("App2.2.analyzer");
      expect(submittedData.tasks?.[1].application?.id).toBe(2);
    });
  });

  describe("submitAnalysis - Profile mode", () => {
    it("sends correct taskgroup data shape for profile mode", async () => {
      const { result } = renderHook(() => useTaskGroupManager());
      const wizardState = createProfileWizardState(mockAnalysisProfile);

      await act(async () => {
        await result.current.submitAnalysis(wizardState, mockApplications, []);
      });

      await waitFor(() => {
        expect(capturedTaskgroupSubmit).toBeDefined();
      });

      const submittedData = capturedTaskgroupSubmit as Taskgroup;

      // Profile mode should have profile ID, tagger, and verbosity
      expect(submittedData.data).toHaveProperty("profile");
      expect(submittedData.data).toHaveProperty("tagger");
      expect(submittedData.data).toHaveProperty("verbosity");

      // Should NOT have mode, scope, or rules
      expect(submittedData.data).not.toHaveProperty("mode");
      expect(submittedData.data).not.toHaveProperty("scope");
      expect(submittedData.data).not.toHaveProperty("rules");
    });

    it("includes the selected profile ID", async () => {
      const { result } = renderHook(() => useTaskGroupManager());
      const wizardState = createProfileWizardState(mockAnalysisProfile);

      await act(async () => {
        await result.current.submitAnalysis(wizardState, mockApplications, []);
      });

      await waitFor(() => {
        expect(capturedTaskgroupSubmit).toBeDefined();
      });

      const submittedData = capturedTaskgroupSubmit as Taskgroup;
      expect(submittedData.data?.profile).toMatchObject({ id: 42 });
    });

    it("respects autoTaggingEnabled setting in profile mode", async () => {
      const { result } = renderHook(() => useTaskGroupManager());
      const wizardState = createProfileWizardState(mockAnalysisProfile, {
        options: {
          additionalTargetLabels: [],
          additionalSourceLabels: [],
          excludedLabels: [],
          autoTaggingEnabled: false,
          advancedAnalysisEnabled: false,
          saveAsProfile: false,
          profileName: undefined,
          isValid: true,
        },
      });

      await act(async () => {
        await result.current.submitAnalysis(wizardState, mockApplications, []);
      });

      await waitFor(() => {
        expect(capturedTaskgroupSubmit).toBeDefined();
      });

      const submittedData = capturedTaskgroupSubmit as Taskgroup;
      expect(submittedData.data?.tagger?.enabled).toBe(false);
    });

    it("respects advancedAnalysisEnabled setting in profile mode", async () => {
      const { result } = renderHook(() => useTaskGroupManager());
      const wizardState = createProfileWizardState(mockAnalysisProfile, {
        options: {
          additionalTargetLabels: [],
          additionalSourceLabels: [],
          excludedLabels: [],
          autoTaggingEnabled: true,
          advancedAnalysisEnabled: true,
          saveAsProfile: false,
          profileName: undefined,
          isValid: true,
        },
      });

      await act(async () => {
        await result.current.submitAnalysis(wizardState, mockApplications, []);
      });

      await waitFor(() => {
        expect(capturedTaskgroupSubmit).toBeDefined();
      });

      const submittedData = capturedTaskgroupSubmit as Taskgroup;
      expect(submittedData.data?.verbosity).toBe(1);
    });

    it("creates tasks for each application in profile mode", async () => {
      const { result } = renderHook(() => useTaskGroupManager());
      const wizardState = createProfileWizardState(mockAnalysisProfile);

      await act(async () => {
        await result.current.submitAnalysis(wizardState, mockApplications, []);
      });

      await waitFor(() => {
        expect(capturedTaskgroupSubmit).toBeDefined();
      });

      const submittedData = capturedTaskgroupSubmit as Taskgroup;
      expect(submittedData.tasks).toHaveLength(2);
    });
  });

  describe("cancelAnalysis", () => {
    it("deletes the taskgroup when one exists", async () => {
      const { result } = renderHook(() => useTaskGroupManager());

      // First create a taskgroup
      await act(async () => {
        await result.current.ensureTaskGroup();
      });

      // Then cancel/delete it
      act(() => {
        result.current.cancelAnalysis();
      });

      await waitFor(() => {
        expect(capturedTaskgroupDeleteId).toBe(100);
      });
    });

    it("does nothing when no taskgroup exists", async () => {
      const { result } = renderHook(() => useTaskGroupManager());

      // Cancel without creating a taskgroup
      act(() => {
        result.current.cancelAnalysis();
      });

      // Should not call delete
      expect(capturedTaskgroupDeleteId).toBeNull();
    });
  });

  describe("notifications", () => {
    it("shows success notification on submit", async () => {
      const notifications = createMockNotifications();
      const { result } = renderHook(() => useTaskGroupManager(), {
        notifications,
      });
      const wizardState = createManualWizardState();

      await act(async () => {
        await result.current.submitAnalysis(wizardState, mockApplications, []);
      });

      await waitFor(() => {
        expect(notifications.pushNotification).toHaveBeenCalledWith(
          expect.objectContaining({
            title: "Applications",
            message: "Submitted for analysis",
            variant: "info",
          })
        );
      });
    });
  });
});
