import axios, { AxiosPromise } from "axios";
import { APIClient } from "@app/axios-config";

import {
  AnalysisDependency,
  BaseAnalysisRuleReport,
  AnalysisIssue,
  AnalysisAppReport,
  AnalysisFileReport,
  AnalysisIncident,
  Application,
  ApplicationAdoptionPlan,
  ApplicationDependency,
  ApplicationImport,
  ApplicationImportSummary,
  Assessment,
  AssessmentConfidence,
  AssessmentQuestionRisk,
  AssessmentRisk,
  BulkCopyAssessment,
  BulkCopyReview,
  BusinessService,
  Cache,
  HubPaginatedResult,
  HubRequestParams,
  Identity,
  IReadFile,
  Tracker,
  JobFunction,
  Proxy,
  Review,
  Ruleset,
  Setting,
  SettingTypes,
  Stakeholder,
  StakeholderGroup,
  Tag,
  TagCategory,
  Task,
  Taskgroup,
  MigrationWave,
  Ticket,
  New,
  Ref,
} from "./models";
import { QueryKey } from "@tanstack/react-query";
import { serializeRequestParamsForHub } from "@app/shared/hooks/table-controls";

// TACKLE_HUB
export const HUB = "/hub";

export const BUSINESS_SERVICES = HUB + "/businessservices";
export const STAKEHOLDERS = HUB + "/stakeholders";
export const STAKEHOLDER_GROUPS = HUB + "/stakeholdergroups";
export const JOB_FUNCTIONS = HUB + "/jobfunctions";
export const TAG_CATEGORIES = HUB + "/tagcategories";
export const TAGS = HUB + "/tags";
export const MIGRATION_WAVES = HUB + "/migrationwaves";

export const APPLICATIONS = HUB + "/applications";
export const APPLICATION_DEPENDENCY = HUB + "/dependencies";
export const REVIEWS = HUB + "/reviews";
export const REPORT = HUB + "/reports";
export const UPLOAD_FILE = HUB + "/importsummaries/upload";
export const APP_IMPORT_SUMMARY = HUB + "/importsummaries";
export const APP_IMPORT = HUB + "/imports";
export const APP_IMPORT_CSV = HUB + "/importsummaries/download";

export const IDENTITIES = HUB + "/identities";
export const PROXIES = HUB + "/proxies";
export const SETTINGS = HUB + "/settings";
export const TASKS = HUB + "/tasks";
export const TASKGROUPS = HUB + "/taskgroups";
export const TRACKERS = HUB + "/trackers";
export const TICKETS = HUB + "/tickets";

export const RULESETS = HUB + "/rulesets";
export const FILES = HUB + "/files";
export const CACHE = HUB + "/cache/m2";

export const ANALYSIS_DEPENDENCIES = HUB + "/analyses/dependencies";
export const ANALYSIS_REPORT_RULES = HUB + "/analyses/report/rules";
export const ANALYSIS_REPORT_APPS = HUB + "/analyses/report/applications";
export const ANALYSIS_REPORT_FILES = HUB + "/analyses/report/issues/:id/files";
export const ANALYSIS_ISSUES = HUB + "/analyses/issues";
export const ANALYSIS_ISSUE_INCIDENTS = HUB + "/analyses/issues/:id/incidents";

// PATHFINDER
export const PATHFINDER = "/hub/pathfinder";
export const ASSESSMENTS = PATHFINDER + "/assessments";

const jsonHeaders = { headers: { Accept: "application/json" } };
const formHeaders = { headers: { Accept: "multipart/form-data" } };
const fileHeaders = { headers: { Accept: "application/json" } };

type Direction = "asc" | "desc";

