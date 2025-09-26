import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import { IdentityKind, IdentityKinds } from "@app/api/models";
import { OptionWithValue } from "@app/components/SimpleSelect";

const KIND_META: Map<IdentityKind, { labelKey: string }> = new Map([
  ["source", { labelKey: "identityKind.source" }],
  ["maven", { labelKey: "identityKind.maven" }],
  ["proxy", { labelKey: "identityKind.proxy" }],
  ["basic-auth", { labelKey: "identityKind.basic-auth" }],
  ["bearer", { labelKey: "identityKind.bearer" }],
]);

export const useIdentityKind = () => {
  const { t } = useTranslation();

  const kindOptions: OptionWithValue<IdentityKind>[] = useMemo(
    () =>
      Array.from(KIND_META.entries()).map(([key, meta]) => ({
        value: key,
        toString: () => t(meta.labelKey),
      })),
    [t]
  );

  const kindFilterOptions = useMemo(
    () =>
      Array.from(KIND_META.entries()).map(([key, meta]) => ({
        value: key,
        label: t(meta.labelKey),
      })),
    [t]
  );

  const kindLabels: Record<IdentityKind, string> = useMemo(
    () =>
      Object.fromEntries(
        IdentityKinds.map((key) => [
          key,
          t(KIND_META.get(key)?.labelKey ?? key),
        ])
      ) as Record<IdentityKind, string>,
    [t]
  );

  return {
    kindOptions,
    kindFilterOptions,
    kindLabels,
  };
};
