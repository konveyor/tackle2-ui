import { useMemo } from "react";

import type { Application, Identity } from "@app/api/models";
import { useFetchIdentities } from "@app/queries/identities";

/**
 * Where the credential an agent run will push with comes from.
 *
 * Mirrors the harness's two lookups exactly (`FetchGitCreds` in
 * konveyor/agentic-controller `harness/internal/hub/client.go`, which calls
 * the Hub binding's `Identity.Search().Direct("source").Indirect("source")`):
 *
 * - `application` — the Hub `ApplicationIdentity` link whose **role** is
 *   `source` (the binding's `Direct`, a filter on the app's identity list).
 * - `default` — failing that, the global identity whose **kind** is `source`
 *   and whose `default` flag is set (the binding's `Indirect`).
 *
 * Note the asymmetry: the direct lookup matches on the link's role, the
 * indirect one on the credential's kind plus `Default=1`. A `source`
 * credential that is neither linked to the application nor marked default
 * resolves to nothing, and the run pushes anonymously.
 */
export type SourceCredentialOrigin = "application" | "default";

export interface ResolvedSourceCredential {
  /** Credential name, as shown in Administration &gt; Credentials. */
  name: string;
  id: number;
  origin: SourceCredentialOrigin;
}

export interface SourceCredentialResolution {
  /** The credential the run will actually push with, when one resolves. */
  resolved?: ResolvedSourceCredential;
  /**
   * `source` credentials the Hub holds that this application will not use:
   * neither linked to it nor marked as the global default. Only populated
   * when nothing resolved — they are what the creator most likely meant to
   * attach, and naming them turns the fix into one click.
   */
  candidates: Identity[];
  /**
   * True while the answer is not knowable — the identity list has not
   * loaded, the request failed (a reader without credential access gets
   * nothing back), or no application is selected yet. Callers should stay
   * silent rather than claim a credential is missing.
   */
  isUnknown: boolean;
}

/**
 * Resolve the credential an agent run against `application` will push with,
 * from the full Hub identity list. Pure; see {@link SourceCredentialOrigin}
 * for why these two lookups and no others.
 */
export function resolveSourceCredential(
  application: Pick<Application, "identities">,
  identities: Identity[]
): Omit<SourceCredentialResolution, "isUnknown"> {
  const direct = application.identities?.find((i) => i.role === "source");
  if (direct) {
    return {
      resolved: { name: direct.name, id: direct.id, origin: "application" },
      candidates: [],
    };
  }

  const indirect = identities.find((i) => i.kind === "source" && i.default);
  if (indirect) {
    return {
      resolved: { name: indirect.name, id: indirect.id, origin: "default" },
      candidates: [],
    };
  }

  // Nothing resolves. Offer the `source` credentials that exist but are not
  // linked to this application at all — a credential linked under another
  // role is a different (and much rarer) mistake, and calling it "not
  // attached" would be wrong, so it is left out.
  const linked = new Set((application.identities ?? []).map((i) => i.id));
  return {
    candidates: identities.filter(
      (i) => i.kind === "source" && !linked.has(i.id)
    ),
  };
}

/**
 * The credential an agent run against `application` will push with, resolved
 * the same two ways the harness resolves it. Pass `undefined` before an
 * application is chosen; the identity list is then not fetched.
 */
export const useEffectiveSourceCredential = (
  application?: Pick<Application, "identities">
): SourceCredentialResolution => {
  const { identities, isSuccess } = useFetchIdentities(false, !!application);

  return useMemo(() => {
    if (!application) return { candidates: [], isUnknown: true };
    // Until the list loads, only a directly-linked credential is knowable —
    // it rides along on the application itself.
    const resolution = resolveSourceCredential(
      application,
      isSuccess ? identities : []
    );
    return { ...resolution, isUnknown: !resolution.resolved && !isSuccess };
  }, [application, identities, isSuccess]);
};
