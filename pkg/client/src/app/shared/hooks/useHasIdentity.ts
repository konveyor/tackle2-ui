import { Application } from "@app/api/models";
import { useFetchIdentities } from "@app/shared/hooks/useFetchIdentities";

interface IUseHasIdentity {
  hasIdentity: (application: Application, kind: string) => boolean;
  fetchIdentities: () => void;
}

export const useHasIdentity = (): IUseHasIdentity => {
  const { identities, fetchIdentities } = useFetchIdentities();

  const hasIdentity = (application: Application, kind: string) =>
    !!application.identities?.some((appIdentity) =>
      identities?.find(
        (identity) => appIdentity.id === identity.id && identity.kind === kind
      )
    );

  return { hasIdentity, fetchIdentities };
};
