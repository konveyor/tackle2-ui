import { useQuery } from "react-query";
import { AssessmentRisk } from "@app/api/models";
import { getAssessmentLandscape } from "@app/api/rest";

export const RisksQueryKey = "risks";

export const useFetchRisks = (applicationIDs: number[]) => {
  const { data, refetch, isFetching, error } = useQuery<AssessmentRisk[]>(
    ["assessmentrisks", applicationIDs],
    async () => {
      return (await getAssessmentLandscape(applicationIDs)).data;
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
