import { useLocation, useHistory } from "react-router-dom";
import { HubFilter, HubRequestParams } from "@app/api/models";
import {
  deserialzeRequestParamsForUI,
  serializeRequestParamsForUI,
} from "@app/utils/hub-request-utils";

export interface TableControlUrlParamsArgs {
  defaultParams?: HubRequestParams;
}

// TODO break this up into separate hooks that use their own slice of the URL params and compose them,
//      similar to how useTableControlState combines the various state hooks
export const useTableControlUrlParams = ({
  defaultParams = { page: { pageNum: 1, itemsPerPage: 10 } },
}: TableControlUrlParamsArgs) => {
  const history = useHistory();

  const setParams = (newParams: HubRequestParams) => {
    // In case setParams is called multiple times synchronously from the same rendered instance,
    // we use document.location here as the current params so these calls never overwrite each other.
    // This also retains any unrelated params that might be present and allows newParams to be a partial update.
    const { pathname, search } = document.location;
    history.replace({
      pathname,
      search: new URLSearchParams({
        ...Object.fromEntries(new URLSearchParams(search)),
        ...Object.fromEntries(serializeRequestParamsForUI(newParams)),
      }).toString(),
    });
  };

  // We use useLocation here so we are re-rendering when the params change
  const urlParams = new URLSearchParams(useLocation().search);
  let hubRequestParams = deserialzeRequestParamsForUI(urlParams);
  if (
    !hubRequestParams.filters &&
    !hubRequestParams.sort &&
    !hubRequestParams.page
  ) {
    hubRequestParams = defaultParams;
    setParams(defaultParams);
  }

  const setFilters = (filters: HubFilter[]) => setParams({ filters });
  const setSort = (sort: HubRequestParams["sort"]) => setParams({ sort });
  const setPagination = (page: HubRequestParams["page"]) => setParams({ page });

  return { hubRequestParams, setFilters, setSort, setPagination };
};
