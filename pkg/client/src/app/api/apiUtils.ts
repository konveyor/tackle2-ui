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
  Ref,
  Stakeholder,
  StakeholderGroup,
  StakeholderGroupPage,
  StakeholderPage,
  TagType,
  TagTypePage,
} from "./models";
import {
  getApplicationDependencies,
  getApplications,
  getBusinessServices,
  getJobFunctions,
  getStakeholderGroups,
  getStakeholders,
  getTagTypes,
  JobFunctionSortBy,
} from "./rest";

export const getAllBusinessServices = () => {
  return getBusinessServices();
};

export const getAllApplications = () => {
  return getApplications();
};

export const getAllApplicationDependencies = (filters: {
  from?: string[];
  to?: string[];
}) => {
  return getApplicationDependencies(filters, { page: 1, perPage: 1000 });
};

//

export const stakeholderPageMapper = (
  page: StakeholderPage
): PageRepresentation<Stakeholder> => ({
  meta: { count: page.total_count },
  data: page._embedded.stakeholder,
});

export const stakeholderGroupPageMapper = (
  page: StakeholderGroupPage
): PageRepresentation<StakeholderGroup> => ({
  meta: { count: page.total_count },
  data: page._embedded["stakeholder-group"],
});

export const bussinessServicePageMapper = (
  page: BusinessServicePage
): PageRepresentation<BusinessService> => ({
  meta: { count: page.total_count },
  data: page._embedded["business-service"],
});

export const tagTypePageMapper = (
  page: TagTypePage
): PageRepresentation<TagType> => ({
  meta: { count: page.total_count },
  data: page._embedded["tag-type"],
});

//

export const applicationPageMapper = (
  page: ApplicationPage
): PageRepresentation<Application> => ({
  meta: { count: page?.total_count },
  data: page._embedded?.application,
});

export const applicationDependencyPageMapper = (
  page: ApplicationDependencyPage
): PageRepresentation<ApplicationDependency> => ({
  meta: { count: page.total_count },
  data: page._embedded["applications-dependency"],
});

export const applicationImportSummaryPageMapper = (
  page: ApplicationImportSummaryPage
): PageRepresentation<ApplicationImportSummary> => ({
  meta: { count: page.total_count },
  data: page._embedded["import-summary"],
});

export const applicationImportPageMapper = (
  page: ApplicationImportPage
): PageRepresentation<ApplicationImport> => ({
  meta: { count: page.total_count },
  data: page._embedded["application-import"],
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
