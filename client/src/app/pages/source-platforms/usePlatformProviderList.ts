export const DEFAULT_PROVIDER = "cloud-foundry";

const PROVIDER_LIST = ["cloud-foundry"].sort();

export const usePlatformProviderList = (): { providers: string[] } => {
  return { providers: PROVIDER_LIST };
};
