import { useMemo } from "react";
import { useLocation } from "react-router";
import { getQueryParamsAsObject } from "./helpers";

export const useDecodedLocation = () => {
  const { search, ...rest } = useLocation();
  const decodedSearch = useMemo(() => getQueryParamsAsObject(search), [search]);
  return { search: decodedSearch, ...rest };
};
