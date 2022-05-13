import React, { useState } from "react";
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
  const [volumes, setVolumes] = React.useState<Volume[]>([]);
  const { isLoading, error, refetch } = useQuery(VolumesQueryKey, () =>
    getVolumes()
      .then(({ data }) => {
        setVolumes(data);
        return data;
      })
      .catch((error) => {
        console.log("error, ", error);
        return error;
      })
  );
  return {
    volumes,
    isFetching: isLoading,
    fetchError: error,
    refetch,
  };
};

export const useCleanRepositoryMutation = ({ onSuccess, onError }) => {
  const [processId, setProcessId] = useState(null);
  const [stop, setStop] = useState(false);

  // Mutation to kick off the clean task
  const { mutate } = useMutation(cleanRepository, {
    onMutate: () => {
      setStop(false);
    },
    onError: (error) => {
      console.error(error);
      setStop(true);
      onError();
    },
    onSuccess: (res) => {
      setProcessId(res.data.id);
    },
  });

  //Fetch until clean task is complete
  const { isLoading, data } = useQuery(
    [CleanProgressQueryKey, processId],
    getTaskById,
    {
      onSuccess: (res) => {
        if (res?.data.state === "Succeeded") {
          setStop(true);
          setProcessId(null);
          onSuccess();
        } else if (res?.data.state === "Failed") {
          setStop(true);
          setProcessId(null);
          onError();
        }
      },
      onError: (error) => {
        console.error(error);
        setStop(true);
        setProcessId(null);
        onError();
      },
      enabled: processId != null,
      refetchInterval: stop ? false : 5000,
      refetchIntervalInBackground: true,
      refetchOnWindowFocus: false,
    }
  );

  return { mutate, data, isLoading };
};
