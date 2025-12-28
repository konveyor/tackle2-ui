export const DEFAULT_PROVIDER = "Java";

const PROVIDER_LIST = ["Java", "Golang", "TypeScript", "Python", "C#"].sort();

/**
 * Provides the list of migration provider names that can be used for custom targets. These names
 * do not need to match any other names, they are not used in hub. This list is just for UI
 * filtering and sorting.
 */
export const useMigrationProviderList = (): string[] => {
  return PROVIDER_LIST;
};
