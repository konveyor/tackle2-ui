import React from "react";
import { useTranslation } from "react-i18next";
import { Spinner } from "@patternfly/react-core";

export interface INodeFetchProps {
  isFetching: boolean;
  fetchError?: any;
  node: React.ReactNode;
}

export const NodeFetch: React.FC<INodeFetchProps> = ({
  isFetching,
  fetchError,
  node,
}) => {
  const { t } = useTranslation();

  if (fetchError) {
    return <>{t("terms.unknown")}</>;
  }

  if (isFetching) {
    return (
      <>
        <Spinner size="sm" /> {t("terms.loading")}...
      </>
    );
  }

  return <>{node}</>;
};
