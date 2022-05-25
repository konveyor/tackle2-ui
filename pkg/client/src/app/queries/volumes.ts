import { useMutation, useQuery } from "react-query";

import { cleanRepository, getTaskById, getVolumes } from "@app/api/rest";
import { Volume } from "@app/api/models";

export interface IVolumeFetchState {
  volumes: Volume[];
  isFetching: boolean;
  fetchError: any;
  refetch: any;
}

export interface ICleanRepositoryMutateState {
  mutate: any;
  isLoading: boolean;
  error: any;
}

export const VolumesQueryKey = "volumes";
export const CleanProgressQueryKey = "cleanProgress";

export const useFetchVolumes = (): IVolumeFetchState => {
  const { data, isLoading, error, refetch } = useQuery(
    VolumesQueryKey,
    async () => (await getVolumes()).data,
    {
      onError: (error) => console.log("error, ", error),
    }
  );
  return {
    volumes: data || [],
    isFetching: isLoading,
    fetchError: error,
    refetch,
  };
};

export const useCleanRepositoryMutation = ({ onSuccess, onError }) => {
  // Mutation to kick off the clean task
  const {
    data: mutationResult,
    mutate,
    isLoading: isProcessIdLoading,
    reset,
  } = useMutation(cleanRepository, {
    onError: (error) => {
      console.error(error);
      onError();
    },
    onSuccess: (res) => {},
  });

  const processId = mutationResult?.data.id || null;

  //Fetch until clean task is complete
  const { data } = useQuery([CleanProgressQueryKey, processId], getTaskById, {
    onSuccess: (res) => {
      if (res?.data.state === "Succeeded") {
        reset();
        onSuccess();
      } else if (res?.data.state === "Failed") {
        reset();
        onError();
      }
    },
    onError: (error) => {
      console.error(error);
      reset();
      onError();
    },
    enabled: processId !== null,
    refetchInterval: isProcessIdLoading ? false : 5000,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: false,
  });

  return {
    mutate,
    data,
    isCleaning: isProcessIdLoading || !!processId,
  };
};
