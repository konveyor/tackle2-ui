import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "react-query";

import {
  deleteApplicationImportSummary,
  getApplicationImports,
} from "@app/api/rest";
import { ApplicationImportSummary, ApplicationImport } from "@app/api/models";
import { AxiosError } from "axios";

export interface IImportMutateState {
  mutate: any;
  isLoading: boolean;
  error: any;
}
export const ImportsQueryKey = "imports";

export const useFetchImports = () => {
  const [imports, setImports] = useState<ApplicationImport[]>([]);
  const { isLoading, error, refetch } = useQuery(
    ImportsQueryKey,
    getApplicationImports,
    {
      onSuccess: (data: ApplicationImport[]) => setImports(data),
      onError: (err: Error) => {
        console.log(error);
      },
    }
  );
  return {
    imports,
    isFetching: isLoading,
    fetchError: error,
    refetch,
  };
};

export const useFetchImportSummaries = () => {
  const [importSummaries, setImportSummaries] = useState<
    ApplicationImportSummary[]
  >([]);
  const { isLoading, error, refetch } = useQuery(
    ImportsQueryKey,
    getApplicationImports,
    {
      onSuccess: (data: ApplicationImportSummary[]) => setImportSummaries(data),
      onError: (err: Error) => {
        console.log(error);
      },
    }
  );
  return {
    importSummaries,
    isFetching: isLoading,
    fetchError: error,
    refetch,
  };
};

// export const useUpdateApplicationMutation = (
//   onSuccess: (res: any) => void,
//   onError: (err: AxiosError) => void
// ): IApplicationMutateState => {
//   const queryClient = useQueryClient();
//   const { isLoading, mutate, error } = useMutation(updateApplication, {
//     onSuccess: (res) => {
//       onSuccess(res);
//       queryClient.invalidateQueries(ApplicationsQueryKey);
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

// export const useCreateApplicationMutation = (
//   onSuccess: (res: any) => void,
//   onError: (err: AxiosError) => void
// ): IApplicationMutateState => {
//   const queryClient = useQueryClient();
//   const { isLoading, mutate, error } = useMutation(createApplication, {
//     onSuccess: (res) => {
//       onSuccess(res);
//       queryClient.invalidateQueries(ApplicationsQueryKey);
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

export const useDeleteImportSummaryMutation = (
  onSuccess: () => void,
  onError: (err: AxiosError) => void
) => {
  return useMutation(deleteApplicationImportSummary, {
    onSuccess: () => {
      onSuccess();
    },
    onError: (err: AxiosError) => {
      onError(err);
    },
  });
};
