import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import { IdentityKind, IdentityKinds } from "@app/api/models";
import { OptionWithValue } from "@app/components/SimpleSelect";

const KIND_META: Map<IdentityKind, { label: string }> = new Map([
  ["source", { label: "identityKind.source" }],
  ["maven", { label: "identityKind.maven" }],
  ["proxy", { label: "identityKind.proxy" }],
  ["basic-auth", { label: "identityKind.basic-auth" }],
  ["bearer", { label: "identityKind.bearer" }],
]);

export const useIdentityKind = () => {
  const { t } = useTranslation();

  const kindOptions: OptionWithValue<IdentityKind>[] = useMemo(
    () =>
      Array.from(KIND_META.entries()).map(([key, meta]) => ({
        value: key,
        toString: () => t(meta.label),
      })),
    [t]
  );

  const kindLabels: Record<IdentityKind, string> = useMemo(
    () =>
      Object.fromEntries(
        IdentityKinds.map((key) => [key, t(KIND_META.get(key)?.label ?? key)])
      ) as Record<IdentityKind, string>,
    [t]
  );

  return {
    kindOptions,
    kindLabels,
  };
};
