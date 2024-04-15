import "@testing-library/jest-dom";
import { useAssessmentStatus } from "@app/hooks/useAssessmentStatus";
import {
  createMockApplication,
  createMockArchetype,
  createMockAssessment,
  renderHook,
  waitFor,
} from "@app/test-config/test-utils";
import { rest } from "msw";
import { server } from "@mocks/server";
import { assessmentsQueryKey } from "@app/queries/assessments";
import { QueryClient } from "@tanstack/react-query";

describe("useAssessmentStatus", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  afterEach(() => {
    server.resetHandlers();
  });

  it("Updates hasApplicationAssessmentInProgress to false when assessment is marked as not required", async () => {
    server.use(
      rest.get("/hub/archetypes", (req, res, ctx) => {
        return res(
          ctx.json([
            createMockArchetype({
              id: 1,
              name: "archetype1",
              applications: [],
              assessed: false,
              assessments: [],
            }),
          ])
        );
      }),
      rest.get("/hub/assessments", (req, res, ctx) => {
        return res(
          ctx.json([
            createMockAssessment({
              id: 1,
              application: { id: 1, name: "app1" },
              questionnaire: { id: 1, name: "questionnaire1" },
              status: "started",
              required: true,
              sections: [],
            }),
            createMockAssessment({
              id: 2,
              application: { id: 1, name: "app1" },
              questionnaire: { id: 2, name: "questionnaire2" },
              status: "complete",
              required: true,
              sections: [],
            }),
          ])
        );
      })
    );

    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          cacheTime: 1000,
        },
      },
    });

    const { result, rerender } = renderHook(
      () => useAssessmentStatus(createMockApplication({ id: 1, name: "app1" })),
      { queryClient }
    );

    await waitFor(() => {
      expect(result.current.hasApplicationAssessmentInProgress).toBe(true);
    });

    server.use(
      rest.get("/hub/archetypes", (req, res, ctx) => {
        return res(
          ctx.json([
            createMockArchetype({
              id: 1,
              name: "archetype1",
              applications: [],
              assessed: false,
              assessments: [],
            }),
          ])
        );
      }),
      rest.get("/hub/assessments", (req, res, ctx) => {
        return res(
          ctx.json([
            createMockAssessment({
              id: 1,
              application: { id: 1, name: "app1" },
              questionnaire: { id: 1, name: "questionnaire1" },
              status: "started",
              required: false,
              sections: [],
            }),
            createMockAssessment({
              id: 2,
              application: { id: 1, name: "app1" },
              questionnaire: { id: 2, name: "questionnaire2" },
              status: "complete",
              required: false,
              sections: [],
            }),
          ])
        );
      })
    );

    queryClient.invalidateQueries([assessmentsQueryKey]);

    rerender(createMockApplication({ id: 1, name: "app1" }));

    await waitFor(() => {
      expect(result.current.hasApplicationAssessmentInProgress).toBe(false);
    });
  });

  it("Updates hasApplicationAssessmentInProgress to false once associated assessments are deleted", async () => {
    server.use(
      rest.get("/hub/assessments", (req, res, ctx) => {
        return res(
          ctx.json([
            createMockAssessment({
              id: 1,
              application: { id: 1, name: "app1" },
              questionnaire: { id: 1, name: "questionnaire1" },
              status: "started",
              sections: [],
            }),
            createMockAssessment({
              id: 2,
              application: { id: 1, name: "app1" },
              questionnaire: { id: 2, name: "questionnaire2" },
              status: "complete",
              sections: [],
            }),
          ])
        );
      }),
      rest.get("/hub/archetypes", (req, res, ctx) => {
        return res(
          ctx.json([
            createMockArchetype({
              id: 1,
              name: "archetype1",
              applications: [],
              assessed: false,
              assessments: [],
            }),
          ])
        );
      })
    );
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          cacheTime: 1000,
        },
      },
    });
    const { result, rerender } = renderHook(
      () => useAssessmentStatus(createMockApplication({ id: 1, name: "app1" })),
      { queryClient }
    );

    await waitFor(() => {
      expect(result.current.hasApplicationAssessmentInProgress).toBe(true);
    });

    server.use(
      rest.get("/hub/assessments", (req, res, ctx) => {
        return res(ctx.json([]));
      })
    );
    queryClient.invalidateQueries([assessmentsQueryKey]);

    rerender(createMockApplication({ id: 1, name: "app1" }));

    await waitFor(() => {
      expect(result.current.hasApplicationAssessmentInProgress).toBe(false);
    });
  });

  it("Correctly calculates status given one started assessment and one complete assessment for an application", async () => {
    server.use(
      rest.get("/hub/assessments", (req, res, ctx) => {
        return res(
          ctx.json([
            createMockAssessment({
              id: 1,
              application: { id: 1, name: "app1" },
              questionnaire: { id: 1, name: "questionnaire1" },
              status: "started",
              sections: [],
            }),
            createMockAssessment({
              id: 2,
              application: { id: 1, name: "app1" },
              questionnaire: { id: 2, name: "questionnaire2" },
              status: "complete",
              sections: [],
            }),
          ])
        );
      }),

      rest.get("/hub/archetypes", (req, res, ctx) => {
        return res(
          ctx.json([
            createMockArchetype({
              id: 1,
              name: "archetype1",
              applications: [{ id: 1, name: "app1" }],
              assessed: false,
              assessments: [],
            }),
          ])
        );
      })
    );

    const { result } = renderHook(() =>
      useAssessmentStatus(createMockApplication({ id: 1, name: "app1" }))
    );
    await waitFor(() => {
      expect(result.current).toEqual({
        allArchetypesAssessed: false,
        countOfFullyAssessedArchetypes: 0,
        countOfArchetypesWithRequiredAssessments: 0,
        hasApplicationAssessmentInProgress: true,
        isApplicationDirectlyAssessed: false,
      });
    });
  });

  it("Correctly calculates status given two complete assessments for an application", async () => {
    const mockAssessments = [
      createMockAssessment({
        id: 1,
        application: { id: 1, name: "app1" },
        questionnaire: { id: 1, name: "questionnaire1" },
        status: "complete",
        sections: [],
      }),
      createMockAssessment({
        id: 2,
        application: { id: 1, name: "app1" },
        questionnaire: { id: 2, name: "questionnaire2" },
        status: "complete",
        sections: [],
      }),
    ];
    server.use(
      rest.get("/hub/assessments", (req, res, ctx) => {
        return res(ctx.json(mockAssessments));
      })
    );
    server.use(
      rest.get("/hub/archetypes", (req, res, ctx) => {
        return res(ctx.json([]));
      })
    );

    const mockApplication = createMockApplication({
      id: 1,
      name: "app1",
      assessed: true,
      assessments: mockAssessments,
    });

    const { result } = renderHook(() => useAssessmentStatus(mockApplication));

    await waitFor(() => {
      expect(result.current).toEqual({
        allArchetypesAssessed: false,
        countOfFullyAssessedArchetypes: 0,
        countOfArchetypesWithRequiredAssessments: 0,
        hasApplicationAssessmentInProgress: true,
        isApplicationDirectlyAssessed: true,
      });
    });
  });

  it("Correctly calculates status given two inherited archetype; One with a complete state and one with started state.", async () => {
    const arch1Assessments = [
      createMockAssessment({
        id: 1,
        archetype: { id: 1, name: "archetype1" },
        questionnaire: { id: 1, name: "questionnaire1" },
        status: "complete",
        sections: [],
      }),
    ];
    const arch2Assessments = [
      createMockAssessment({
        id: 2,
        archetype: { id: 2, name: "archetype2" },
        questionnaire: { id: 1, name: "questionnaire1" },
        status: "started",
        sections: [],
      }),
    ];
    const mockAssessments = [...arch1Assessments, ...arch2Assessments];
    const mockArchetypes = [
      createMockArchetype({
        id: 1,
        name: "archetype1",
        applications: [{ id: 1, name: "app1" }],
        assessments: arch1Assessments,
        assessed: true,
      }),
      createMockArchetype({
        id: 2,
        name: "archetype2",
        applications: [{ id: 1, name: "app1" }],
        assessments: arch2Assessments,
        assessed: false,
      }),
    ];
    server.use(
      rest.get("/hub/assessments", (req, res, ctx) => {
        return res(ctx.json(mockAssessments));
      }),

      rest.get("/hub/archetypes", (req, res, ctx) => {
        return res(ctx.json(mockArchetypes));
      })
    );
    const mockApplication = createMockApplication({
      id: 1,
      name: "app1",
      archetypes: [
        { id: 1, name: "archetype1" },
        { id: 2, name: "archetype2" },
      ],
      assessed: false,
    });
    const { result } = renderHook(() => useAssessmentStatus(mockApplication));
    await waitFor(() => {
      expect(result.current).toEqual({
        allArchetypesAssessed: false,
        countOfFullyAssessedArchetypes: 1,
        countOfArchetypesWithRequiredAssessments: 2,
        hasApplicationAssessmentInProgress: false,
        isApplicationDirectlyAssessed: false,
      });
    });
  });

  it("Correctly calculates status given a single inherited archetype with a complete state.", async () => {
    const mockAssessments = [
      createMockAssessment({
        id: 1,
        archetype: { id: 1, name: "archetype1" },
        questionnaire: { id: 1, name: "questionnaire1" },
        status: "complete",
        sections: [],
      }),
    ];

    const mockArchetypes = [
      createMockArchetype({
        id: 1,
        name: "archetype1",
        applications: [{ id: 1, name: "app1" }],
        assessments: mockAssessments,
        assessed: true,
      }),
    ];

    const mockApplication = createMockApplication({
      id: 1,
      name: "app1",
      archetypes: [{ id: 1, name: "archetype1" }],
      assessed: false,
    });

    server.use(
      rest.get("/hub/assessments", (req, res, ctx) => {
        return res(ctx.json(mockAssessments));
      }),

      rest.get("/hub/archetypes", (req, res, ctx) => {
        return res(ctx.json(mockArchetypes));
      })
    );

    const { result } = renderHook(() => useAssessmentStatus(mockApplication));
    await waitFor(() => {
      expect(result.current).toEqual({
        allArchetypesAssessed: true,
        countOfFullyAssessedArchetypes: 1,
        countOfArchetypesWithRequiredAssessments: 1,
        hasApplicationAssessmentInProgress: false,
        isApplicationDirectlyAssessed: false,
      });
    });
  });

  it("Correctly calculates status given 1 started assessment for an applications only archetype.", async () => {
    const mockAssessments = [
      createMockAssessment({
        id: 1,
        archetype: { id: 1, name: "archetype1" },
        questionnaire: { id: 1, name: "questionnaire1" },
        status: "started",
        sections: [],
      }),
    ];

    const mockArchetypes = [
      createMockArchetype({
        id: 1,
        name: "archetype1",
        applications: [{ id: 1, name: "app1" }],
        assessments: [...mockAssessments],
      }),
    ];

    const mockApplication = createMockApplication({
      id: 1,
      name: "app1",
      archetypes: [{ id: 1, name: "archetype1" }],
      assessed: false,
    });
    server.use(
      rest.get("/hub/assessments", (req, res, ctx) => {
        return res(ctx.json(mockAssessments));
      }),

      rest.get("/hub/archetypes", (req, res, ctx) => {
        return res(ctx.json(mockArchetypes));
      })
    );

    const { result } = renderHook(() => useAssessmentStatus(mockApplication));
    await waitFor(() => {
      expect(result.current).toEqual({
        allArchetypesAssessed: false,
        countOfFullyAssessedArchetypes: 0,
        countOfArchetypesWithRequiredAssessments: 1,
        hasApplicationAssessmentInProgress: false,
        isApplicationDirectlyAssessed: false,
      });
    });
  });
  it("Correctly calculates status given one complete assessment for an application's inherited archetype with no direct assessment", async () => {
    const mockAssessments = [
      createMockAssessment({
        id: 1,
        archetype: { id: 1, name: "archetype1" },
        questionnaire: { id: 1, name: "questionnaire1" },
        status: "complete",
        sections: [],
      }),
    ];

    const mockArchetypes = [
      createMockArchetype({
        id: 1,
        name: "archetype1",
        applications: [{ id: 1, name: "app1" }],
        assessments: mockAssessments,
        assessed: true,
      }),
    ];

    const mockApplication = createMockApplication({
      id: 1,
      name: "app1",
      archetypes: [{ id: 1, name: "archetype1" }],
      assessed: false,
    });

    server.use(
      rest.get("/hub/assessments", (req, res, ctx) => {
        return res(ctx.json(mockAssessments));
      }),

      rest.get("/hub/archetypes", (req, res, ctx) => {
        return res(ctx.json(mockArchetypes));
      })
    );

    const { result } = renderHook(() => useAssessmentStatus(mockApplication));
    await waitFor(() => {
      expect(result.current).toEqual({
        allArchetypesAssessed: true,
        countOfFullyAssessedArchetypes: 1,
        countOfArchetypesWithRequiredAssessments: 1,
        hasApplicationAssessmentInProgress: false,
        isApplicationDirectlyAssessed: false,
      });
    });
  });

  it("Correctly calculates status given one complete assessment for an application's inherited archetype with a direct assessment", async () => {
    const archetypeAssessments = [
      createMockAssessment({
        id: 1,
        archetype: { id: 1, name: "archetype1" },
        questionnaire: { id: 1, name: "questionnaire1" },
        status: "complete",
        sections: [],
      }),
    ];

    const mockArchetypes = [
      createMockArchetype({
        id: 1,
        name: "archetype1",
        applications: [{ id: 1, name: "app1" }],
        assessments: archetypeAssessments,
        assessed: true,
      }),
    ];
    const applicationAssessments = [
      createMockAssessment({
        id: 2,
        application: { id: 1, name: "app1" },
        questionnaire: { id: 2, name: "questionnaire2" },
        status: "complete",
        sections: [],
      }),
    ];

    const mockApplication = createMockApplication({
      id: 1,
      name: "app1",
      archetypes: [{ id: 1, name: "archetype1" }],
      assessed: true,
      assessments: applicationAssessments,
    });

    const mockAssessments = [
      ...archetypeAssessments,
      ...applicationAssessments,
    ];
    server.use(
      rest.get("/hub/assessments", (req, res, ctx) => {
        return res(ctx.json(mockAssessments));
      }),

      rest.get("/hub/archetypes", (req, res, ctx) => {
        return res(ctx.json(mockArchetypes));
      })
    );

    const { result } = renderHook(() => useAssessmentStatus(mockApplication));

    await waitFor(() => {
      expect(result.current).toEqual({
        allArchetypesAssessed: true,
        countOfFullyAssessedArchetypes: 1,
        countOfArchetypesWithRequiredAssessments: 1,
        hasApplicationAssessmentInProgress: true,
        isApplicationDirectlyAssessed: true,
      });
    });
  });
});
