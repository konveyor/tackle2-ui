import axios, {
  AxiosPromise,
  AxiosResponse,
  RawAxiosRequestHeaders,
} from "axios";
import { template } from "radash";

import {
  Application,
  ApplicationAdoptionPlan,
  ApplicationDependency,
  ApplicationImport,
  ApplicationImportSummary,
  Archetype,
  Assessment,
  BusinessService,
  Cache,
  HubPaginatedResult,
  HubRequestParams,
  Identity,
  InitialAssessment,
  JobFunction,
  MigrationWave,
  MimeType,
  New,
  Proxy,
  Questionnaire,
  Ref,
  Review,
  Setting,
  SettingTypes,
  Stakeholder,
  StakeholderGroup,
  Tag,
  TagCategory,
  Target,
  Task,
  Taskgroup,
  TaskQueue,
  TaskDashboard,
  Ticket,
  Tracker,
  TrackerProject,
  TrackerProjectIssuetype,
  UnstructuredFact,
  SourcePlatform,
  AnalysisDependency,
  AnalysisAppDependency,
  Manifest,
} from "./models";
import { serializeRequestParamsForHub } from "@app/hooks/table-controls";

// endpoint paths
export { template };
export function hub(tsa: TemplateStringsArray, ...vals: unknown[]): string {
  let path = "";
  tsa.forEach((str) => {
    path += str;
    if (vals.length > 0) {
      path += String(vals.shift());
    }
  });

  return `/hub${path}`;
}

export const ANALYSIS_DEPS = hub`/analyses/report/dependencies`;
export const ANALYSIS_DEPS_APPS = hub`/analyses/report/dependencies/applications`;
export const APP_IMPORTS = hub`/imports`;
export const APP_IMPORTS_SUMMARY = hub`/importsummaries`;
export const APP_IMPORTS_SUMMARY_CSV = hub`/importsummaries/download`;
export const APP_IMPORTS_SUMMARY_UPLOAD = hub`/importsummaries/upload`;
export const APPLICATION_MANIFEST = hub`/applications/{{id}}/manifest`;
export const APPLICATIONS = hub`/applications`;
export const ARCHETYPES = hub`/archetypes`;
export const ASSESSMENTS = hub`/assessments`;
export const BUSINESS_SERVICES = hub`/businessservices`;
export const CACHE = hub`/cache/m2`;
export const DEPENDENCIES = hub`/dependencies`;
export const FACTS = hub`/facts`;
export const FILES = hub`/files`;
export const IDENTITIES = hub`/identities`;
export const IDENTITY = hub`/identities/{{id}}`;
export const JOB_FUNCTIONS = hub`/jobfunctions`;
export const MANIFESTS = hub`/manifests`;
export const MIGRATION_WAVES = hub`/migrationwaves`;
export const PLATFORMS = hub`/platforms`;
export const PROXIES = hub`/proxies`;
export const QUESTIONNAIRES = hub`/questionnaires`;
export const REPORT = hub`/reports`;
export const REVIEWS = hub`/reviews`;
export const SETTINGS = hub`/settings`;
export const STAKEHOLDER_GROUPS = hub`/stakeholdergroups`;
export const STAKEHOLDERS = hub`/stakeholders`;
export const TAG_CATEGORIES = hub`/tagcategories`;
export const TAGS = hub`/tags`;
export const TARGETS = hub`/targets`;
export const TASKGROUPS = hub`/taskgroups`;
export const TASKS = hub`/tasks`;
export const TICKETS = hub`/tickets`;
export const TRACKER_PROJECT_ISSUETYPES = "issuetypes"; // TODO: ????
export const TRACKER_PROJECTS = "projects"; // TODO: ????
export const TRACKERS = hub`/trackers`;

export const HEADERS: Record<string, RawAxiosRequestHeaders> = {
  json: {
    Accept: "application/json",
  },
  form: {
    Accept: "multipart/form-data",
  },
  file: {
    Accept: "application/json",
  },
  yaml: {
    Accept: "application/x-yaml",
  },
  plain: {
    Accept: "test/plain",
  },
};

export * from "./rest/analysis";
export * from "./rest/files";
export * from "./rest/schemas";
export * from "./rest/generators";

/**
 * Provide consistent fetch and processing for server side filtering and sorting with
 * paginated results.
 */
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

// ----------

export const getApplicationAdoptionPlan = (applicationIds: number[]) => {
  return axios.post<ApplicationAdoptionPlan[]>(
    `${REPORT}/adoptionplan`,
    applicationIds.map((f) => ({ applicationId: f }))
  );
};

