export const DEFAULT_KIND = "cloudfoundry";

const KIND_LIST = [DEFAULT_KIND]; // Add more provider kinds here, or use a list from the API

export const usePlatformKindList = (): { kinds: string[] } => {
  return { kinds: KIND_LIST };
};
