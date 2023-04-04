import axios, { AxiosPromise } from "axios";
import { APIClient } from "@app/axios-config";

import {
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
  Identity,
  IReadFile,
  JiraTracker,
  JobFunction,
  Proxy,
  Review,
  RuleBundle,
  Setting,
  SettingTypes,
  Stakeholder,
  StakeholderGroup,
  Tag,
  TagCategory,
  Task,
  Taskgroup,
} from "./models";
import { QueryKey } from "@tanstack/react-query";

// TACKLE_HUB
export const HUB = "/hub";

export const BUSINESS_SERVICES = HUB + "/businessservices";
export const STAKEHOLDERS = HUB + "/stakeholders";
export const STAKEHOLDER_GROUPS = HUB + "/stakeholdergroups";
export const JOB_FUNCTIONS = HUB + "/jobfunctions";
export const TAG_CATEGORIES = HUB + "/tagcategories";
export const TAGS = HUB + "/tags";

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
export const JIRATRACKERS = HUB + "/trackers";

export const RULEBUNDLES = HUB + "/rulebundles";
export const FILES = HUB + "/files";
export const CACHE = HUB + "/cache/m2";

// PATHFINDER
export const PATHFINDER = "/hub/pathfinder";
export const ASSESSMENTS = PATHFINDER + "/assessments";

const jsonHeaders = { headers: { Accept: "application/json" } };
const formHeaders = { headers: { Accept: "multipart/form-data" } };
const fileHeaders = { headers: { Accept: "application/octet-stream" } };

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
  obj: BusinessService
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

// Stakeholders

export const getStakeholders = (): AxiosPromise<Array<Stakeholder>> => {
  return APIClient.get(`${STAKEHOLDERS}`, jsonHeaders);
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

export const deleteStakeholder = (id: number): AxiosPromise => {
  return APIClient.delete(`${STAKEHOLDERS}/${id}`);
};

export const createStakeholder = (
  obj: Stakeholder
): AxiosPromise<Stakeholder> => {
  return APIClient.post(`${STAKEHOLDERS}`, obj);
};

export const updateStakeholder = (
  obj: Stakeholder
): AxiosPromise<Stakeholder> => {
  return APIClient.put(`${STAKEHOLDERS}/${obj.id}`, obj);
};

// Stakeholder groups

export enum StakeholderGroupSortBy {
  NAME,
  STAKEHOLDERS_COUNT,
}

export const getStakeholderGroups = (): AxiosPromise<
  Array<StakeholderGroup>
> => {
  return APIClient.get(`${STAKEHOLDER_GROUPS}`, jsonHeaders);
};

export const deleteStakeholderGroup = (id: number): AxiosPromise => {
  return APIClient.delete(`${STAKEHOLDER_GROUPS}/${id}`);
};

export const createStakeholderGroup = (
  obj: StakeholderGroup
): AxiosPromise<StakeholderGroup> => {
  return APIClient.post(`${STAKEHOLDER_GROUPS}`, obj);
};

export const updateStakeholderGroup = (
  obj: StakeholderGroup
): AxiosPromise<StakeholderGroup> => {
  return APIClient.put(`${STAKEHOLDER_GROUPS}/${obj.id}`, obj);
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

// Tag categories

export const getTagCategories = (): AxiosPromise<Array<TagCategory>> => {
  return APIClient.get(`${TAG_CATEGORIES}`, jsonHeaders);
};

export const deleteTagCategory = (id: number): AxiosPromise => {
  return APIClient.delete(`${TAG_CATEGORIES}/${id}`);
};

export const createTagCategory = (
  obj: TagCategory
): AxiosPromise<TagCategory> => {
  return APIClient.post(`${TAG_CATEGORIES}`, obj);
};

export const updateTagCategory = (
  obj: TagCategory
): AxiosPromise<TagCategory> => {
  return APIClient.put(`${TAG_CATEGORIES}/${obj.id}`, obj);
};

export const getTagCategoryById = (id: number): AxiosPromise<TagCategory> => {
  return APIClient.get(`${TAG_CATEGORIES}/${id}`);
};

export const deleteTag = (id: number): AxiosPromise => {
  return APIClient.delete(`${TAGS}/${id}`);
};

export const createTag = (obj: Tag): AxiosPromise<Tag> => {
  return APIClient.post(`${TAGS}`, obj);
};

export const updateTag = (obj: Tag): AxiosPromise<Tag> => {
  return APIClient.put(`${TAGS}/${obj.id}`, obj);
};

export const getTagById = (id: number | string): AxiosPromise<Tag> => {
  return APIClient.get(`${TAGS}/${id}`);
};

export const getTags = (): AxiosPromise<Tag[]> => {
  return APIClient.get(`${TAGS}`, jsonHeaders);
};

// App inventory

export const getApplications = (): AxiosPromise<Array<Application>> => {
  return APIClient.get(`${APPLICATIONS}`, jsonHeaders);
};

export const deleteApplication = (id: number): AxiosPromise => {
  return APIClient.delete(`${APPLICATIONS}/${id}`);
};

export const createApplication = (
  obj: Application
): AxiosPromise<Application> => {
  return APIClient.post(`${APPLICATIONS}`, obj);
};

export const updateApplication = (
  obj: Application
): AxiosPromise<Application> => {
  return APIClient.put(`${APPLICATIONS}/${obj.id}`, obj);
};

export const updateAllApplications = (
  updatePromises: AxiosPromise<Application>[]
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

export const getApplicationsQuery = () =>
  axios.get<Application[]>(APPLICATIONS).then((response) => response.data);

export const deleteBulkApplicationsQuery = (ids: number[]) =>
  axios.delete(APPLICATIONS, { data: ids });

export const getApplicationsImportSummary = () =>
  axios
    .get<ApplicationImportSummary[]>(APP_IMPORT_SUMMARY)
    .then((response) => response.data);

export const getApplicationImportSummaryById = (id: number | string) =>
  axios
    .get<ApplicationImportSummary>(`${APP_IMPORT_SUMMARY}/${id}`)
    .then((response) => response.data);

export const deleteApplicationImportSummary = (id: number) =>
  axios.delete<APIClient>(`${APP_IMPORT_SUMMARY}/${id}`);

export const getApplicationImports = (
  importSummaryID: number,
  isValid: boolean | string
) =>
  axios
    .get<ApplicationImport[]>(
      `${APP_IMPORT}?importSummary.id=${importSummaryID}&isValid=${isValid}`
    )
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
  return axios.delete<Taskgroup>(
    `${TASKGROUPS}/${id}/bucket/${path}`
    // formHeaders
  );
};

export const updateRuleBundle = (obj: RuleBundle) =>
  axios.put(`${RULEBUNDLES}/${obj.id}`, obj);

export const createRuleBundle = (obj: RuleBundle) =>
  axios.post<RuleBundle>(RULEBUNDLES, obj);

export const deleteRuleBundle = (id: number) =>
  axios.delete(`${RULEBUNDLES}/${id}`);

export const getRuleBundles = () =>
  axios.get<RuleBundle[]>(RULEBUNDLES).then((response) => response.data);

export const getFileByID = (id: number) =>
  axios.get<RuleBundle[]>(FILES).then((response) => response.data);

export const createFile = ({
  formData,
  file,
}: {
  formData: FormData;
  file: IReadFile;
}) =>
  axios
    .post<RuleBundle>(`${FILES}/${file.fileName}`, formData, fileHeaders)
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

export const getJiraTrackers = () =>
  axios.get<JiraTracker[]>(JIRATRACKERS).then((response) => response.data);
