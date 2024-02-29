import { useMemo } from "react";
import {
  useMutation,
  useQueries,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import {
  createAssessment,
  deleteAssessment,
  getArchetypeById,
  getAssessmentById,
  getAssessments,
  getAssessmentsByItemId,
  updateAssessment,
} from "@app/api/rest";
import { AxiosError } from "axios";
import {
  Assessment,
  AssessmentWithSectionOrder,
  InitialAssessment,
} from "@app/api/models";
import { QuestionnairesQueryKey } from "./questionnaires";
import { ARCHETYPE_QUERY_KEY } from "./archetypes";

export const assessmentsQueryKey = "assessments";
export const assessmentQueryKey = "assessment";
export const assessmentsByItemIdQueryKey = "assessmentsByItemId";

export const useFetchAssessments = () => {
  const { isLoading, data, error } = useQuery({
    queryKey: [assessmentsQueryKey],
    queryFn: getAssessments,
    onError: (error: AxiosError) => console.log("error, ", error),
  });
  const assessmentsWithOrder: AssessmentWithSectionOrder[] = useMemo(
    () => data?.map(addSectionOrderToQuestions) || [],
    [data]
  );

  return {
    assessments: assessmentsWithOrder || [],
    isFetching: isLoading,
    fetchError: error,
  };
};

export const useCreateAssessmentMutation = (
  isArchetype: boolean,
  onSuccess: (name: string) => void,
  onError: (err: AxiosError) => void
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (assessment: InitialAssessment) =>
      createAssessment(assessment, isArchetype),
    onSuccess: (res) => {
      const isArchetype = !!res?.archetype?.id;
      queryClient.invalidateQueries([
        assessmentsByItemIdQueryKey,
        res?.application?.id,
        isArchetype,
      ]);
      queryClient.invalidateQueries([
        assessmentsByItemIdQueryKey,
        res?.archetype?.id,
        isArchetype,
      ]);
    },
    onError: onError,
  });
};

export const useUpdateAssessmentMutation = (
  onSuccess?: (name: string) => void,
  onError?: (err: AxiosError) => void
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (assessmentWithOrder: AssessmentWithSectionOrder) => {
      const assessment = removeSectionOrderFromQuestions(assessmentWithOrder);
      return updateAssessment(assessment);
    },
    onSuccess: (_, args) => {
      onSuccess && onSuccess(args.name);
      const isArchetype = !!args.archetype?.id;

      queryClient.invalidateQueries([QuestionnairesQueryKey]);

      queryClient.invalidateQueries([
        assessmentsByItemIdQueryKey,
        args.application?.id,
        isArchetype,
      ]);
      queryClient.invalidateQueries([
        assessmentsByItemIdQueryKey,
        args.archetype?.id,
        isArchetype,
      ]);
    },
    onError: onError,
  });
};

export const useDeleteAssessmentMutation = (
  onSuccess?: (name: string) => void,
  onError?: (err: AxiosError) => void
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (args: {
      assessmentId: number;
      applicationName?: string;
      applicationId?: number;
      archetypeName?: string;
      archetypeId?: number;
    }) => {
      const deletedAssessment = deleteAssessment(args.assessmentId);
      const isArchetype = !!args.archetypeId;

      queryClient.invalidateQueries([assessmentQueryKey, args?.assessmentId]);
      queryClient.invalidateQueries([ARCHETYPE_QUERY_KEY, args?.archetypeId]);
      queryClient.invalidateQueries([
        assessmentsByItemIdQueryKey,
        args?.archetypeId,
        isArchetype,
      ]);
      queryClient.invalidateQueries([
        assessmentsByItemIdQueryKey,
        args?.applicationId,
        isArchetype,
      ]);

      return deletedAssessment;
    },
    onSuccess: (_, args) => {
      onSuccess &&
        onSuccess(args?.applicationName || args?.archetypeName || "Unknown");
    },
    onError: onError,
  });
};

export const useFetchAssessmentById = (id?: number | string) => {
  const { data, isLoading, error, isFetching } = useQuery({
    queryKey: [assessmentQueryKey, id],
    queryFn: () => (id ? getAssessmentById(id) : undefined),
    onError: (error: AxiosError) => console.log("error, ", error),
    enabled: !!id,
    refetchOnWindowFocus: false,
  });
  return {
    assessment: data,
    isFetching: isLoading || isFetching,
    fetchError: error,
  };
};

export const useFetchAssessmentsByItemId = (
  isArchetype: boolean,
  itemId?: number | string
) => {
  const { data, isLoading, error } = useQuery({
    queryKey: [assessmentsByItemIdQueryKey, itemId, isArchetype],
    queryFn: () => getAssessmentsByItemId(isArchetype, itemId),
    onError: (error: AxiosError) => console.log("error, ", error),
    onSuccess: (_data) => {},
    enabled: !!itemId,
  });

  const queryClient = useQueryClient();

  const invalidateAssessmentsQuery = () => {
    queryClient.invalidateQueries([
      assessmentsByItemIdQueryKey,
      itemId,
      isArchetype,
    ]);
  };
  const assessmentsWithOrder: AssessmentWithSectionOrder[] =
    data?.map(addSectionOrderToQuestions) || [];
  return {
    assessments: assessmentsWithOrder,
    isFetching: isLoading,
    fetchError: error,
    invalidateAssessmentsQuery,
  };
};

export const addSectionOrderToQuestions = (
  assessment: Assessment
): AssessmentWithSectionOrder => {
  return {
    ...assessment,
    sections: assessment.sections.map((section) => ({
      ...section,
      questions: section.questions.map((question) => ({
        ...question,
        sectionOrder: section.order,
      })),
    })),
  };
};

const removeSectionOrderFromQuestions = (
  assessmentWithOrder: AssessmentWithSectionOrder
): Assessment => {
  return {
    ...assessmentWithOrder,
    sections: assessmentWithOrder.sections.map((section) => ({
      ...section,
      questions: section.questions.map(({ sectionOrder, ...rest }) => rest),
    })),
  };
};

export const useFetchAssessmentsWithArchetypeApplications = () => {
  const { assessments, isFetching: assessmentsLoading } = useFetchAssessments();

  const archetypeQueries = useMemo(() => {
    const uniqueArchetypeIds = new Set(
      assessments.map((assessment) => assessment?.archetype?.id).filter(Boolean)
    );
    return Array.from(uniqueArchetypeIds).map((archetypeId) => ({
      queryKey: ["archetype", archetypeId],
      queryFn: async () => {
        const data = await getArchetypeById(archetypeId);
        return { archetypeId, applications: data.applications };
      },
    }));
  }, [assessments]);

  const archetypesUsedInAnAssessmentQueries = useQueries({
    queries: archetypeQueries,
  });

  const isArchetypesLoading = archetypesUsedInAnAssessmentQueries.some(
    (query) => query.isLoading
  );

  const archetypeApplicationsMap = new Map();
  archetypesUsedInAnAssessmentQueries.forEach(({ data }) => {
    if (data) {
      archetypeApplicationsMap.set(data.archetypeId, data.applications);
    }
  });

  const assessmentsWithArchetypeApplications = assessments.map(
    (assessment) => ({
      ...assessment,
      archetypeApplications:
        archetypeApplicationsMap.get(assessment?.archetype?.id) ?? [],
    })
  );

  return {
    assessmentsWithArchetypeApplications,
    isLoading: assessmentsLoading || isArchetypesLoading,
  };
};
