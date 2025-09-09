import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios, { AxiosError, AxiosResponse } from "axios";
import saveAs from "file-saver";

import { DEFAULT_REFETCH_INTERVAL } from "@app/Constants";
import {
  Application,
  ApplicationDependency,
  MimeType,
  New,
} from "@app/api/models";
import {
  APPLICATIONS,
  createApplication,
  createApplicationDependency,
  deleteApplication,
  deleteApplicationDependency,
  deleteBulkApplications,
  getApplicationById,
  getApplicationDependencies,
  getApplicationManifest,
  getApplications,
  updateApplication,
} from "@app/api/rest";

import { assessmentsByItemIdQueryKey } from "./assessments";

export const ApplicationDependencyQueryKey = "applicationdependencies";
export const ApplicationsQueryKey = "applications";
export const ReportQueryKey = "report";
export const ApplicationManifestQueryKey = "applicationManifest";
interface DownloadOptions {
  application: Application;
  mimeType: MimeType;
}

export const useFetchApplications = (
  refetchInterval:
    | number
    | false
    | (() => number | false) = DEFAULT_REFETCH_INTERVAL
) => {
  const queryClient = useQueryClient();
  const { isLoading, isSuccess, error, refetch, data } = useQuery({
    queryKey: [ApplicationsQueryKey],
    queryFn: getApplications,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [assessmentsByItemIdQueryKey],
      });
    },
    onError: (error: AxiosError) => console.log(error),
    refetchInterval,
  });
  return {
    data: data || [],
    isFetching: isLoading,
    isLoading,
    isSuccess,
    error,
    refetch,
  };
};

export const ApplicationQueryKey = "application";

export const useFetchApplicationById = (
  id?: number | string,
  refetchInterval: number | false = DEFAULT_REFETCH_INTERVAL
) => {
  const { data, isLoading, isSuccess, error } = useQuery({
    queryKey: [ApplicationQueryKey, id],
    queryFn: () =>
      id === undefined ? Promise.resolve(undefined) : getApplicationById(id),
    onError: (error: AxiosError) => console.log("error, ", error),
    enabled: id !== undefined,
    refetchInterval,
  });

  return {
    application: data,
    isFetching: isLoading,
    isLoading,
    isSuccess,
    fetchError: error,
  };
};

export const useFetchApplicationManifest = (
  applicationId?: number | string,
  refetchInterval: number | false = DEFAULT_REFETCH_INTERVAL * 2
) => {
  const { data, isLoading, isSuccess, error } = useQuery({
    queryKey: [ApplicationManifestQueryKey, applicationId],
    queryFn: () =>
      applicationId === undefined
        ? Promise.resolve(undefined)
        : getApplicationManifest(applicationId),
    enabled: applicationId !== undefined,
    retry: false,
    refetchInterval,
  });

  return {
    manifest: data,
    isFetching: isLoading,
    isLoading,
    isSuccess,
    fetchError: error,
  };
};

export const useUpdateApplicationMutation = (
  onSuccess: (payload: Application) => void,
  onError: (err: AxiosError) => void
) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateApplication,
    onSuccess: (_res, payload) => {
      queryClient.invalidateQueries({ queryKey: [ApplicationsQueryKey] });
      onSuccess(payload);
    },
    onError: onError,
  });
};

export interface UpdateAllApplicationsResult {
  success: { application: Application; response: AxiosResponse<void> }[];
  failure: { application: Application; cause: Error }[];
}

const patchAndUpdateApplications = async ({
  applications,
  patch,
}: {
  applications: Application[];
  patch: (application: Application) => Application;
}): Promise<UpdateAllApplicationsResult> => {
  // TODO: Ideally we'd have a single request to update all applications instead of one per application.
  const results = await Promise.allSettled(
    applications.map(async (application) => {
      try {
        const patchedApplication = patch(application);
        const response = await updateApplication(patchedApplication);
        return {
          success: { application: patchedApplication, response },
        };
      } catch (error) {
        return {
          failure: { application, cause: error as Error },
        };
      }
    })
  );

  return results.reduce(
    (acc, result) => {
      if (result.status === "fulfilled") {
        if (result.value.success) acc.success.push(result.value.success);
        if (result.value.failure) acc.failure.push(result.value.failure);
      }
      return acc;
    },
    { success: [], failure: [] } as UpdateAllApplicationsResult
  );
};

