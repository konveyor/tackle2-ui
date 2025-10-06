import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import { OptionWithValue } from "@app/components/SimpleSelect";

export type RepositoryKind = "git" | "subversion" | "" | null;

export const KIND_META: Map<RepositoryKind, { labelKey: string }> = new Map([
  ["git", { labelKey: "repositoryKind.git" }],
  ["subversion", { labelKey: "repositoryKind.subversion" }],
]);

export const useRepositoryKind = () => {
  const { t } = useTranslation();

  const kindOptions: OptionWithValue<RepositoryKind>[] = useMemo(
    () =>
      Array.from(KIND_META.entries()).map(([key, meta]) => ({
        value: key,
        toString: () => t(meta.labelKey),
      })),
    [t]
  );

  return {
    kindOptions,
  };
};
