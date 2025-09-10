import React, { useCallback, useMemo } from "react";
import { AxiosError } from "axios";
import { useTranslation } from "react-i18next";

import { Application } from "@app/api/models";
import { NotificationsContext } from "@app/components/NotificationsContext";
import { OptionWithValue } from "@app/components/SimpleSelect";
import { useRepositoryKind } from "@app/hooks/useRepositoryKind";
import {
  useCreateApplicationMutation,
  useFetchApplications,
  useUpdateApplicationMutation,
} from "@app/queries/applications";
import { useFetchBusinessServices } from "@app/queries/businessservices";
import { useFetchPlatformsWithCoordinatesSchemas } from "@app/queries/platforms";
import { useFetchStakeholders } from "@app/queries/stakeholders";
import { useFetchTagsWithTagItems } from "@app/queries/tags";
import { matchItemsToRef, matchItemsToRefs } from "@app/utils/model-utils";
import { getAxiosErrorMessage } from "@app/utils/utils";

const entityToOptionWithValue = <T extends { name: string }>(
  entity: T
): OptionWithValue<string> => ({
  value: entity.name,
  toString: () => entity.name,
});

export const useApplicationFormData = ({
  onActionSuccess = () => {},
  onActionFail = () => {},
}: {
  onActionSuccess?: () => void;
  onActionFail?: () => void;
} = {}) => {
  const { t } = useTranslation();
  const { pushNotification } = React.useContext(NotificationsContext);

  // Fetch data
  const { tags, tagItems, isSuccess: is1 } = useFetchTagsWithTagItems();
  const { businessServices, isSuccess: is2 } = useFetchBusinessServices();
  const { stakeholders, isSuccess: is3 } = useFetchStakeholders();
  const { data: existingApplications, isSuccess: is4 } = useFetchApplications();
  const { platforms, isSuccess: is5 } =
    useFetchPlatformsWithCoordinatesSchemas();
  const { kindOptions } = useRepositoryKind();

  const isDataReady = useMemo(() => {
    return is1 && is2 && is3 && is4 && is5;
  }, [is1, is2, is3, is4, is5]);

  // Helpers
  const idsToTagRefs = useCallback(
    (ids: number[] | undefined | null) =>
      matchItemsToRefs(tags, (i) => i.id, ids),
    [tags]
  );

  const businessServiceToRef = useCallback(
    (name: string | undefined | null) =>
      matchItemsToRef(businessServices, (i) => i.name, name),
    [businessServices]
  );

  const platformFromName = useCallback(
    (name?: string | null) =>
      name ? platforms.find((p) => p.name === name) : undefined,
    [platforms]
  );

  const stakeholderToRef = useCallback(
    (name: string | undefined | null) =>
      matchItemsToRef(stakeholders, (i) => i.name, name),
    [stakeholders]
  );

  const stakeholdersToRefs = useCallback(
    (names: string[] | undefined | null) =>
      matchItemsToRefs(stakeholders, (i) => i.name, names),
    [stakeholders]
  );

  // Mutation notification handlers
  const onCreateApplicationSuccess = useCallback(
    (application: Application) => {
      pushNotification({
        title: t("toastr.success.createWhat", {
          type: t("terms.application"),
          what: application.name,
        }),
        variant: "success",
      });
      onActionSuccess();
    },
    [pushNotification, t, onActionSuccess]
  );

  const onUpdateApplicationSuccess = useCallback(
    (payload: Application) => {
      pushNotification({
        title: t("toastr.success.saveWhat", {
          type: t("terms.application"),
          what: payload.name,
        }),
        variant: "success",
      });
      onActionSuccess();
    },
    [pushNotification, t, onActionSuccess]
  );

  const onCreateUpdateApplicationError = useCallback(
    (error: AxiosError) => {
      pushNotification({
        title: getAxiosErrorMessage(error),
        variant: "danger",
      });
      onActionFail();
    },
    [pushNotification, onActionFail]
  );

  // Mutations
  const { mutate: createApplication } = useCreateApplicationMutation(
    onCreateApplicationSuccess,
    onCreateUpdateApplicationError
  );

  const { mutate: updateApplication } = useUpdateApplicationMutation(
    onUpdateApplicationSuccess,
    onCreateUpdateApplicationError
  );

  // Send back source data and action that are needed by the ApplicationForm
  return {
    isDataReady,
    businessServices,
    businessServiceOptions: businessServices.map(entityToOptionWithValue),
    businessServiceToRef,
    stakeholders,
    stakeholdersOptions: stakeholders.map(entityToOptionWithValue),
    stakeholderToRef,
    stakeholdersToRefs,
    existingApplications,
    tags,
    tagItems,
    idsToTagRefs,
    createApplication,
    updateApplication,
    platforms,
    platformOptions: platforms.map(entityToOptionWithValue),
    platformFromName,
    repositoryKindOptions: kindOptions,
  };
};
