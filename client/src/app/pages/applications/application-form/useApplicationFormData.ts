import React from "react";
import { useTranslation } from "react-i18next";
import { AxiosError } from "axios";

import { Application } from "@app/api/models";
import { getAxiosErrorMessage } from "@app/utils/utils";
import { matchItemsToRef, matchItemsToRefs } from "@app/utils/model-utils";
import {
  useCreateApplicationMutation,
  useFetchApplications,
  useUpdateApplicationMutation,
} from "@app/queries/applications";
import { useFetchBusinessServices } from "@app/queries/businessservices";
import { useFetchTagsWithTagItems } from "@app/queries/tags";
import { useFetchStakeholders } from "@app/queries/stakeholders";
import { NotificationsContext } from "@app/components/NotificationsContext";
import { useFetchPlatforms } from "@app/queries/platforms";
import { OptionWithValue } from "@app/components/SimpleSelect";

const entityToOptionWithValue = <T extends { name: string }>(
  entity: T
): OptionWithValue<string> => ({
  value: entity.name,
  toString: () => entity.name,
});

const repositoryKindOptions: OptionWithValue<string>[] = [
  {
    value: "git",
    toString: () => `Git`,
  },
  {
    value: "subversion",
    toString: () => `Subversion`,
  },
];

export const useApplicationFormData = ({
  onActionSuccess = () => {},
  onActionFail = () => {},
}: {
  onActionSuccess?: () => void;
  onActionFail?: () => void;
}) => {
  const { t } = useTranslation();
  const { pushNotification } = React.useContext(NotificationsContext);

  // Fetch data
  const { tags, tagItems } = useFetchTagsWithTagItems();
  const { businessServices } = useFetchBusinessServices();
  const { stakeholders } = useFetchStakeholders();
  const { data: existingApplications } = useFetchApplications();
  const { platforms: sourcePlatforms } = useFetchPlatforms();

  // Helpers
  const idsToTagRefs = (ids: number[] | undefined | null) =>
    matchItemsToRefs(tags, (i) => i.id, ids);

  const businessServiceToRef = (name: string | undefined | null) =>
    matchItemsToRef(businessServices, (i) => i.name, name);

  const sourcePlatformToRef = (name: string | undefined | null) =>
    matchItemsToRef(sourcePlatforms, (i) => i.name, name);

  const sourcePlatformFromName = (name?: string) =>
    name ? sourcePlatforms.find((p) => p.name === name) : undefined;

  const stakeholderToRef = (name: string | undefined | null) =>
    matchItemsToRef(stakeholders, (i) => i.name, name);

  const stakeholdersToRefs = (names: string[] | undefined | null) =>
    matchItemsToRefs(stakeholders, (i) => i.name, names);

  // Mutation notification handlers
  const onCreateApplicationSuccess = (application: Application) => {
    pushNotification({
      title: t("toastr.success.createWhat", {
        type: t("terms.application"),
        what: application.name,
      }),
      variant: "success",
    });
    onActionSuccess();
  };

  const onUpdateApplicationSuccess = (payload: Application) => {
    pushNotification({
      title: t("toastr.success.saveWhat", {
        type: t("terms.application"),
        what: payload.name,
      }),
      variant: "success",
    });
    onActionSuccess();
  };

  const onCreateUpdateApplicationError = (error: AxiosError) => {
    pushNotification({
      title: getAxiosErrorMessage(error),
      variant: "danger",
    });
    onActionFail();
  };

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
    sourcePlatforms,
    sourcePlatformOptions: sourcePlatforms.map(entityToOptionWithValue),
    sourcePlatformFromName,
    sourcePlatformToRef,
    repositoryKindOptions,
  };
};