// ---------------------------------------
// Application Dependencies
//
interface DependencyParams {
  from?: string[];
  to?: string[];
}

export const getApplicationDependencies = (params?: DependencyParams) => {
  return axios
    .get<ApplicationDependency[]>(`${DEPENDENCIES}`, {
      params,
      headers: HEADERS.json,
    })
    .then((response) => response.data);
};

export const createApplicationDependency = (obj: ApplicationDependency) => {
  return axios
    .post<ApplicationDependency>(`${DEPENDENCIES}`, obj)
    .then((response) => response.data);
};

export const deleteApplicationDependency = (id: number) => {
  return axios
    .delete<void>(`${DEPENDENCIES}/${id}`)
    .then((response) => response.data);
};

export const getDependencies = (params: HubRequestParams = {}) =>
  getHubPaginatedResult<AnalysisDependency>(ANALYSIS_DEPS, params);

export const getAppDependencies = (params: HubRequestParams = {}) =>
  getHubPaginatedResult<AnalysisAppDependency>(ANALYSIS_DEPS_APPS, params);

// ---------------------------------------
// Reviews
//
export const getReviews = (): Promise<Review[]> => {
  return axios.get(`${REVIEWS}`).then((response) => response.data);
};

export const getReviewById = (id: number | string): Promise<Review> => {
  return axios.get(`${REVIEWS}/${id}`).then((response) => response.data);
};

export const createReview = (obj: New<Review>): Promise<Review> => {
  return axios.post(`${REVIEWS}`, obj);
};

export const updateReview = (obj: Review): Promise<Review> => {
  return axios.put(`${REVIEWS}/${obj.id}`, obj);
};

export const deleteReview = (id: number): Promise<Review> => {
  return axios.delete(`${REVIEWS}/${id}`);
};

// ---------------------------------------
// Assessments
//
export const getAssessments = () =>
  axios.get<Assessment[]>(ASSESSMENTS).then((response) => response.data);

export const getAssessmentsByItemId = (
  isArchetype: boolean,
  itemId?: number | string
): Promise<Assessment[]> => {
  if (!itemId) return Promise.resolve([]);
  if (isArchetype) {
    return axios
      .get(`${ARCHETYPES}/${itemId}/assessments`)
      .then((response) => response.data);
  } else {
    return axios
      .get(`${APPLICATIONS}/${itemId}/assessments`)
      .then((response) => response.data);
  }
};

export const createAssessment = (
  obj: InitialAssessment,
  isArchetype: boolean
): Promise<Assessment> => {
  if (isArchetype) {
    return axios
      .post(`${ARCHETYPES}/${obj?.archetype?.id}/assessments`, obj)
      .then((response) => response.data);
  } else {
    return axios
      .post(`${APPLICATIONS}/${obj?.application?.id}/assessments`, obj)
      .then((response) => response.data);
  }
};

export const updateAssessment = (obj: Assessment): Promise<Assessment> => {
  return axios
    .put(`${ASSESSMENTS}/${obj.id}`, obj)
    .then((response) => response.data);
};

export const getAssessmentById = (id: number | string): Promise<Assessment> => {
  return axios.get(`${ASSESSMENTS}/${id}`).then((response) => response.data);
};

export const deleteAssessment = (id: number) => {
  return axios.delete<void>(`${ASSESSMENTS}/${id}`);
};

// ---------------------------------------
// Identities
//
export const getIdentities = () => {
  return axios
    .get<Identity[]>(IDENTITIES, { headers: HEADERS.json })
    .then((response) => response.data);
};

export const createIdentity = (identity: New<Identity>) => {
  return axios
    .post<Identity>(IDENTITIES, identity)
    .then((response) => response.data);
};

export const updateIdentity = (identity: Identity) => {
  return axios.put<void>(template(IDENTITY, { id: identity.id }), identity);
};

export const deleteIdentity = (identity: Identity) => {
  return axios.delete<void>(template(IDENTITY, { id: identity.id }));
};

// ---------------------------------------
// Applications
//

/** success with code 201 and created entity as response data */
export const createApplication = (application: New<Application>) =>
  axios
    .post<Application>(`${APPLICATIONS}`, application)
    .then((response) => response.data);

export const deleteApplication = (id: number): Promise<Application> =>
  axios.delete(`${APPLICATIONS}/${id}`);

export const deleteBulkApplications = (ids: number[]): Promise<Application[]> =>
  axios.delete(APPLICATIONS, { data: ids });

export const getApplicationById = (id: number | string): Promise<Application> =>
  axios.get(`${APPLICATIONS}/${id}`).then((response) => response.data);

