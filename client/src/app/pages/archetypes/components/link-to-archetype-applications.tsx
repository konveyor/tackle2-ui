import * as React from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

import { Paths } from "@app/Paths";
import type { Archetype } from "@app/api/models";
import { serializeFilterUrlParams } from "@app/hooks/table-controls";

const getApplicationsUrl = (archetypeName?: string) => {
  if (!archetypeName) return "";

  const filterValues = {
    archetypes: [archetypeName],
  };

  const serializedParams = serializeFilterUrlParams(filterValues);

  const queryString = serializedParams.filters
    ? `filters=${serializedParams.filters}`
    : "";
  return `${Paths.applications}?${queryString}`;
};

const LinkToArchetypeApplications: React.FC<{
  archetype: Archetype | null | undefined;
  noApplicationsMessage?: React.ReactNode;
}> = ({ archetype, noApplicationsMessage }) => {
  const { t } = useTranslation();

  const hasApplications = (archetype?.applications?.length ?? 0) > 0;

  return !hasApplications && noApplicationsMessage ? (
    <>{noApplicationsMessage}</>
  ) : !hasApplications && !noApplicationsMessage ? (
    <span>{t("message.archetypeNoApplications")}</span>
  ) : (
    <Link to={getApplicationsUrl(archetype?.name)}>
      {t("message.archetypeApplicationCount", {
        count: archetype?.applications?.length ?? 0,
      })}
    </Link>
  );
};

export default LinkToArchetypeApplications;
