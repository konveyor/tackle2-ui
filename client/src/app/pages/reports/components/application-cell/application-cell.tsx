import React from "react";
import { AxiosError } from "axios";
import { useTranslation } from "react-i18next";

import { EmptyTextMessage } from "@app/components/EmptyTextMessage";
import { Application } from "@app/api/models";

export interface IApplicationCellProps {
  application?: Application;
  isFetching: boolean;
  fetchError?: AxiosError;
  fetchCount: number;
}

export const ApplicationCell: React.FC<IApplicationCellProps> = ({
  application,
  isFetching,
  fetchError,
  fetchCount,
}) => {
  const { t } = useTranslation();

  if (fetchError) {
    return <EmptyTextMessage message={t("terms.notAvailable")} />;
  }
  if (isFetching || fetchCount === 0) {
    return <></>;
  }

  return <>{application?.name}</>;
};