export const getApplicationManifest = (
  applicationId: number | string
): Promise<Manifest> =>
  axios
    .get<Manifest>(template(APPLICATION_MANIFEST, { id: applicationId }))
    .then((response) => response.data);

export const getApplications = (): Promise<Application[]> =>
  axios.get(APPLICATIONS).then((response) => response.data);

export const updateApplication = (obj: Application): Promise<Application> =>
  axios.put(`${APPLICATIONS}/${obj.id}`, obj);

/** @deprecated Not used */
export const getApplicationAnalysis = (
  applicationId: number,
  type: MimeType
): Promise<Blob> =>
  axios.get(
    `${APPLICATIONS}/${String(applicationId)}/analysis${
      type === MimeType.TAR ? "/report" : ""
    }`,
    {
      responseType: "blob",
      headers: {
        Accept: `application/x-${type}`,
      },
    }
  );

export const updateAllApplications = (
  updatePromises: Promise<Application>[]
) => {
  return Promise.all(updatePromises)
    .then((response) => response)
    .catch((error) => error);
};

// ---------------------------------------
// Application Import
//
export const getApplicationsImportSummary = (): Promise<
  ApplicationImportSummary[]
> => axios.get(APP_IMPORTS_SUMMARY).then((response) => response.data);

export const getApplicationImportSummaryById = (
  id: number | string
): Promise<ApplicationImportSummary> =>
  axios.get(`${APP_IMPORTS_SUMMARY}/${id}`).then((response) => response.data);

export const deleteApplicationImportSummary = (
  id: number
): Promise<ApplicationImportSummary> =>
  axios.delete(`${APP_IMPORTS_SUMMARY}/${id}`);

export const getApplicationImports = (
  importSummaryID: number,
  isValid: boolean | string
): Promise<ApplicationImport[]> =>
  axios
    .get(
      `${APP_IMPORTS}?importSummary.id=${importSummaryID}&isValid=${isValid}`
    )
    .then((response) => response.data);

export const getApplicationSummaryCSV = (id: string) => {
  return axios.get<ArrayBuffer>(
    `${APP_IMPORTS_SUMMARY_CSV}?importSummary.id=${id}`,
    {
      responseType: "arraybuffer",
      headers: { Accept: "text/csv" },
    }
  );
};

// ---------------------------------------
// Tasks
//
export function getTaskById(id: number): Promise<Task> {
  return axios
    .get(`${TASKS}/${id}`, {
      headers: { ...HEADERS.json },
      responseType: "json",
    })
    .then((response) => {
      return response.data;
    });
}

export function getTaskByIdAndFormat(
  id: number,
  format: "json" | "yaml",
  merged: boolean = false
): Promise<string> {
  const isYaml = format === "yaml";
  const headers = isYaml ? { ...HEADERS.yaml } : { ...HEADERS.json };
  const responseType = isYaml ? "text" : "json";

  let url = `${TASKS}/${id}`;
  if (merged) {
    url += "?merged=1";
  }

  return axios
    .get<Task | string>(url, {
      headers: headers,
      responseType: responseType,
    })
    .then((response) => {
      return isYaml
        ? String(response.data ?? "")
        : JSON.stringify(response.data, undefined, 2);
    });
}

export function getTasksByIds(
  ids: number[],
  format: "json" | "yaml" = "json"
): Promise<Task[]> {
  const isYaml = format === "yaml";
  const headers = isYaml ? { ...HEADERS.yaml } : { ...HEADERS.json };
  const responseType = isYaml ? "text" : "json";
  const filterParam = `id:(${ids.join("|")})`;

  return axios
    .get<Task[]>(`${TASKS}`, {
      headers,
      responseType,
      params: {
        filter: filterParam,
      },
    })
    .then((response) => {
      return response.data;
    });
}

export const getTasksDashboard = () =>
  axios
    .get<TaskDashboard[]>(`${TASKS}/report/dashboard`)
    .then((response) => response.data);

export const getServerTasks = (params: HubRequestParams = {}) =>
  getHubPaginatedResult<Task>(TASKS, params);

export const deleteTask = (id: number) => axios.delete<void>(`${TASKS}/${id}`);

export const cancelTask = (id: number) =>
  axios.put<void>(`${TASKS}/${id}/cancel`);

export const cancelTasks = (ids: number[]) =>
  axios.put<void>(`${TASKS}/cancel?filter=id:(${ids.join("|")})`);

export const getTaskQueue = (addon?: string): Promise<TaskQueue> =>
  axios
    .get<TaskQueue>(`${TASKS}/report/queue`, { params: { addon } })
    .then(({ data }) => data);

