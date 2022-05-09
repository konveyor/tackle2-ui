import React from "react";
import { useMutation, useQuery, useQueryClient } from "react-query";

import { AxiosError } from "axios";
import { cleanRepository, getVolumes } from "@app/api/rest";
import { Volume } from "@app/api/models";

export interface IVolumeFetchState {
  volumes: Volume[];
  isFetching: boolean;
  fetchError: any;
}

export interface ICleanRepositoryMutateState {
  mutate: any;
  isLoading: boolean;
  error: any;
}

export const VolumesQueryKey = "volumes";

export const useCleanRepositoryMutation = (
  onSuccess: (res: any) => void,
  onError: (err: AxiosError) => void
): ICleanRepositoryMutateState => {
  const queryClient = useQueryClient();
  const { isLoading, mutate, error } = useMutation(cleanRepository, {
    onSuccess: (res) => {
      onSuccess(res);
      //   queryClient.invalidateQueries("identities");
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

// export const useCreateIdentityMutation = (
//   onSuccess: (res: any) => void,
//   onError: (err: AxiosError) => void
// ): IIdentityMutateState => {
//   const queryClient = useQueryClient();
//   const { isLoading, mutate, error } = useMutation(createIdentity, {
//     onSuccess: (res) => {
//       onSuccess(res);
//       queryClient.invalidateQueries("identities");
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

export const useFetchVolumes = (): IVolumeFetchState => {
  const [volumes, setVolumes] = React.useState<Volume[]>([]);
  const { isLoading, error } = useQuery(VolumesQueryKey, () =>
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
  };
};

// export const useDeleteIdentityMutation = (
//   onSuccess: (res: any) => void,
//   onError: (err: AxiosError) => void
// ): IIdentityMutateState => {
//   const queryClient = useQueryClient();

//   const { isLoading, mutate, error } = useMutation(deleteIdentity, {
//     onSuccess: (res) => {
//       onSuccess(res);
//       queryClient.invalidateQueries("identities");
//     },
//     onError: (err: AxiosError) => {
//       onError(err);
//       queryClient.invalidateQueries("identities");
//     },
//   });
//   return {
//     mutate,
//     isLoading,
//     error,
//   };
// };
