export const DEFAULT_PROVIDER = "Helm";

const PROVIDER_LIST = [DEFAULT_PROVIDER].sort();

export const useGeneratorProviderList = (): string[] => {
  return PROVIDER_LIST;
};
