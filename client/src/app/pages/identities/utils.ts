import { mapValues } from "radash";

import { ITypeOptions, Identity, IdentityKind } from "@app/api/models";
import { OptionWithValue } from "@app/components/SimpleSelect";

export const KIND_STRINGS: Record<IdentityKind, string> = {
  source: "Source Control",
  maven: "Maven Settings File",
  proxy: "Proxy",
  "basic-auth": "Basic Auth (Jira)",
  bearer: "Bearer Token (Jira)",
};

export const KIND_OPTIONS: OptionWithValue<IdentityKind>[] = Object.entries(
  KIND_STRINGS
).map(([kind, str]) => ({ value: kind as IdentityKind, toString: () => str }));

export const KIND_VALUES: ITypeOptions[] = Object.entries(KIND_STRINGS).map(
  ([kind, str]) => ({ key: kind, value: str })
);

export const lookupDefaults = (
  identities: Identity[]
): Record<IdentityKind, Identity | undefined> => {
  const df = {
    source: undefined,
    maven: undefined,
    proxy: undefined,
    "basic-auth": undefined,
    bearer: undefined,
  };
  return mapValues(df, (_, kind) =>
    identities.find((i) => i.default && i.kind === kind)
  );
};
