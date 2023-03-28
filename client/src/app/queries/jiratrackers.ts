import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { JiraTracker } from "@app/api/models";
import { AxiosError } from "axios";
import { getJiraTrackers } from "@app/api/rest";

//TODO: Integrate api
let deleteWave: any;

export const JiraTrackersQueryKey = "jiratrackers";

export const useFetchJiraTrackers = () => {
  const { data, isLoading, error, refetch } = useQuery<JiraTracker[]>(
    [JiraTrackersQueryKey],
    async () => await getJiraTrackers(),
    {
      onError: (error) => console.log("error, ", error),
    }
  );
  return {
    jiraTrackers: data || [],
    isFetching: isLoading,
    fetchError: error,
    refetch,
  };
};

// export const useDeleteJiraTrackerMutation = (
//   onSuccess: (res: any) => void,
//   onError: (err: AxiosError) => void
// ) => {
//   const queryClient = useQueryClient();

//   const { isLoading, mutate, error } = useMutation(deleteJiraTracker, {
//     onSuccess: (res) => {
//       onSuccess(res);
//       queryClient.invalidateQueries([JiraTrackersQueryKey]);
//     },
//     onError: (err: AxiosError) => {
//       onError(err);
//     },
//   });
//   return {
//     mutate,
//     isLoading,
//     error,
//   };
// };
