import { useLocation, useHistory } from "react-router-dom";
import { HubFilter, HubRequestParams } from "@app/api/models";
import {
  deserialzeRequestParamsForUI,
  serializeRequestParamsForUI,
} from "@app/utils/hub-request-utils";

// TODO break this up into separate hooks that use their own slice of the URL params and compose them,
//      similar to how useTableControlState combines the various state hooks
export const useTableControlUrlParams = () => {
  const location = useLocation();
  const history = useHistory();

  const urlParams = new URLSearchParams(location.search);
  const params = deserialzeRequestParamsForUI(urlParams);

  const setParams = (newParams: HubRequestParams) =>
    history.push({
      pathname: location.pathname,
      search: new URLSearchParams({
        ...Object.fromEntries(urlParams), // Don't remove any unrelated URL params we might have
        ...Object.fromEntries(serializeRequestParamsForUI(newParams)),
      }).toString(),
    });

  const setFilters = (filters: HubFilter[]) => {
    setParams({ ...params, filters });
  };

  const setSort = (sort: HubRequestParams["sort"]) => {
    setParams({ ...params, sort });
  };

  const setPagination = (page: HubRequestParams["page"]) => {
    setParams({ ...params, page });
  };

  return { params, setFilters, setSort, setPagination };
};
