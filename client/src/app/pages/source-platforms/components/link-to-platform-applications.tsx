import React from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { Text } from "@patternfly/react-core";

import type { SourcePlatform } from "@app/api/models";
import { serializeFilterUrlParams } from "@app/hooks/table-controls";
import { Paths } from "@app/Paths";

const getApplicationsUrl = (platformName?: string) => {
  if (!platformName) return "";

  const filterValues = {
    platforms: [platformName],
  };

  const serializedParams = serializeFilterUrlParams(filterValues);

  const queryString = serializedParams.filters
    ? `filters=${serializedParams.filters}`
    : "";
  return `${Paths.applications}?${queryString}`;
};

const LinkToPlatformApplications: React.FC<{
  platform: SourcePlatform | null | undefined;
  noApplicationsMessage?: React.ReactNode;
}> = ({ platform, noApplicationsMessage }) => {
  const { t } = useTranslation();

  const hasApplications = (platform?.applications?.length ?? 0) > 0;

  return !hasApplications && noApplicationsMessage ? (
    <>{noApplicationsMessage}</>
  ) : !hasApplications && !noApplicationsMessage ? (
    <Text>{t("message.platformNoApplications")}</Text>
  ) : (
    <Link to={getApplicationsUrl(platform?.name)}>
      {platform?.applications?.length === 1
        ? t("message.platformApplicationCount_one", {
            count: platform?.applications?.length,
          })
        : t("message.platformApplicationCount_other", {
            count: platform?.applications?.length ?? 0,
          })}
    </Link>
  );
};

export default LinkToPlatformApplications;
