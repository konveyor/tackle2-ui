import { useQuery } from "@tanstack/react-query";
import { AssessmentRisk } from "@app/api/models";

export const RisksQueryKey = "risks";

export const useFetchRisks = (applicationIDs: number[]) => {
  const { data, refetch, isFetching, error } = useQuery<AssessmentRisk[]>(
    ["assessmentrisks", applicationIDs],
    async () => {
      if (applicationIDs.length > 0)
        // return (await getAssessmentLandscape(applicationIDs)).data;
        //TODO see if we still need this
        return [];
      else return [];
    },
    {
      onError: (error) => console.log("error, ", error),
    }
  );
  return {
    risks: data || [],
    isFetching,
    error,
    refetch,
  };
};
