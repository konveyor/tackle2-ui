/**
 * Helper functions for parameter conversion between Record and Array formats
 */

/**
 * Converts parameters from Record format to Array format
 */
export const parametersToArray = (
  params?: Record<string, unknown>
): Array<{ key: string; value: string }> => {
  if (!params) return [];
  return Object.entries(params).map(([key, value]) => ({
    key,
    value: String(value),
  }));
};

/**
 * Converts parameters from Array format to Record format
 */
export const arrayToParameters = (
  params: Array<{ key: string; value: string }> | undefined
): Record<string, string> => {
  if (!params) return {};

  return Object.fromEntries(params.map(({ key, value }) => [key, value]));
};
