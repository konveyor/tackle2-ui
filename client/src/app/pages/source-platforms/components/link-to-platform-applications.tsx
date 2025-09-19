import React from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { Text } from "@patternfly/react-core";

import { Paths } from "@app/Paths";
import type { SourcePlatform } from "@app/api/models";
import { serializeFilterUrlParams } from "@app/hooks/table-controls";

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
      {t("message.platformApplicationCount", {
        count: platform?.applications?.length ?? 0,
      })}
    </Link>
  );
};

export default LinkToPlatformApplications;
