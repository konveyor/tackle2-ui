export const DEFAULT_PROVIDER = "Helm";

const PROVIDER_LIST = ["Helm"].sort();

export const useGeneratorProviderList = (): string[] => {
  return PROVIDER_LIST;
};
