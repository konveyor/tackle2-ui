import { useMutation, useQuery, useQueryClient } from "react-query";
import { Wave } from "@app/api/models";
import { AxiosError } from "axios";

// TODO: Implement delete api

let deleteWave: any;

export interface IWaveFetchState {
  waves: Wave[];
  isFetching: boolean;
  fetchError: any;
  refetch: any;
}

export const WavesQueryKey = "stakeholders";

export const useFetchWaves = (): IWaveFetchState => {
  const { data, isLoading, error, refetch } = useQuery(
    WavesQueryKey,
    async () => [],
    // async () => (await getWaves()).data,
    {
      onError: (error) => console.log("error, ", error),
    }
  );
  return {
    waves: data || [],
    isFetching: isLoading,
    fetchError: error,
    refetch,
  };
};

export const useDeleteWaveMutation = (
  onSuccess: (res: any) => void,
  onError: (err: AxiosError) => void
) => {
  const queryClient = useQueryClient();

  const { isLoading, mutate, error } = useMutation(deleteWave, {
    onSuccess: (res) => {
      onSuccess(res);
      queryClient.invalidateQueries(WavesQueryKey);
    },
    onError: (err: AxiosError) => {
      onError(err);
      queryClient.invalidateQueries(WavesQueryKey);
    },
  });
  return {
    mutate,
    isLoading,
    error,
  };
};
