import { act, renderHook } from "@testing-library/react";

import { ApplicationAssetGenerationTask, TargetProfile } from "@app/api/models";
import { DecoratedApplication } from "@app/pages/applications/useDecoratedApplications";

import { AdvancedOptionsState } from "../step-advanced-options";
import { ParameterState } from "../step-capture-parameters";
import { ResultsData } from "../step-results";
import {
  InitialStateRecipe,
  WizardState,
  useWizardReducer,
} from "../useWizardReducer";

// Mock data for testing
const mockTargetProfile: TargetProfile = {
  id: 1,
  name: "Test Target Profile",
  generators: [
    { id: 1, name: "Generator 1" },
    { id: 2, name: "Generator 2" },
  ],
};

const mockValidParameters: ParameterState = {
  isValid: true,
  parametersRequired: true,
  parameters: { testParam: "testValue" },
  schema: {
    type: "object",
    properties: {
      testParam: { type: "string" },
    },
  },
};

const mockInvalidParameters: ParameterState = {
  isValid: false,
  parametersRequired: true,
  parameters: {},
};

const mockValidAdvancedOptions: AdvancedOptionsState = {
  isValid: true,
  renderTemplates: true,
};

const mockInvalidAdvancedOptions: AdvancedOptionsState = {
  isValid: false,
  renderTemplates: false,
};

const mockResults: ResultsData = {
  success: [
    {
      task: {
        id: 1,
        kind: "asset-generation",
        name: "test-generation-task",
        application: { id: 1, name: "test-app" },
      } as ApplicationAssetGenerationTask,
      application: {} as DecoratedApplication,
    },
  ],
  failure: [],
};