const buildQuery = (params: any) => {
  const query: string[] = [];

  Object.keys(params).forEach((key) => {
    const value = (params as any)[key];

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

  return query;
};

//Volumes
// poll clean task
export const getTaskById = ({
  queryKey,
}: {
  queryKey: QueryKey;
}): AxiosPromise<Task> => {
  const [_, processId] = queryKey;
  return axios.get<Task>(`${TASKS}/${processId}`);
};

// Business services

export const getBusinessServices = (): AxiosPromise<Array<BusinessService>> => {
  return APIClient.get(`${BUSINESS_SERVICES}`, jsonHeaders);
};

export const deleteBusinessService = (id: number | string): AxiosPromise => {
  return APIClient.delete(`${BUSINESS_SERVICES}/${id}`);
};

export const createBusinessService = (
  obj: New<BusinessService>
): AxiosPromise<BusinessService> => {
  return APIClient.post(`${BUSINESS_SERVICES}`, obj);
};

export const updateBusinessService = (
  obj: BusinessService
): AxiosPromise<BusinessService> => {
  return APIClient.put(`${BUSINESS_SERVICES}/${obj.id}`, obj);
};

export const getBusinessServiceById = (
  id: number | string
): AxiosPromise<BusinessService> => {
  return APIClient.get(`${BUSINESS_SERVICES}/${id}`);
};

// Job functions

export enum JobFunctionSortBy {
  NAME,
}

export interface JobFunctionSortByQuery {
  field: JobFunctionSortBy;
  direction?: Direction;
}

export const getJobFunctions = (): AxiosPromise<JobFunction[]> => {
  return APIClient.get(`${JOB_FUNCTIONS}`, jsonHeaders);
};

export const createJobFunction = (
  obj: JobFunction
): AxiosPromise<JobFunction> => {
  return APIClient.post(`${JOB_FUNCTIONS}`, obj);
};

export const updateJobFunction = (
  obj: JobFunction
): AxiosPromise<JobFunction> => {
  return APIClient.put(`${JOB_FUNCTIONS}/${obj.id}`, obj);
};

export const deleteJobFunction = (id: number): AxiosPromise => {
  return APIClient.delete(`${JOB_FUNCTIONS}/${id}`);
};

// App inventory

export const updateAllApplications = (
  updatePromises: Promise<Application>[]
) => {
  return Promise.all(updatePromises)
    .then((response) => {
      return response;
    })
    .catch((error) => {
      return error;
    });
};

export const getApplicationById = (
  id: number | string
): AxiosPromise<Application> => {
  return APIClient.get(`${APPLICATIONS}/${id}`);
};

//

export const getApplicationDependencies = (): AxiosPromise<
  ApplicationDependency[]
> => {
  return APIClient.get(`${APPLICATION_DEPENDENCY}`, jsonHeaders);
};

export const createApplicationDependency = (
  obj: ApplicationDependency
): AxiosPromise<ApplicationDependency> => {
  return APIClient.post(`${APPLICATION_DEPENDENCY}`, obj);
};

export const deleteApplicationDependency = (id: number): AxiosPromise => {
  return APIClient.delete(`${APPLICATION_DEPENDENCY}/${id}`);
};

//

export const getReviews = (): AxiosPromise<Review[]> => {
  return APIClient.get(`${REVIEWS}`);
};

export const getReviewId = (id: number | string): AxiosPromise<Review> => {
  return APIClient.get(`${REVIEWS}/${id}`);
};

export const createReview = (obj: Review): AxiosPromise<Review> => {
  return APIClient.post(`${REVIEWS}`, obj);
};

export const updateReview = (obj: Review): AxiosPromise<Review> => {
  return APIClient.put(`${REVIEWS}/${obj.id}`, obj);
};

export const deleteReview = (id: number): AxiosPromise => {
  return APIClient.delete(`${REVIEWS}/${id}`);
};

export const getApplicationAdoptionPlan = (
  applicationIds: number[]
): AxiosPromise<ApplicationAdoptionPlan[]> => {
  return APIClient.post(
    `${REPORT}/adoptionplan`,
    applicationIds.map((f) => ({
      applicationId: f,
    }))
  );
};

export const getApplicationSummaryCSV = (id: string): AxiosPromise => {
  return APIClient.get(`${APP_IMPORT_CSV}?importSummaryId=${id}`, {
    responseType: "arraybuffer",
    headers: { Accept: "text/csv", responseType: "blob" },
  });
};

//

export const getAssessments = (filters: {
  applicationId?: number | string;
}): AxiosPromise<Assessment[]> => {
  const params = {
    applicationId: filters.applicationId,
  };

  const query: string[] = buildQuery(params);
  return APIClient.get(`${ASSESSMENTS}?${query.join("&")}`);
};

export const createAssessment = (obj: Assessment): AxiosPromise<Assessment> => {
  return APIClient.post(`${ASSESSMENTS}`, obj);
};

export const patchAssessment = (obj: Assessment): AxiosPromise<Assessment> => {
  return APIClient.patch(`${ASSESSMENTS}/${obj.id}`, obj);
};

export const getAssessmentById = (
  id: number | string
): AxiosPromise<Assessment> => {
  return APIClient.get(`${ASSESSMENTS}/${id}`);
};

export const deleteAssessment = (id: number): AxiosPromise => {
  return APIClient.delete(`${ASSESSMENTS}/${id}`);
};

export const getAssessmentLandscape = (
  applicationIds: number[]
): AxiosPromise<AssessmentRisk[]> => {
  return APIClient.post(
    `${ASSESSMENTS}/assessment-risk`,
    applicationIds.map((f) => ({ applicationId: f }))
  );
};

export const getAssessmentIdentifiedRisks = (
  applicationIds: number[]
): AxiosPromise<AssessmentQuestionRisk[]> => {
  return APIClient.post(
    `${ASSESSMENTS}/risks`,
    applicationIds.map((f) => ({ applicationId: f }))
  );
};

export const getAssessmentConfidence = (
  applicationIds: number[]
): AxiosPromise<AssessmentConfidence[]> => {
  return APIClient.post(
    `${ASSESSMENTS}/confidence`,
    applicationIds.map((f) => ({ applicationId: f }))
  );
};

export const createBulkCopyAssessment = (
  bulk: BulkCopyAssessment
): AxiosPromise<BulkCopyAssessment> => {
  return APIClient.post<BulkCopyAssessment>(`${ASSESSMENTS}/bulk`, bulk);
};

export const getBulkCopyAssessment = ({
  queryKey,
}: {
  queryKey: QueryKey;
}): AxiosPromise<BulkCopyAssessment> => {
  const [_, id] = queryKey;
  return APIClient.get<BulkCopyAssessment>(`${ASSESSMENTS}/bulk/${id}`);
};

export const createBulkCopyReview = (
  bulk: BulkCopyReview
): AxiosPromise<BulkCopyReview> => {
  return APIClient.post<BulkCopyReview>(`${REVIEWS}/copy`, bulk);
};

export const getIdentities = (): AxiosPromise<Array<Identity>> => {
  return APIClient.get(`${IDENTITIES}`, jsonHeaders);
};

export const createIdentity = (obj: Identity): AxiosPromise<Identity> => {
  return APIClient.post(`${IDENTITIES}`, obj);
};

export const updateIdentity = (obj: Identity): AxiosPromise<Identity> => {
  return APIClient.put(`${IDENTITIES}/${obj.id}`, obj);
};

export const deleteIdentity = (id: number): AxiosPromise => {
  return APIClient.delete(`${IDENTITIES}/${id}`);
};

export const getProxies = (): AxiosPromise<Array<Proxy>> => {
  return APIClient.get(`${PROXIES}`, jsonHeaders);
};

export const createProxy = (obj: Proxy): AxiosPromise<Proxy> => {
  return APIClient.post(`${PROXIES}`, obj);
};

export const updateProxy = (obj: Proxy): AxiosPromise<Proxy> => {
  return APIClient.put(`${PROXIES}/${obj.id}`, obj);
};

export const deleteProxy = (id: number): AxiosPromise => {
  return APIClient.delete(`${PROXIES}/${id}`);
};

// Axios direct

export const createApplication = (obj: Application): Promise<Application> =>
  axios.post(`${APPLICATIONS}`, obj);

export const deleteApplication = (id: number): Promise<Application> =>
  axios.delete(`${APPLICATIONS}/${id}`);

export const deleteBulkApplications = (ids: number[]): Promise<Application[]> =>
  axios.delete(APPLICATIONS, { data: ids });

export const getApplications = (): Promise<Application[]> =>
  axios.get(APPLICATIONS).then((response) => response.data);

export const updateApplication = (obj: Application): Promise<Application> =>
  axios.put(`${APPLICATIONS}/${obj.id}`, obj);

export const getApplicationsImportSummary = (): Promise<
  ApplicationImportSummary[]
> => axios.get(APP_IMPORT_SUMMARY).then((response) => response.data);

export const getApplicationImportSummaryById = (
  id: number | string
): Promise<ApplicationImportSummary> =>
  axios.get(`${APP_IMPORT_SUMMARY}/${id}`).then((response) => response.data);

export const deleteApplicationImportSummary = (
  id: number
): Promise<ApplicationImportSummary> =>
  axios.delete(`${APP_IMPORT_SUMMARY}/${id}`);

export const getApplicationImports = (
  importSummaryID: number,
  isValid: boolean | string
): Promise<ApplicationImport[]> =>
  axios
    .get(`${APP_IMPORT}?importSummary.id=${importSummaryID}&isValid=${isValid}`)
    .then((response) => response.data);

export const getTasks = () =>
  axios.get<Task[]>(TASKS).then((response) => response.data);

export const deleteTask = (id: number) => axios.delete<Task>(`${TASKS}/${id}`);

export const cancelTask = (id: number) =>
  axios.put<Task>(`${TASKS}/${id}/cancel`);

export const createTaskgroup = (obj: Taskgroup) =>
  axios.post<Taskgroup>(TASKGROUPS, obj).then((response) => response.data);

export const submitTaskgroup = (obj: Taskgroup) =>
  axios
    .put<Taskgroup>(`${TASKGROUPS}/${obj.id}/submit`, obj)
    .then((response) => response.data);

export const deleteTaskgroup = (id: number): AxiosPromise =>
  axios.delete(`${TASKGROUPS}/${id}`);

export const uploadFileTaskgroup = ({
  id,
  path,
  formData,
  file,
}: {
  id: number;
  path: string;
  formData: any;
  file: any;
}) => {
  return axios.post<Taskgroup>(
    `${TASKGROUPS}/${id}/bucket/${path}`,
    formData,
    formHeaders
  );
};

export const removeFileTaskgroup = ({
  id,
  path,
}: {
  id: number;
  path: string;
}) => {
  return axios.delete<Taskgroup>(`${TASKGROUPS}/${id}/bucket/${path}`);
};

export const getMigrationWaves = (): Promise<MigrationWave[]> =>
  axios.get(MIGRATION_WAVES).then((response) => response.data);

export const createMigrationWave = (
  obj: New<MigrationWave>
): Promise<MigrationWave> => axios.post(MIGRATION_WAVES, obj);

export const deleteMigrationWave = (id: number): Promise<MigrationWave> =>
  axios.delete(`${MIGRATION_WAVES}/${id}`);

export const updateMigrationWave = (
  obj: MigrationWave
): Promise<MigrationWave> => axios.put(`${MIGRATION_WAVES}/${obj.id}`, obj);

export const deleteAllMigrationWaves = (
  deletePromises: Promise<MigrationWave>[]
) => {
  return Promise.all(deletePromises)
    .then((response) => response)
    .catch((error) => error);
};

export const updateRuleset = (obj: Ruleset) =>
  axios.put(`${RULESETS}/${obj.id}`, obj);

export const createRuleset = (obj: Ruleset) =>
  axios.post<Ruleset>(RULESETS, obj);

export const deleteRuleset = (id: number) => axios.delete(`${RULESETS}/${id}`);

export const getRulesets = () =>
  axios.get<[]>(RULESETS).then((response) => response.data);

export const getFileByID = (id: number) =>
  axios.get<Ruleset[]>(FILES).then((response) => response.data);

export const createFile = ({
  formData,
  file,
}: {
  formData: FormData;
  file: IReadFile;
}) =>
  axios
    .post<Ruleset>(`${FILES}/${file.fileName}`, formData, fileHeaders)
    .then((response) => {
      return response.data;
    });

export const getSettingById = <K extends keyof SettingTypes>(
  id: K
): Promise<SettingTypes[K]> =>
  axios.get(`${SETTINGS}/${id}`).then((response) => response.data);

export const updateSetting = <K extends keyof SettingTypes>(
  obj: Setting<K>
): Promise<Setting<K>> =>
  axios.put(
    `${SETTINGS}/${obj.key}`,
    typeof obj.value == "boolean" ? obj.value.toString() : obj.value
  );

export const getCache = (): Promise<Cache> =>
  axios.get(CACHE).then((response) => response.data);

export const deleteCache = (): Promise<Cache> => axios.delete(CACHE);

// Trackers

export const getTrackers = (): Promise<Tracker[]> =>
  axios.get(TRACKERS).then((response) => response.data);

export const createTracker = (obj: Tracker): Promise<Tracker> =>
  axios.post(TRACKERS, obj);

export const updateTracker = (obj: Tracker): Promise<Tracker> =>
  axios.put(`${TRACKERS}/${obj.id}`, obj);

export const deleteTracker = (id: number): Promise<Tracker> =>
  axios.delete(`${TRACKERS}/${id}`);

// Issues and Dependencies

export const getHubPaginatedResult = <T>(
  url: string,
  params: HubRequestParams = {}
): Promise<HubPaginatedResult<T>> =>
  axios
    .get<T[]>(url, {
      params: serializeRequestParamsForHub(params),
    })
    .then(({ data, headers }) => ({
      data,
      total: headers["x-total"] ? parseInt(headers["x-total"], 10) : 0,
      params,
    }));

export const getRuleReports = (params: HubRequestParams = {}) =>
  getHubPaginatedResult<BaseAnalysisRuleReport>(ANALYSIS_REPORT_RULES, params);

export const getAppReports = (params: HubRequestParams = {}) =>
  getHubPaginatedResult<AnalysisAppReport>(ANALYSIS_REPORT_APPS, params);

export const getIssues = (params: HubRequestParams = {}) =>
  getHubPaginatedResult<AnalysisIssue>(ANALYSIS_ISSUES, params);

export const getFileReports = (
  issueId?: number,
  params: HubRequestParams = {}
) =>
  issueId
    ? getHubPaginatedResult<AnalysisFileReport>(
        ANALYSIS_REPORT_FILES.replace("/:id/", `/${String(issueId)}/`),
        params
      )
    : Promise.reject();

export const getIncidents = (issueId?: number, params: HubRequestParams = {}) =>
  issueId
    ? getHubPaginatedResult<AnalysisIncident>(
        ANALYSIS_ISSUE_INCIDENTS.replace("/:id/", `/${String(issueId)}/`),
        params
      )
    : Promise.reject();

export const getDependencies = (params: HubRequestParams = {}) =>
  getHubPaginatedResult<AnalysisDependency>(ANALYSIS_DEPENDENCIES, params);

// Tickets
export const createTickets = (payload: New<Ticket>, applications: Ref[]) => {
  const promises: AxiosPromise[] = [];

  applications.map((app) => {
    const appPayload: New<Ticket> = {
      ...payload,
      application: { id: app.id, name: app.name },
    };
    return [...promises, axios.post(TICKETS, appPayload)];
  });
  return Promise.all<AxiosPromise<Ticket>>(promises);
};

export const getTickets = (): Promise<Ticket[]> =>
  axios.get(TICKETS).then((response) => response.data);

export const deleteTicket = (id: number): Promise<Ticket> =>
  axios.delete(`${TICKETS}/${id}`);

// Stakeholders

export const getStakeholders = (): Promise<Stakeholder[]> =>
  axios.get(STAKEHOLDERS).then((response) => response.data);

export const deleteStakeholder = (id: number): Promise<Stakeholder> =>
  axios.delete(`${STAKEHOLDERS}/${id}`);

export const createStakeholder = (
  obj: New<Stakeholder>
): Promise<Stakeholder> => axios.post(STAKEHOLDERS, obj);

export const updateStakeholder = (obj: Stakeholder): Promise<Stakeholder> =>
  axios.put(`${STAKEHOLDERS}/${obj.id}`, obj);

// Stakeholder groups

export enum StakeholderGroupSortBy {
  NAME,
  STAKEHOLDERS_COUNT,
}

export const getStakeholderGroups = (): Promise<StakeholderGroup[]> =>
  axios.get(STAKEHOLDER_GROUPS).then((response) => response.data);

export const deleteStakeholderGroup = (id: number): Promise<StakeholderGroup> =>
  axios.delete(`${STAKEHOLDER_GROUPS}/${id}`);

export const createStakeholderGroup = (
  obj: New<StakeholderGroup>
): Promise<StakeholderGroup> => axios.post(STAKEHOLDER_GROUPS, obj);

export const updateStakeholderGroup = (
  obj: StakeholderGroup
): Promise<StakeholderGroup> =>
  axios.put(`${STAKEHOLDER_GROUPS}/${obj.id}`, obj);

// Tags

export const getTags = (): Promise<Tag[]> =>
  axios.get(TAGS).then((response) => response.data);

export const getTagById = (id: number | string): Promise<Tag> =>
  axios.get(`${TAGS}/${id}`).then((response) => response.data);

export const createTag = (obj: New<Tag>): Promise<Tag> => axios.post(TAGS, obj);

export const deleteTag = (id: number): Promise<Tag> =>
  axios.delete(`${TAGS}/${id}`);

export const updateTag = (obj: Tag): Promise<Tag> =>
  axios.put(`${TAGS}/${obj.id}`, obj);

// Tag categories

export const getTagCategories = (): Promise<Array<TagCategory>> =>
  axios.get(TAG_CATEGORIES).then((response) => response.data);

export const getTagCategoryById = (id: number): Promise<TagCategory> =>
  axios.get(`${TAG_CATEGORIES}/${id}`).then((response) => response.data);

export const deleteTagCategory = (id: number): Promise<TagCategory> =>
  axios.delete(`${TAG_CATEGORIES}/${id}`);

export const createTagCategory = (
  obj: New<TagCategory>
): Promise<TagCategory> => axios.post(TAG_CATEGORIES, obj);

export const updateTagCategory = (obj: TagCategory): Promise<TagCategory> =>
  axios.put(`${TAG_CATEGORIES}/${obj.id}`, obj);