export const updateTask = (task: Partial<Task> & { id: number }) =>
  axios.patch<Task>(`${TASKS}/${task.id}`, task);

// ---------------------------------------
// Task Groups
//
export const createTaskgroup = (obj: New<Taskgroup>) =>
  axios.post<Taskgroup>(TASKGROUPS, obj).then((response) => response.data);

export const submitTaskgroup = (obj: Taskgroup) =>
  axios
    .put<Taskgroup>(`${TASKGROUPS}/${obj.id}/submit`, obj)
    .then((response) => response.data);

export const deleteTaskgroup = (id: number): AxiosPromise =>
  axios.delete(`${TASKGROUPS}/${id}`);

// returns a 204 and no content with a successful upload
export const uploadFileTaskgroup = ({
  id,
  path,
  file,
}: {
  id: number;
  path: string;
  file: File;
}) => {
  const formData = new FormData();
  formData.append("file", file);
  return axios.post<void>(`${TASKGROUPS}/${id}/bucket/${path}`, formData, {
    headers: HEADERS.form,
  });
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

// ---------------------------------------
// Migration Waves
//
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

// ---------------------------------------
// Targets
//
export const updateTarget = (obj: Target) =>
  axios.put<Target>(`${TARGETS}/${obj.id}`, obj);

export const createTarget = (
  obj: New<Target>
): Promise<AxiosResponse<Target>> => axios.post<Target>(TARGETS, obj);

export const deleteTarget = (id: number): Promise<Target> =>
  axios.delete(`${TARGETS}/${id}`);

export const getTargets = (): Promise<Target[]> =>
  axios.get(TARGETS).then((response) => response.data);

// ---------------------------------------
// Settings
//
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

// ---------------------------------------
// Cache
//
export const getCache = () =>
  axios.get<Cache>(CACHE).then((response) => response.data);

export const deleteCache = () => axios.delete<void>(CACHE);

// ---------------------------------------
// Trackers
//
export const getTrackers = (): Promise<Tracker[]> =>
  axios.get(TRACKERS).then((response) => response.data);

export const createTracker = (obj: Tracker): Promise<Tracker> =>
  axios.post(TRACKERS, obj);

export const updateTracker = (obj: Tracker): Promise<Tracker> =>
  axios.put(`${TRACKERS}/${obj.id}`, obj);

export const deleteTracker = (id: number): Promise<Tracker> =>
  axios.delete(`${TRACKERS}/${id}`);

export const getTrackerProjects = (id: number): Promise<TrackerProject[]> =>
  axios
    .get(`${TRACKERS}/${id}/${TRACKER_PROJECTS}`)
    .then((response) => response.data);

export const getTrackerProjectIssuetypes = (
  trackerId: number,
  projectId: string
): Promise<TrackerProjectIssuetype[]> =>
  axios
    .get(
      `${TRACKERS}/${trackerId}/${TRACKER_PROJECTS}/${projectId}/${TRACKER_PROJECT_ISSUETYPES}`
    )
    .then((response) => response.data);

// ---------------------------------------
// Tickets
//
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

// ---------------------------------------
// Stakeholders
//
export const getStakeholders = (): Promise<Stakeholder[]> =>
  axios.get(STAKEHOLDERS).then((response) => response.data);

export const deleteStakeholder = (id: number): Promise<Stakeholder> =>
  axios.delete(`${STAKEHOLDERS}/${id}`);

export const createStakeholder = (
  obj: New<Stakeholder>
): Promise<Stakeholder> => axios.post(STAKEHOLDERS, obj);

export const updateStakeholder = (obj: Stakeholder): Promise<Stakeholder> =>
  axios.put(`${STAKEHOLDERS}/${obj.id}`, obj);

// ---------------------------------------
// Stakeholder groups
//
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

// ---------------------------------------
// Business services
//
export const getBusinessServices = () =>
  axios
    .get<BusinessService[]>(BUSINESS_SERVICES)
    .then((response) => response.data);

export const getBusinessServiceById = (id: number | string) =>
  axios
    .get<BusinessService>(`${BUSINESS_SERVICES}/${id}`)
    .then((response) => response.data);

export const createBusinessService = (obj: New<BusinessService>) =>
  axios.post<BusinessService>(BUSINESS_SERVICES, obj);

export const updateBusinessService = (obj: BusinessService) =>
  axios.put<void>(`${BUSINESS_SERVICES}/${obj.id}`, obj);

export const deleteBusinessService = (id: number | string) =>
  axios.delete<void>(`${BUSINESS_SERVICES}/${id}`);

// ---------------------------------------
// Job functions
//
export const getJobFunctions = () =>
  axios.get<JobFunction[]>(JOB_FUNCTIONS).then((response) => response.data);

export const createJobFunction = (obj: New<JobFunction>) =>
  axios.post<JobFunction>(JOB_FUNCTIONS, obj).then((response) => response.data);

export const updateJobFunction = (obj: JobFunction) =>
  axios.put<void>(`${JOB_FUNCTIONS}/${obj.id}`, obj);

export const deleteJobFunction = (id: number) =>
  axios.delete<void>(`${JOB_FUNCTIONS}/${id}`);

// ---------------------------------------
// Tags
//
export const getTags = (): Promise<Tag[]> =>
  axios.get(TAGS).then((response) => response.data);

export const getTagById = (id: number | string): Promise<Tag> =>
  axios.get(`${TAGS}/${id}`).then((response) => response.data);

export const createTag = (obj: New<Tag>): Promise<Tag> => axios.post(TAGS, obj);

export const deleteTag = (id: number): Promise<Tag> =>
  axios.delete(`${TAGS}/${id}`);

export const updateTag = (obj: Tag): Promise<Tag> =>
  axios.put(`${TAGS}/${obj.id}`, obj);

// ---------------------------------------
// Tag categories
//
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

// ---------------------------------------
// Facts
//
export const getFacts = (id: number | string | undefined) =>
  // TODO: Address this when moving to structured facts api
  id
    ? axios
        .get<UnstructuredFact>(`${APPLICATIONS}/${id}/facts`)
        .then((response) => response.data)
    : Promise.reject();

// ---------------------------------------
// Proxies
//
export const getProxies = (): Promise<Proxy[]> =>
  axios.get(PROXIES).then((response) => response.data);

export const updateProxy = (obj: Proxy): Promise<Proxy> =>
  axios.put(`${PROXIES}/${obj.id}`, obj);

// ---------------------------------------
// Questionnaires
//
export const getQuestionnaires = (): Promise<Questionnaire[]> =>
  axios.get(QUESTIONNAIRES).then((response) => response.data);

export const getQuestionnaireById = <T>(id: number | string): Promise<T> =>
  axios.get(`${QUESTIONNAIRES}/${id}`).then((response) => response.data);

export const createQuestionnaire = (
  obj: Questionnaire
): Promise<Questionnaire> =>
  axios.post(`${QUESTIONNAIRES}`, obj).then((response) => response.data);

// TODO: The update handlers in hub don't return any content (success is a response code
// TODO:  of 204 - NoContext) ... the return type does not make sense.
export const updateQuestionnaire = (
  obj: Questionnaire
): Promise<Questionnaire> => axios.put(`${QUESTIONNAIRES}/${obj.id}`, obj);

// TODO: The delete handlers in hub don't return any content (success is a response code
// TODO:  of 204 - NoContext) ... the return type does not make sense.
export const deleteQuestionnaire = (id: number): Promise<Questionnaire> =>
  axios.delete(`${QUESTIONNAIRES}/${id}`);

// ---------------------------------------
// Archetypes
//
export const getArchetypes = (): Promise<Archetype[]> =>
  axios.get(ARCHETYPES).then(({ data }) => data);

export const getArchetypeById = (id: number | string): Promise<Archetype> =>
  axios.get(`${ARCHETYPES}/${id}`).then(({ data }) => data);

// success with code 201 and created entity as response data
export const createArchetype = (archetype: New<Archetype>) =>
  axios.post<Archetype>(ARCHETYPES, archetype).then((res) => res.data);

// success with code 204 and therefore no response content
export const updateArchetype = (archetype: Archetype): Promise<void> =>
  axios.put(`${ARCHETYPES}/${archetype.id}`, archetype);

// success with code 204 and therefore no response content
export const deleteArchetype = (id: number): Promise<void> =>
  axios.delete(`${ARCHETYPES}/${id}`);

// ---------------------------------------
// Platforms
//
export const getPlatforms = () =>
  axios.get<SourcePlatform[]>(PLATFORMS).then(({ data }) => data);

export const getPlatformById = (id: number | string) =>
  axios.get<SourcePlatform>(`${PLATFORMS}/${id}`).then(({ data }) => data);

// success with code 201 and created entity as response data
export const createPlatform = (platform: New<SourcePlatform>) =>
  axios.post<void>(PLATFORMS, platform).then((res) => res.data);

// success with code 204 and therefore no response content
export const updatePlatform = (platform: SourcePlatform) =>
  axios.put<void>(`${PLATFORMS}/${platform.id}`, platform);

// success with code 204 and therefore no response content
export const deletePlatform = (id: number) =>
  axios.delete<void>(`${PLATFORMS}/${id}`);
