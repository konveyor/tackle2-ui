import { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";

import { OptionWithValue } from "@app/components/SimpleSelect";

export const DEFAULT_KIND = "cloudfoundry";

export const KIND_MAP: Map<
  string,
  { labelKey: string; urlTooltipKey: string }
> = new Map([
  [
    "cloudfoundry",
    {
      labelKey: "platformKind.cloudfoundry.label",
      urlTooltipKey: "platformKind.cloudfoundry.urlTooltip",
    },
  ],
]);

export const usePlatformKindList = () => {
  const { t } = useTranslation();

  const kinds: OptionWithValue<string>[] = useMemo(
    () =>
      Array.from(KIND_MAP.entries()).map(([key, meta]) => ({
        value: key,
        toString: () => t(meta.labelKey),
      })),
    [t]
  );

  const getDisplayLabel = useCallback(
    (kind: string | undefined | null): string => {
      if (kind && KIND_MAP.has(kind)) {
        return t(KIND_MAP.get(kind)!.labelKey);
      }
      return t("terms.unknown");
    },
    [t]
  );

  const getUrlTooltip = useCallback(
    (kind: string | undefined | null): string => {
      if (kind && KIND_MAP.has(kind)) {
        return t(KIND_MAP.get(kind)!.urlTooltipKey);
      }
      return "";
    },
    [t]
  );

  return { kinds, getDisplayLabel, getUrlTooltip };
};