/** Mutation to apply a patch function to multiple applications and individually update. */
export const useBulkPatchApplicationsMutation = (
  onSuccess: (results: UpdateAllApplicationsResult) => void,
  onError: (err: AxiosError) => void
) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: patchAndUpdateApplications,
    onSuccess: async (results) => {
      await queryClient.invalidateQueries({
        queryKey: [ApplicationsQueryKey],
      });

      onSuccess(results);
    },
    onError: onError,
  });
};

export const useCreateApplicationMutation = (
  onSuccess: (application: Application, payload: New<Application>) => void,
  onError: (err: AxiosError, payload: New<Application>) => void
) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createApplication,
    onSuccess: (application: Application, payload: New<Application>) => {
      queryClient.invalidateQueries({ queryKey: [ApplicationsQueryKey] });
      onSuccess(application, payload);
    },
    onError: onError,
  });
};

export const useDeleteApplicationMutation = (
  onSuccess: (id: number) => void,
  onError: (err: AxiosError) => void
) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id }: { id: number }) => deleteApplication(id),
    onSuccess: (_res) => {
      queryClient.invalidateQueries({ queryKey: [ApplicationsQueryKey] });
      onSuccess(1);
    },
    onError: onError,
  });
};

export const useBulkDeleteApplicationMutation = (
  onSuccess: (numberOfApps: number) => void,
  onError: (err: AxiosError) => void
) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ ids }: { ids: number[] }) => deleteBulkApplications(ids),
    onSuccess: (res, vars) => {
      onSuccess(vars.ids.length);
      queryClient.invalidateQueries({ queryKey: [ApplicationsQueryKey] });
    },
    onError: onError,
  });
};

export const downloadStaticReport = async ({
  application,
  mimeType,
}: DownloadOptions): Promise<void> => {
  const yamlAcceptHeader = "application/x-yaml";
  let url = `${APPLICATIONS}/${application.id}/analysis/report`;

  switch (mimeType) {
    case MimeType.YAML:
      url = `${APPLICATIONS}/${application.id}/analysis`;
      break;
    case MimeType.TAR:
    default:
      url = `${APPLICATIONS}/${application.id}/analysis/report`;
  }

  try {
    const response = await axios.get(url, {
      responseType: "blob",
      ...(MimeType.YAML && {
        headers: {
          Accept: yamlAcceptHeader,
        },
      }),
    });

    if (response.status !== 200) {
      throw new Error("Network response was not ok when downloading file.");
    }

    const blob = new Blob([response.data]);
    saveAs(blob, `analysis-report-app-${application.name}.${mimeType}`);
  } catch (error) {
    console.error("There was an error downloading the file:", error);
    throw error;
  }
};

export const useDownloadStaticReport = () => {
  return useMutation({ mutationFn: downloadStaticReport });
};

export const useFetchApplicationDependencies = (
  applicationId?: string | number
) => {
  const {
    data: northData,
    error: northError,
    isLoading: isLoadingNorth,
    refetch: refetchNorth,
  } = useQuery<ApplicationDependency[], AxiosError>({
    queryKey: [ApplicationDependencyQueryKey, applicationId, "north"],
    queryFn: () => getApplicationDependencies({ to: [`${applicationId}`] }),
    enabled: !!applicationId,
  });

  const {
    data: southData,
    error: southError,
    isLoading: isLoadingSouth,
    refetch: refetchSouth,
  } = useQuery<ApplicationDependency[], AxiosError>({
    queryKey: [ApplicationDependencyQueryKey, applicationId, "south"],
    queryFn: () => getApplicationDependencies({ from: [`${applicationId}`] }),
  });

  const isFetching = isLoadingNorth || isLoadingSouth;
  const fetchError = northError || southError;

  // Combining both refetch functions into a single one.
  const refetch = () => {
    refetchNorth();
    refetchSouth();
  };

  return {
    northboundDependencies: northData,
    southboundDependencies: southData,
    allDependencies: [...(northData || []), ...(southData || [])],
    isFetching,
    fetchError,
    refetch,
  };
};

interface UseCreateApplicationDependencyOptions {
  onError?: (error: AxiosError) => void;
  onSuccess?: () => void;
}

export const useCreateApplicationDependency = ({
  onError,
  onSuccess,
}: UseCreateApplicationDependencyOptions = {}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createApplicationDependency,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [ApplicationDependencyQueryKey],
      });
      if (onSuccess) {
        onSuccess();
      }
    },
    onError: (error: AxiosError) => {
      if (onError) {
        onError(error);
      }
    },
  });
};

export const useDeleteApplicationDependency = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteApplicationDependency,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [ApplicationDependencyQueryKey],
      });
    },
  });
};
