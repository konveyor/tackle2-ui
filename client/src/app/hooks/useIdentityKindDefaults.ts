import { useMemo } from "react";
import { mapValues } from "radash";

import { Identity, IdentityKind } from "@app/api/models";
import { useFetchIdentities } from "@app/queries/identities";

const DEFAULT_BY_KIND = {
  source: undefined,
  maven: undefined,
  proxy: undefined,
  "basic-auth": undefined,
  bearer: undefined,
};

export const useIdentityKindDefaults = (identities?: Identity[]) => {
  const { identities: allIdentities } = useFetchIdentities(
    false,
    identities === undefined
  );

  const defaultIdentities: Record<IdentityKind, Identity | undefined> = useMemo(
    () =>
      mapValues(DEFAULT_BY_KIND, (_, kind) =>
        (identities ?? allIdentities).find((i) => i.default && i.kind === kind)
      ),
    [allIdentities, identities]
  );

  return { defaultIdentities };
};
