import React from "react";
import { useTranslation } from "react-i18next";

import { NoDataEmptyState } from "@app/components/NoDataEmptyState";

export const NoApplicationSelectedEmptyState: React.FC = () => {
  const { t } = useTranslation();

  return <NoDataEmptyState title={t("message.noDataAvailableTitle")} />;
};
