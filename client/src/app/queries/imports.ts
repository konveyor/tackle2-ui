import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { DEFAULT_REFETCH_INTERVAL } from "@app/Constants";
import {
  deleteApplicationImportSummary,
  getApplicationImportSummaryById,
  getApplicationImports,
  getApplicationsImportSummary,
} from "@app/api/rest";

export const ImportSummariesQueryKey = "importsummaries";
export const ImportsQueryKey = "imports";
export const ImportQueryKey = "import";

export const useFetchImports = (
  importSummaryID: number,
  isValid: boolean | string,
  refetchInterval: number | false = DEFAULT_REFETCH_INTERVAL
) => {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: [ImportsQueryKey, importSummaryID, isValid],
    queryFn: () => getApplicationImports(importSummaryID, isValid),
    onError: (error) => console.log(error),
    refetchInterval,
  });
  return {
    imports: data || [],
    isFetching: isLoading,
    fetchError: error,
    refetch,
  };
};

export const useFetchImportSummaries = (
  refetchInterval: number | false = DEFAULT_REFETCH_INTERVAL
) => {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: [ImportSummariesQueryKey],
    queryFn: getApplicationsImportSummary,
    refetchInterval,
    onError: (error) => console.log(error),
  });
  return {
    importSummaries: data || [],
    isFetching: isLoading,
    fetchError: error,
    refetch,
  };
};

export const useFetchImportSummaryById = (id: number | string) => {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: [ImportQueryKey, id],
    queryFn: () => getApplicationImportSummaryById(id),
    onError: (error) => console.log(error),
  });

  return {
    importSummary: data,
    isFetching: isLoading,
    fetchError: error,
    refetch,
  };
};

export const useDeleteImportSummaryMutation = (
  onSuccess: () => void,
  onError: (err: Error | null) => void
) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteApplicationImportSummary,
    onSuccess: () => {
      onSuccess && onSuccess();
      queryClient.invalidateQueries({ queryKey: [ImportSummariesQueryKey] });
    },
    onError: (err: Error) => {
      onError && onError(err);
    },
  });
};
