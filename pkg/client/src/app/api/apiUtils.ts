import { AxiosPromise } from "axios";
import {
  Application,
  ApplicationDependency,
  ApplicationDependencyPage,
  ApplicationImport,
  ApplicationImportPage,
  ApplicationImportSummary,
  ApplicationImportSummaryPage,
  ApplicationPage,
  BusinessService,
  BusinessServicePage,
  Identity,
  JobFunction,
  JobFunctionPage,
  PageRepresentation,
  Stakeholder,
  StakeholderGroup,
  StakeholderGroupPage,
  StakeholderPage,
  TagType,
  TagTypePage,
} from "./models";
import {
  ApplicationSortBy,
  BusinessServiceSortBy,
  getApplicationDependencies,
  getApplications,
  getBusinessServices,
  getJobFunctions,
  getStakeholderGroups,
  getStakeholders,
  getTagTypes,
  JobFunctionSortBy,
  StakeholderGroupSortBy,
  StakeholderSortBy,
  TagTypeSortBy,
  TagTypeSortByQuery,
} from "./rest";

export const getAllBusinessServices = () => {
  return getBusinessServices(
    {},
    { page: 1, perPage: 1000 },
    { field: BusinessServiceSortBy.NAME }
  );
};

export const getAllStakeholders = () => {
  return getStakeholders(
    {},
    { page: 1, perPage: 1000 },
    { field: StakeholderSortBy.DISPLAY_NAME }
  );
};

export const getAllStakeholderGroups = () => {
  return getStakeholderGroups(
    {},
    { page: 1, perPage: 1000 },
    { field: StakeholderGroupSortBy.NAME }
  );
};

export const getAllJobFunctions = () => {
  return getJobFunctions(
    {},
    { page: 1, perPage: 1000 },
    { field: JobFunctionSortBy.ROLE }
  );
};

export const getAllTagTypes = (
  sortBy: TagTypeSortByQuery = { field: TagTypeSortBy.NAME }
) => {
  return getTagTypes({}, { page: 1, perPage: 1000 }, sortBy);
};

export const getAllApplications = () => {
  return getApplications(
    {},
    { page: 1, perPage: 1000 },
    { field: ApplicationSortBy.NAME }
  );
};

export const getAllApplicationDependencies = (filters: {
  from?: string[];
  to?: string[];
}) => {
  return getApplicationDependencies(filters, { page: 1, perPage: 1000 });
};

//

export const stakeholderPageMapper = (
  page: Array<any>
): PageRepresentation<Stakeholder> => ({
  meta: { count: 0 },
  data: page,
});

export const stakeholderGroupPageMapper = (
  page: Array<any>
): PageRepresentation<StakeholderGroup> => ({
  meta: { count: 0 },
  data: page,
});

export const bussinessServicePageMapper = (
  page: Array<any>
): PageRepresentation<BusinessService> => ({
  meta: { count: 0 },
  data: page,
});

export const jobFunctionPageMapper = (
  page: Array<any>
): PageRepresentation<JobFunction> => ({
  meta: { count: 0 },
  data: page,
});

export const tagTypePageMapper = (
  page: Array<any>
): PageRepresentation<TagType> => ({
  meta: { count: 0 },
  data: page,
});

//

export const applicationPageMapper = (
  page: Array<any>
): PageRepresentation<Application> => ({
  meta: { count: 0 },
  data: page,
});

export const applicationDependencyPageMapper = (
  page: Array<any>
): PageRepresentation<ApplicationDependency> => ({
  meta: { count: 0 },
  data: page,
});

export const applicationImportSummaryPageMapper = (
  page: Array<any>
): PageRepresentation<ApplicationImportSummary> => ({
  meta: { count: 0 },
  data: page,
});

export const applicationImportPageMapper = (
  page: Array<any>
): PageRepresentation<ApplicationImport> => ({
  meta: { count: 0 },
  data: page,
});

export const IdentityPageMapper = (
  page: Array<any>
): PageRepresentation<Identity> => ({
  meta: { count: 0 },
  data: page,
});

export const fetchAllPages = <T, P>(
  fetchPage: (page: number) => AxiosPromise<P>,
  responseToItems: (responseData: P) => T[],
  responseToTotalCount: (responseData: P) => number,
  page: number = 1,
  initialItems: T[] = []
): Promise<T[]> => {
  return fetchPage(page).then(({ data }) => {
    const accumulator = [...initialItems, ...responseToItems(data)];
    if (accumulator.length < responseToTotalCount(data)) {
      return fetchAllPages(
        fetchPage,
        responseToItems,
        responseToTotalCount,
        page + 1,
        accumulator
      );
    } else {
      return accumulator;
    }
  });
};
