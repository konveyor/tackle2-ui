export const getQueryParamsAsObject = (search: string) => {
  const params: Record<string, string[]> = {};
  new URLSearchParams(search).forEach((value, key) => {
    const currentValue = params[key] || [];
    params[key] = [...currentValue, value];
  });
  return params;
};

export const removeUndefined = <T extends Record<string, any>>(obj: T) =>
  Object.keys(obj)
    .filter((key) => obj[key] !== undefined)
    .reduce((acc, key) => {
      return {
        ...acc,
        [key]: obj[key],
      };
    }, {} as Record<string, any>);

export const objectToQueryParams = (
  params: Record<string, string | string[]>
) => {
  const query: string[] = [];

  Object.keys(params).forEach((key) => {
    const value = params[key];

    if (value !== undefined && value !== null) {
      let queryParamValues: string[] = [];
      if (Array.isArray(value)) {
        queryParamValues = value;
      } else {
        queryParamValues = [value];
      }
      queryParamValues.forEach((v) => query.push(`${key}=${v}`));
    }
  });

  return "?" + query.join("&");
};

export const encodeValues = (obj: Record<string, string[]>) =>
  Object.keys(removeUndefined(obj)).reduce((acc, key) => {
    return {
      ...acc,
      [key]: obj[key] && obj[key].map((f) => encodeURIComponent(f)),
    };
  }, {} as Record<string, string[]>);
