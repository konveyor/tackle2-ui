import { OptionWithValue } from "@app/components/SimpleSelect";
import React from "react";
import { useTranslation } from "react-i18next";

export const DEFAULT_KIND = "cloudfoundry";

// Extend this map as new platform kinds are added
const KIND_MAP: Record<string, { label: string; urlTooltip: string }> = {
  cloudfoundry: {
    label: "Cloud Foundry",
    urlTooltip: "API URL to Cloud Foundry",
  },
} as const;

export const usePlatformKindList = (): {
  kinds: OptionWithValue<string>[];
  getDisplayLabel: (kind?: string | null) => string;
  getUrlTooltip: (kind?: string | null) => string;
} => {
  const kinds: OptionWithValue<string>[] = React.useMemo(
    () =>
      Object.entries(KIND_MAP).map(([key, values]) => ({
        value: key,
        toString: () => values.label,
      })),
    []
  );

  const { t } = useTranslation();
  const getDisplayLabel = React.useCallback(
    (kind: string | undefined | null): string => {
      if (kind && kind in KIND_MAP) {
        return KIND_MAP[kind].label;
      }
      return t("terms.unknown");
    },
    [t]
  );

  const getUrlTooltip = React.useCallback(
    (kind: string | undefined | null): string => {
      if (kind && kind in KIND_MAP) {
        return KIND_MAP[kind].urlTooltip;
      }
      return "";
    },
    []
  );

  return { kinds, getDisplayLabel, getUrlTooltip };
};
