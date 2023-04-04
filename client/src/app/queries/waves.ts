import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Wave } from "@app/api/models";
import { AxiosError } from "axios";

//TODO: Integrate api
let deleteWave: any;

export const WavesQueryKey = "stakeholders";

export const useFetchWaves = () => {
  const { data, isLoading, error, refetch } = useQuery<Wave[]>(
    [WavesQueryKey],
    async () => [],
    //TODO: Integrate api
    // async () => (await getWaves()).data,
    {
      onError: (error) => console.log("error, ", error),
    }
  );
  return {
    waves: [
      {
        name: "wave1",
        id: 0,
        startDate: "2018-02-03 22:15:01",
        endDate: "2020-01-03 22:15:014",
        applications: [{ name: "app1" }, { name: "app2" }],
        stakeholders: [{ name: "sh1", email: "aaakwd@aol.com" }],
        status: "n/a",
      },
      {
        name: "wave2",
        id: 2,
        startDate: "2019-03-03 22:15:01",
        endDate: "2020-01-03 22:15:014",
        applications: [{ name: "app3" }, { name: "app4" }],
        stakeholders: [{ name: "sh1", email: "aaakwd@aol.com" }],
        status: "n/a",
      },
    ],

    // waves: data || [],
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
      queryClient.invalidateQueries([WavesQueryKey]);
    },
    onError: (err: AxiosError) => {
      onError(err);
    },
  });
  return {
    mutate,
    isLoading,
    error,
  };
};
