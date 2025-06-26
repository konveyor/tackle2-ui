export const DEFAULT_PROVIDER = "AWS";

const PROVIDER_LIST = ["AWS", "K8S", "AZURE", "GCP"].sort();

export const usePlatformProviderList = (): string[] => {
  return PROVIDER_LIST;
};