describe("useWizardReducer (generate-assets-wizard)", () => {
  it("initializes with default state", () => {
    const { result } = renderHook(() => useWizardReducer());

    const expectedInitialState: WizardState = {
      profile: undefined,
      parameters: {
        isValid: true, // Note: This is true by default due to TODO #2498 comment
        parametersRequired: false,
      },
      advancedOptions: {
        isValid: true,
        renderTemplates: true,
      },
      isReady: false,
      results: null,
    };

    expect(result.current.state).toEqual(expectedInitialState);
  });

  it("initializes with custom initial state recipe", () => {
    const customInitialRecipe: InitialStateRecipe = (draft) => {
      draft.profile = mockTargetProfile;
      draft.parameters = mockValidParameters;
      draft.advancedOptions = mockValidAdvancedOptions;
    };

    const { result } = renderHook(() => useWizardReducer(customInitialRecipe));

    expect(result.current.state.profile).toEqual(mockTargetProfile);
    expect(result.current.state.parameters).toEqual(mockValidParameters);
    expect(result.current.state.advancedOptions).toEqual(
      mockValidAdvancedOptions
    );
    expect(result.current.state.isReady).toBe(true); // Should be true since all conditions are met
  });

  describe("setProfile", () => {
    it("sets target profile and updates isReady state correctly", () => {
      const { result } = renderHook(() => useWizardReducer());

      act(() => {
        result.current.setProfile(mockTargetProfile);
      });

      expect(result.current.state.profile).toEqual(mockTargetProfile);
      expect(result.current.state.isReady).toBe(true); // Should be true because default parameters and advancedOptions are valid
    });

    it("updates existing profile", () => {
      const { result } = renderHook(() => useWizardReducer());

      const updatedProfile: TargetProfile = {
        id: 2,
        name: "Updated Target Profile",
        generators: [{ id: 3, name: "Generator 3" }],
      };

      // Set initial profile
      act(() => {
        result.current.setProfile(mockTargetProfile);
      });

      // Update to new profile
      act(() => {
        result.current.setProfile(updatedProfile);
      });

      expect(result.current.state.profile).toEqual(updatedProfile);
    });
  });

  describe("setParameters", () => {
    it("sets valid parameters and updates isReady state", () => {
      const { result } = renderHook(() => useWizardReducer());

      act(() => {
        result.current.setParameters(mockValidParameters);
      });

      expect(result.current.state.parameters).toEqual(mockValidParameters);
      expect(result.current.state.isReady).toBe(false); // Still false because no profile is set
    });

    it("sets invalid parameters", () => {
      const { result } = renderHook(() => useWizardReducer());

      act(() => {
        result.current.setParameters(mockInvalidParameters);
      });

      expect(result.current.state.parameters).toEqual(mockInvalidParameters);
      expect(result.current.state.isReady).toBe(false);
    });

    it("updates existing parameters", () => {
      const { result } = renderHook(() => useWizardReducer());

      // Set initial parameters
      act(() => {
        result.current.setParameters(mockInvalidParameters);
      });

      // Update to valid parameters
      act(() => {
        result.current.setParameters(mockValidParameters);
      });

      expect(result.current.state.parameters).toEqual(mockValidParameters);
    });
  });

  describe("setAdvancedOptions", () => {
    it("sets valid advanced options and updates isReady state", () => {
      const { result } = renderHook(() => useWizardReducer());

      act(() => {
        result.current.setAdvancedOptions(mockValidAdvancedOptions);
      });

      expect(result.current.state.advancedOptions).toEqual(
        mockValidAdvancedOptions
      );
      expect(result.current.state.isReady).toBe(false); // Still false because no profile is set
    });

    it("sets invalid advanced options", () => {
      const { result } = renderHook(() => useWizardReducer());

      act(() => {
        result.current.setAdvancedOptions(mockInvalidAdvancedOptions);
      });

      expect(result.current.state.advancedOptions).toEqual(
        mockInvalidAdvancedOptions
      );
      expect(result.current.state.isReady).toBe(false);
    });

    it("updates existing advanced options", () => {
      const { result } = renderHook(() => useWizardReducer());

      // Set initial advanced options
      act(() => {
        result.current.setAdvancedOptions(mockInvalidAdvancedOptions);
      });

      // Update to valid advanced options
      act(() => {
        result.current.setAdvancedOptions(mockValidAdvancedOptions);
      });

      expect(result.current.state.advancedOptions).toEqual(
        mockValidAdvancedOptions
      );
    });
  });

  describe("setResults", () => {
    it("sets results data", () => {
      const { result } = renderHook(() => useWizardReducer());

      act(() => {
        result.current.setResults(mockResults);
      });

      expect(result.current.state.results).toEqual(mockResults);
    });

    it("sets results to null", () => {
      const { result } = renderHook(() => useWizardReducer());

      // First set results
      act(() => {
        result.current.setResults(mockResults);
      });

      // Then set to null
      act(() => {
        result.current.setResults(null);
      });

      expect(result.current.state.results).toBeNull();
    });
  });

  describe("isReady state calculation", () => {
    it("sets isReady to true when profile, valid parameters, and valid advanced options are all set", () => {
      const { result } = renderHook(() => useWizardReducer());

      act(() => {
        result.current.setProfile(mockTargetProfile);
        result.current.setParameters(mockValidParameters);
        result.current.setAdvancedOptions(mockValidAdvancedOptions);
      });

      expect(result.current.state.isReady).toBe(true);
    });

    it("keeps isReady false when profile is missing", () => {
      const { result } = renderHook(() => useWizardReducer());

      act(() => {
        result.current.setParameters(mockValidParameters);
        result.current.setAdvancedOptions(mockValidAdvancedOptions);
      });

      expect(result.current.state.isReady).toBe(false);
    });

    it("keeps isReady false when parameters are invalid", () => {
      const { result } = renderHook(() => useWizardReducer());

      act(() => {
        result.current.setProfile(mockTargetProfile);
        result.current.setParameters(mockInvalidParameters);
        result.current.setAdvancedOptions(mockValidAdvancedOptions);
      });

      expect(result.current.state.isReady).toBe(false);
    });

    it("keeps isReady false when advanced options are invalid", () => {
      const { result } = renderHook(() => useWizardReducer());

      act(() => {
        result.current.setProfile(mockTargetProfile);
        result.current.setParameters(mockValidParameters);
        result.current.setAdvancedOptions(mockInvalidAdvancedOptions);
      });

      expect(result.current.state.isReady).toBe(false);
    });

    it("sets isReady to false when profile is removed", () => {
      const { result } = renderHook(() => useWizardReducer());

      // Set all to valid state
      act(() => {
        result.current.setProfile(mockTargetProfile);
        result.current.setParameters(mockValidParameters);
        result.current.setAdvancedOptions(mockValidAdvancedOptions);
      });

      expect(result.current.state.isReady).toBe(true);

      // Reset to state without profile
      act(() => {
        result.current.reset();
      });

      expect(result.current.state.isReady).toBe(false);
    });

    it("sets isReady to false when parameters become invalid", () => {
      const { result } = renderHook(() => useWizardReducer());

      // Set all to valid state
      act(() => {
        result.current.setProfile(mockTargetProfile);
        result.current.setParameters(mockValidParameters);
        result.current.setAdvancedOptions(mockValidAdvancedOptions);
      });

      expect(result.current.state.isReady).toBe(true);

      // Make parameters invalid
      act(() => {
        result.current.setParameters(mockInvalidParameters);
      });

      expect(result.current.state.isReady).toBe(false);
    });

    it("sets isReady to false when advanced options become invalid", () => {
      const { result } = renderHook(() => useWizardReducer());

      // Set all to valid state
      act(() => {
        result.current.setProfile(mockTargetProfile);
        result.current.setParameters(mockValidParameters);
        result.current.setAdvancedOptions(mockValidAdvancedOptions);
      });

      expect(result.current.state.isReady).toBe(true);

      // Make advanced options invalid
      act(() => {
        result.current.setAdvancedOptions(mockInvalidAdvancedOptions);
      });

      expect(result.current.state.isReady).toBe(false);
    });
  });

  describe("reset functionality", () => {
    it("resets to initial default state", () => {
      const { result } = renderHook(() => useWizardReducer());

      // Modify state
      act(() => {
        result.current.setProfile(mockTargetProfile);
        result.current.setParameters(mockValidParameters);
        result.current.setAdvancedOptions(mockValidAdvancedOptions);
        result.current.setResults(mockResults);
      });

      // Verify state is modified
      expect(result.current.state.profile).toEqual(mockTargetProfile);
      expect(result.current.state.parameters).toEqual(mockValidParameters);
      expect(result.current.state.advancedOptions).toEqual(
        mockValidAdvancedOptions
      );
      expect(result.current.state.results).toEqual(mockResults);
      expect(result.current.state.isReady).toBe(true);

      // Reset
      act(() => {
        result.current.reset();
      });

      // Verify state is back to initial
      const expectedInitialState: WizardState = {
        profile: undefined,
        parameters: {
          isValid: true, // Note: This is true by default due to TODO #2498 comment
          parametersRequired: false,
        },
        advancedOptions: {
          isValid: true,
          renderTemplates: true,
        },
        isReady: false,
        results: null,
      };

      expect(result.current.state).toEqual(expectedInitialState);
    });

    it("resets to custom initial state when initialized with recipe", () => {
      const customInitialRecipe: InitialStateRecipe = (draft) => {
        draft.profile = mockTargetProfile;
        draft.parameters = {
          isValid: true,
          parametersRequired: true,
          parameters: { customParam: "customValue" },
        };
        draft.advancedOptions = {
          isValid: true,
          renderTemplates: false,
        };
      };

      const { result } = renderHook(() =>
        useWizardReducer(customInitialRecipe)
      );

      const expectedCustomInitialState = {
        profile: mockTargetProfile,
        parameters: {
          isValid: true,
          parametersRequired: true,
          parameters: { customParam: "customValue" },
        },
        advancedOptions: {
          isValid: true,
          renderTemplates: false,
        },
        isReady: true,
        results: null,
      };

      // Verify custom initial state
      expect(result.current.state).toEqual(expectedCustomInitialState);

      // Modify state
      act(() => {
        result.current.setParameters(mockInvalidParameters);
        result.current.setResults(mockResults);
      });

      // Verify state is modified
      expect(result.current.state.parameters).toEqual(mockInvalidParameters);
      expect(result.current.state.results).toEqual(mockResults);
      expect(result.current.state.isReady).toBe(false);

      // Reset
      act(() => {
        result.current.reset();
      });

      // Verify state is back to custom initial state
      expect(result.current.state).toEqual(expectedCustomInitialState);
    });

    it("maintains reference stability of reset function", () => {
      const { result, rerender } = renderHook(() => useWizardReducer());

      const initialReset = result.current.reset;

      // Trigger a rerender
      rerender();

      expect(result.current.reset).toBe(initialReset);
    });
  });

  describe("function reference stability", () => {
    it("maintains stable references for all setter functions", () => {
      const { result, rerender } = renderHook(() => useWizardReducer());

      const initialSetters = {
        setProfile: result.current.setProfile,
        setParameters: result.current.setParameters,
        setAdvancedOptions: result.current.setAdvancedOptions,
        setResults: result.current.setResults,
        reset: result.current.reset,
      };

      // Trigger state changes
      act(() => {
        result.current.setProfile(mockTargetProfile);
        result.current.setParameters(mockValidParameters);
      });

      // Rerender
      rerender();

      expect(result.current.setProfile).toBe(initialSetters.setProfile);
      expect(result.current.setParameters).toBe(initialSetters.setParameters);
      expect(result.current.setAdvancedOptions).toBe(
        initialSetters.setAdvancedOptions
      );
      expect(result.current.setResults).toBe(initialSetters.setResults);
      expect(result.current.reset).toBe(initialSetters.reset);
    });
  });

  describe("complex state combinations", () => {
    it("handles sequential state updates correctly", () => {
      const { result } = renderHook(() => useWizardReducer());

      // Set profile first
      act(() => {
        result.current.setProfile(mockTargetProfile);
      });

      expect(result.current.state.profile).toEqual(mockTargetProfile);
      expect(result.current.state.isReady).toBe(true); // Should be true because default params and advanced options are valid

      // Set invalid parameters
      act(() => {
        result.current.setParameters(mockInvalidParameters);
      });

      expect(result.current.state.parameters).toEqual(mockInvalidParameters);
      expect(result.current.state.isReady).toBe(false);

      // Set valid parameters
      act(() => {
        result.current.setParameters(mockValidParameters);
      });

      expect(result.current.state.parameters).toEqual(mockValidParameters);
      expect(result.current.state.isReady).toBe(true);

      // Set results
      act(() => {
        result.current.setResults(mockResults);
      });

      expect(result.current.state.results).toEqual(mockResults);
      expect(result.current.state.isReady).toBe(true); // Should still be true

      // Invalidate advanced options
      act(() => {
        result.current.setAdvancedOptions(mockInvalidAdvancedOptions);
      });

      expect(result.current.state.isReady).toBe(false);
      expect(result.current.state.results).toEqual(mockResults); // Results should persist
    });

    it("handles simultaneous state updates in single act", () => {
      const { result } = renderHook(() => useWizardReducer());

      act(() => {
        result.current.setProfile(mockTargetProfile);
        result.current.setParameters(mockValidParameters);
        result.current.setAdvancedOptions(mockValidAdvancedOptions);
        result.current.setResults(mockResults);
      });

      expect(result.current.state.profile).toEqual(mockTargetProfile);
      expect(result.current.state.parameters).toEqual(mockValidParameters);
      expect(result.current.state.advancedOptions).toEqual(
        mockValidAdvancedOptions
      );
      expect(result.current.state.results).toEqual(mockResults);
      expect(result.current.state.isReady).toBe(true);
    });

    it("correctly calculates isReady with default parameter values", () => {
      const { result } = renderHook(() => useWizardReducer());

      // Since default parameters.isValid is true and advancedOptions.isValid is true,
      // adding just a profile should make isReady true
      act(() => {
        result.current.setProfile(mockTargetProfile);
      });

      expect(result.current.state.isReady).toBe(true);
    });

    it("preserves parameters, advancedOptions, and results when changing profiles", () => {
      const { result } = renderHook(() => useWizardReducer());

      const secondProfile: TargetProfile = {
        ...mockTargetProfile,
        id: 2,
        name: "Second Target Profile",
        generators: [{ id: 4, name: "Generator 4" }],
      };

      act(() => {
        result.current.setProfile(mockTargetProfile);
        result.current.setParameters(mockValidParameters);
        result.current.setAdvancedOptions(mockValidAdvancedOptions);
        result.current.setResults(mockResults);
      });

      act(() => {
        result.current.setProfile(secondProfile);
      });

      expect(result.current.state.profile).toEqual(secondProfile);
      expect(result.current.state.parameters).toEqual(mockValidParameters);
      expect(result.current.state.advancedOptions).toEqual(
        mockValidAdvancedOptions
      );
      expect(result.current.state.results).toEqual(mockResults);
      expect(result.current.state.isReady).toBe(true);
    });

    it("handles parameters with parametersRequired set to false", () => {
      const { result } = renderHook(() => useWizardReducer());

      const optionalParameters: ParameterState = {
        isValid: true,
        parametersRequired: false,
        parameters: {},
      };

      act(() => {
        result.current.setProfile(mockTargetProfile);
        result.current.setParameters(optionalParameters);
      });

      expect(result.current.state.parameters).toEqual(optionalParameters);
      expect(result.current.state.isReady).toBe(true);
    });

    it("correctly handles invalid parameters when parametersRequired is false", () => {
      const { result } = renderHook(() => useWizardReducer());

      const optionalInvalidParameters: ParameterState = {
        isValid: false,
        parametersRequired: false,
        parameters: {},
      };

      act(() => {
        result.current.setProfile(mockTargetProfile);
        result.current.setParameters(optionalInvalidParameters);
      });

      expect(result.current.state.parameters).toEqual(
        optionalInvalidParameters
      );
      // isReady depends on isValid, not parametersRequired
      expect(result.current.state.isReady).toBe(false);
    });
  });

  describe("state immutability", () => {
    it("returns new state references on updates", () => {
      const { result } = renderHook(() => useWizardReducer());

      const initialState = result.current.state;

      act(() => {
        result.current.setProfile(mockTargetProfile);
      });

      expect(result.current.state).not.toBe(initialState);
    });

    it("maintains immutability across multiple updates", () => {
      const { result } = renderHook(() => useWizardReducer());

      const states: WizardState[] = [];

      states.push(result.current.state);

      act(() => {
        result.current.setProfile(mockTargetProfile);
      });
      states.push(result.current.state);

      act(() => {
        result.current.setParameters(mockValidParameters);
      });
      states.push(result.current.state);

      act(() => {
        result.current.setAdvancedOptions(mockValidAdvancedOptions);
      });
      states.push(result.current.state);

      act(() => {
        result.current.setResults(mockResults);
      });
      states.push(result.current.state);

      // Verify all states are different references
      const uniqueStates = new Set(states);
      expect(uniqueStates.size).toBe(states.length);
    });
  });

  describe("edge cases", () => {
    it("handles multiple consecutive resets", () => {
      const { result } = renderHook(() => useWizardReducer());

      const expectedInitialState: WizardState = {
        profile: undefined,
        parameters: {
          isValid: true,
          parametersRequired: false,
        },
        advancedOptions: {
          isValid: true,
          renderTemplates: true,
        },
        isReady: false,
        results: null,
      };

      // Modify state
      act(() => {
        result.current.setProfile(mockTargetProfile);
        result.current.setParameters(mockValidParameters);
        result.current.setAdvancedOptions(mockValidAdvancedOptions);
      });

      // Multiple resets
      act(() => {
        result.current.reset();
        result.current.reset();
        result.current.reset();
      });

      expect(result.current.state).toEqual(expectedInitialState);
    });

    it("handles reset between state updates", () => {
      const { result } = renderHook(() => useWizardReducer());

      act(() => {
        result.current.setProfile(mockTargetProfile);
        result.current.reset();
        result.current.setParameters(mockValidParameters);
      });

      expect(result.current.state.profile).toBeUndefined();
      expect(result.current.state.parameters).toEqual(mockValidParameters);
      expect(result.current.state.isReady).toBe(false);
    });

    it("verifies profile is undefined after reset", () => {
      const { result } = renderHook(() => useWizardReducer());

      // Set a profile
      act(() => {
        result.current.setProfile(mockTargetProfile);
      });

      expect(result.current.state.profile).toEqual(mockTargetProfile);

      // Reset to clear profile
      act(() => {
        result.current.reset();
      });

      expect(result.current.state.profile).toBeUndefined();
      expect(result.current.state.isReady).toBe(false);
    });
  });
});
