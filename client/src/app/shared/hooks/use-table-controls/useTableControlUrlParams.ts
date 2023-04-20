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
  const location = useLocation();
  const history = useHistory();

  const urlParams = new URLSearchParams(location.search);

  const setParams = (newParams: HubRequestParams) =>
    history.push({
      pathname: location.pathname,
      search: new URLSearchParams({
        ...Object.fromEntries(urlParams), // Don't remove any unrelated URL params we might have
        ...Object.fromEntries(serializeRequestParamsForUI(newParams)),
      }).toString(),
    });

  let hubRequestParams = deserialzeRequestParamsForUI(urlParams);
  if (
    !hubRequestParams.filters &&
    !hubRequestParams.sort &&
    !hubRequestParams.page
  ) {
    hubRequestParams = defaultParams;
    setParams(defaultParams);
  }

  const setFilters = (filters: HubFilter[]) => {
    setParams({ ...hubRequestParams, filters });
  };

  const setSort = (sort: HubRequestParams["sort"]) => {
    setParams({ ...hubRequestParams, sort });
  };

  const setPagination = (page: HubRequestParams["page"]) => {
    setParams({ ...hubRequestParams, page });
  };

  return { hubRequestParams, setFilters, setSort, setPagination };
};
