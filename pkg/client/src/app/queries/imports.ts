import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "react-query";

import {
  deleteApplicationImportSummary,
  getApplicationImports,
  getApplicationImportSummary,
  getApplicationImportSummaryById,
} from "@app/api/rest";
import { ApplicationImportSummary, ApplicationImport } from "@app/api/models";
import { AxiosError } from "axios";

export interface IImportMutateState {
  mutate: any;
  isLoading: boolean;
  error: any;
}
export const ImportsQueryKey = "imports";
export const ImportQueryKey = "import";

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
  const { isLoading, error, refetch } = useQuery(ImportsQueryKey, () =>
    getApplicationImportSummary()
      .then(({ data }) => {
        setImportSummaries(data);
        return data;
      })
      .catch((error) => {
        console.log("error, ", error);
        return error;
      })
  );
  return {
    importSummaries,
    isFetching: isLoading,
    fetchError: error,
    refetch,
  };
};
export const useFetchImportSummaryByID = (
  onError: (err: AxiosError) => void
) => {
  const queryClient = useQueryClient();
  const [importSummary, setImportSummary] =
    useState<ApplicationImportSummary>();
  const { isLoading, error, refetch } = useQuery(
    ImportQueryKey,
    () => getApplicationImportSummaryById,
    {
      onSuccess: (res) => {
        queryClient.invalidateQueries(ImportQueryKey);
      },
      onError: (err: AxiosError) => {
        onError(err);
      },
    }
  );
  return {
    importSummary,
    isFetching: isLoading,
    fetchError: error,
    refetch,
  };
};

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
