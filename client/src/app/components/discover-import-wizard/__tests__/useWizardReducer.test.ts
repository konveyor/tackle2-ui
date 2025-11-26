import { act, renderHook } from "@testing-library/react";

import { PlatformApplicationImportTask, SourcePlatform } from "@app/api/models";

import { FilterState } from "../filter-input";
import { ResultsData } from "../results";
import {
  InitialStateRecipe,
  WizardState,
  useWizardReducer,
} from "../useWizardReducer";

// Mock data for testing
const mockPlatform: SourcePlatform = {
  id: 1,
  kind: "cloudfoundry",
  name: "Test Platform",
  url: "https://example.com",
  identity: { id: 1, name: "Test Identity" },
  applications: [],
  coordinates: {},
};

const mockValidFilters: FilterState = {
  filterRequired: true,
  isValid: true,
  schema: {
    name: "test-schema",
    definition: { type: "object" },
  },
  document: { testField: "testValue" },
};

const mockInvalidFilters: FilterState = {
  filterRequired: true,
  isValid: false,
};

const mockResults: ResultsData = {
  success: [
    {
      task: {
        id: 1,
        kind: "application-import",
        platform: { id: 1, name: "Test Platform" },
        filter: { testField: "testValue" },
      } as PlatformApplicationImportTask,
      platform: mockPlatform,
    },
  ],
  failure: [],
};

