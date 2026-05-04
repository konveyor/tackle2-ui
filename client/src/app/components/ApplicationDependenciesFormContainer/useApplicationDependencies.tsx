import { useState } from "react";
import { AxiosError } from "axios";
import { useTranslation } from "react-i18next";

import { Application, ApplicationDependency } from "@app/api/models";
import {
  useCreateApplicationDependency,
  useDeleteApplicationDependency,
  useFetchApplicationDependencies,
} from "@app/queries/applications";
import { toRef } from "@app/utils/model-utils";
import { getAxiosErrorMessage } from "@app/utils/utils";

export const useApplicationDependencies = (application: Application) => {
  const { t } = useTranslation();
  const { northboundDependencies, southboundDependencies, isFetching } =
    useFetchApplicationDependencies(application?.id);
  const [saveError, setSaveError] = useState<{
    northSaveError: string | null;
    southSaveError: string | null;
  }>({
    northSaveError: null,
    southSaveError: null,
  });

  const setErrorMsg = (
    error: string | null,
    sendData: ApplicationDependency
  ) => {
    const isNorth = sendData.to.id === application.id;
    setSaveError((prev) =>
      isNorth
        ? { ...prev, northSaveError: error }
        : { ...prev, southSaveError: error }
    );
  };

  const createDependencyMutation = useCreateApplicationDependency({
    onError: (error: AxiosError, sendData: ApplicationDependency) => {
      if (error.response?.status === 409) {
        setErrorMsg(t("message.cyclicDependenciesNotAllowed"), sendData);
      } else {
        setErrorMsg(getAxiosErrorMessage(error), sendData);
      }
    },
    onSuccess: (sendData: ApplicationDependency) => {
      setErrorMsg(null, sendData);
    },
  });

  const createDependency = (
    from: Application | undefined,
    to: Application | undefined
  ) => {
    if (!from || !to || !toRef(from) || !toRef(to)) {
      return;
    }
    createDependencyMutation.mutate({
      from: toRef(from),
      to: toRef(to),
    });
  };

  const deleteDependencyMutation = useDeleteApplicationDependency();
  const deleteDependency = (fromId: string | number, toId: string | number) => {
    const dependencyId = [
      ...(northboundDependencies ?? []),
      ...(southboundDependencies ?? []),
    ].find((f) => f.from.id === Number(fromId) && f.to.id === Number(toId))?.id;
    if (dependencyId) {
      deleteDependencyMutation.mutate(dependencyId);
    }
  };

  const northboundDependenciesOptions =
    northboundDependencies
      ?.filter((f) => f.to.id === application.id)
      .map((dep) => String(dep.from.id)) ?? [];
  const southboundDependenciesOptions =
    southboundDependencies
      ?.filter((f) => f.from.id === application.id)
      .map((dep) => String(dep.to.id)) ?? [];

  return {
    northboundDependenciesOptions,
    southboundDependenciesOptions,
    createDependency,
    deleteDependency,
    saveError,
    isFetching,
  };
};
