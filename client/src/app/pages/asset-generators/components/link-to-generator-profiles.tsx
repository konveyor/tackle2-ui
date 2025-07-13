import React from "react";
import { useTranslation } from "react-i18next";
import { Text } from "@patternfly/react-core";

import type { AssetGenerator } from "@app/api/models";
import { serializeFilterUrlParams } from "@app/hooks/table-controls";
import { Paths } from "@app/Paths";

const getApplicationsUrl = (generatorName?: string) => {
  if (!generatorName) return "";

  const filterValues = {
    generators: [generatorName],
  };

  const serializedParams = serializeFilterUrlParams(filterValues);

  const queryString = serializedParams.filters
    ? `filters=${serializedParams.filters}`
    : "";
  return `${Paths.applications}?${queryString}`;
};

const LinkToGeneratorApplications: React.FC<{
  generator: AssetGenerator | null | undefined;
  noApplicationsMessage?: React.ReactNode;
}> = ({ generator, noApplicationsMessage }) => {
  const { t } = useTranslation();

  const hasProfiles = (generator?.profiles?.length ?? 0) > 0;

  return !hasProfiles && noApplicationsMessage ? (
    <>{noApplicationsMessage}</>
  ) : !hasProfiles && !noApplicationsMessage ? (
    <Text>{t("message.generatorNoApplications")}</Text>
  ) : (
    <Text>{generator?.profiles?.length || 0}</Text>
    // <Link to={getApplicationsUrl(generator?.name)}>
    //   {generator?.profiles?.length === 1
    //     ? t("message.platformApplicationCount_one", {
    //         count: generator?.profiles?.length,
    //       })
    //     : t("message.platformApplicationCount_other", {
    //         count: generator?.profiles?.length ?? 0,
    //       })}
    // </Link>
  );
};

export default LinkToGeneratorApplications;