describe("useWizardReducer", () => {
  it("initializes with default state", () => {
    const { result } = renderHook(() => useWizardReducer());

    const expectedInitialState: WizardState = {
      platform: null,
      filters: {
        filterRequired: true,
        isValid: false,
      },
      isReady: false,
      results: null,
    };

    expect(result.current.state).toEqual(expectedInitialState);
  });

  it("initializes with custom initial state recipe", () => {
    const customInitialRecipe: InitialStateRecipe = (draft) => {
      draft.platform = mockPlatform;
      draft.filters = mockValidFilters;
    };

    const { result } = renderHook(() => useWizardReducer(customInitialRecipe));

    expect(result.current.state.platform).toEqual(mockPlatform);
    expect(result.current.state.filters).toEqual(mockValidFilters);
    expect(result.current.state.isReady).toBe(true); // Should be true since platform and valid filters are set
  });

  describe("setPlatform", () => {
    it("sets platform and updates isReady state correctly", () => {
      const { result } = renderHook(() => useWizardReducer());

      act(() => {
        result.current.setPlatform(mockPlatform);
      });

      expect(result.current.state.platform).toEqual(mockPlatform);
      expect(result.current.state.isReady).toBe(false); // Still false because filters are invalid
    });

    it("sets platform to null", () => {
      const { result } = renderHook(() => useWizardReducer());

      // First set a platform
      act(() => {
        result.current.setPlatform(mockPlatform);
      });

      // Then set it to null
      act(() => {
        result.current.setPlatform(null);
      });

      expect(result.current.state.platform).toBeNull();
      expect(result.current.state.isReady).toBe(false);
    });
  });

  describe("setFilters", () => {
    it("sets valid filters and updates isReady state", () => {
      const { result } = renderHook(() => useWizardReducer());

      act(() => {
        result.current.setFilters(mockValidFilters);
      });

      expect(result.current.state.filters).toEqual(mockValidFilters);
      expect(result.current.state.isReady).toBe(false); // Still false because no platform is set
    });

    it("sets invalid filters", () => {
      const { result } = renderHook(() => useWizardReducer());

      act(() => {
        result.current.setFilters(mockInvalidFilters);
      });

      expect(result.current.state.filters).toEqual(mockInvalidFilters);
      expect(result.current.state.isReady).toBe(false);
    });

    it("updates existing filters", () => {
      const { result } = renderHook(() => useWizardReducer());

      // Set initial filters
      act(() => {
        result.current.setFilters(mockInvalidFilters);
      });

      // Update to valid filters
      act(() => {
        result.current.setFilters(mockValidFilters);
      });

      expect(result.current.state.filters).toEqual(mockValidFilters);
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
    it("sets isReady to true when both platform and valid filters are set", () => {
      const { result } = renderHook(() => useWizardReducer());

      act(() => {
        result.current.setPlatform(mockPlatform);
        result.current.setFilters(mockValidFilters);
      });

      expect(result.current.state.isReady).toBe(true);
    });

    it("keeps isReady false when platform is set but filters are invalid", () => {
      const { result } = renderHook(() => useWizardReducer());

      act(() => {
        result.current.setPlatform(mockPlatform);
        result.current.setFilters(mockInvalidFilters);
      });

      expect(result.current.state.isReady).toBe(false);
    });

    it("keeps isReady false when filters are valid but no platform is set", () => {
      const { result } = renderHook(() => useWizardReducer());

      act(() => {
        result.current.setFilters(mockValidFilters);
      });

      expect(result.current.state.isReady).toBe(false);
    });

    it("sets isReady to false when platform is removed", () => {
      const { result } = renderHook(() => useWizardReducer());

      // Set both platform and valid filters
      act(() => {
        result.current.setPlatform(mockPlatform);
        result.current.setFilters(mockValidFilters);
      });

      expect(result.current.state.isReady).toBe(true);

      // Remove platform
      act(() => {
        result.current.setPlatform(null);
      });

      expect(result.current.state.isReady).toBe(false);
    });

    it("sets isReady to false when filters become invalid", () => {
      const { result } = renderHook(() => useWizardReducer());

      // Set both platform and valid filters
      act(() => {
        result.current.setPlatform(mockPlatform);
        result.current.setFilters(mockValidFilters);
      });

      expect(result.current.state.isReady).toBe(true);

      // Set invalid filters
      act(() => {
        result.current.setFilters(mockInvalidFilters);
      });

      expect(result.current.state.isReady).toBe(false);
    });
  });

  describe("reset functionality", () => {
    it("resets to initial default state", () => {
      const { result } = renderHook(() => useWizardReducer());

      // Modify state
      act(() => {
        result.current.setPlatform(mockPlatform);
        result.current.setFilters(mockValidFilters);
        result.current.setResults(mockResults);
      });

      // Verify state is modified
      expect(result.current.state.platform).toEqual(mockPlatform);
      expect(result.current.state.filters).toEqual(mockValidFilters);
      expect(result.current.state.results).toEqual(mockResults);
      expect(result.current.state.isReady).toBe(true);

      // Reset
      act(() => {
        result.current.reset();
      });

      // Verify state is back to initial
      const expectedInitialState: WizardState = {
        platform: null,
        filters: {
          filterRequired: true,
          isValid: false,
        },
        isReady: false,
        results: null,
      };

      expect(result.current.state).toEqual(expectedInitialState);
    });

    it("resets to custom initial state when initialized with recipe", () => {
      const customInitialRecipe: InitialStateRecipe = (draft) => {
        draft.platform = mockPlatform;
        draft.filters = {
          filterRequired: false,
          isValid: true,
        };
      };

      const { result } = renderHook(() =>
        useWizardReducer(customInitialRecipe)
      );

      const expectedCustomInitialState = {
        platform: mockPlatform,
        filters: {
          filterRequired: false,
          isValid: true,
        },
        isReady: true,
        results: null,
      };

      // Verify custom initial state
      expect(result.current.state).toEqual(expectedCustomInitialState);

      // Modify state
      act(() => {
        result.current.setPlatform(null);
        result.current.setResults(mockResults);
      });

      // Verify state is modified
      expect(result.current.state.platform).toBeNull();
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
        setPlatform: result.current.setPlatform,
        setFilters: result.current.setFilters,
        setResults: result.current.setResults,
        reset: result.current.reset,
      };

      // Trigger state changes
      act(() => {
        result.current.setPlatform(mockPlatform);
        result.current.setFilters(mockValidFilters);
      });

      // Rerender
      rerender();

      expect(result.current.setPlatform).toBe(initialSetters.setPlatform);
      expect(result.current.setFilters).toBe(initialSetters.setFilters);
      expect(result.current.setResults).toBe(initialSetters.setResults);
      expect(result.current.reset).toBe(initialSetters.reset);
    });
  });

  describe("complex state combinations", () => {
    it("handles sequential state updates correctly", () => {
      const { result } = renderHook(() => useWizardReducer());

      // Set platform first
      act(() => {
        result.current.setPlatform(mockPlatform);
      });

      expect(result.current.state.platform).toEqual(mockPlatform);
      expect(result.current.state.isReady).toBe(false);

      // Set valid filters
      act(() => {
        result.current.setFilters(mockValidFilters);
      });

      expect(result.current.state.filters).toEqual(mockValidFilters);
      expect(result.current.state.isReady).toBe(true);

      // Set results
      act(() => {
        result.current.setResults(mockResults);
      });

      expect(result.current.state.results).toEqual(mockResults);
      expect(result.current.state.isReady).toBe(true); // Should still be true

      // Invalidate filters
      act(() => {
        result.current.setFilters(mockInvalidFilters);
      });

      expect(result.current.state.isReady).toBe(false);
      expect(result.current.state.results).toEqual(mockResults); // Results should persist
    });

    it("handles simultaneous state updates in single act", () => {
      const { result } = renderHook(() => useWizardReducer());

      act(() => {
        result.current.setPlatform(mockPlatform);
        result.current.setFilters(mockValidFilters);
        result.current.setResults(mockResults);
      });

      expect(result.current.state.platform).toEqual(mockPlatform);
      expect(result.current.state.filters).toEqual(mockValidFilters);
      expect(result.current.state.results).toEqual(mockResults);
      expect(result.current.state.isReady).toBe(true);
    });
  });
});
