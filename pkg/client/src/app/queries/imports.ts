import { useState } from "react";
import { useMutation, useQuery } from "react-query";

import {
  deleteApplicationImportSummary,
  getApplicationImports,
  getApplicationImportSummaryById,
  getApplicationsImportSummary,
} from "@app/api/rest";
import { ApplicationImportSummary, ApplicationImport } from "@app/api/models";

export interface IImportMutateState {
  mutate: any;
  isLoading: boolean;
  error: any;
}

export const useFetchImports = () => {
  const [imports, setImports] = useState<ApplicationImport[]>([]);
  const { isLoading, error, refetch } = useQuery(
    "imports",
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
    "importsummaries",
    getApplicationsImportSummary,
    {
      refetchInterval: 5000,
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

export const useFetchImportSummaryByID = (id: number | string) => {
  const [importSummary, setImportSummary] =
    useState<ApplicationImportSummary>();

  const { isLoading, error, refetch } = useQuery(
    ["import", id],
    () => getApplicationImportSummaryById(id),
    {
      onSuccess: (data: ApplicationImportSummary) => setImportSummary(data),
      onError: (err: Error) => {
        console.log(error);
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
  onError: (err: Error | null) => void
) => {
  return useMutation(deleteApplicationImportSummary, {
    onSuccess: () => {
      onSuccess && onSuccess();
    },
    onError: (err: Error) => {
      onError && onError(err);
    },
  });
};
