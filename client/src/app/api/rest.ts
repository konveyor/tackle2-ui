import axios, {
  AxiosPromise,
  AxiosResponse,
  RawAxiosRequestHeaders,
} from "axios";
import { template } from "radash";

import { serializeRequestParamsForHub } from "@app/hooks/table-controls";

import {
  ApplicationAdoptionPlan,
  ApplicationImport,
  ApplicationImportSummary,
  Assessment,
  HubPaginatedResult,
  HubRequestParams,
  InitialAssessment,
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
  Taskgroup,
  Ticket,
  Tracker,
  TrackerProject,
  TrackerProjectIssuetype,
  UnstructuredFact,
} from "./models";

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

export const APP_IMPORTS = hub`/imports`;
export const APP_IMPORTS_SUMMARY = hub`/importsummaries`;
export const APP_IMPORTS_SUMMARY_CSV = hub`/importsummaries/download`;
export const APP_IMPORTS_SUMMARY_UPLOAD = hub`/importsummaries/upload`;
export const ASSESSMENTS = hub`/assessments`;
export const FACTS = hub`/facts`;
export const FILES = hub`/files`;
export const MANIFESTS = hub`/manifests`;
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
export * from "./rest/application-dependencies";
export * from "./rest/applications";
export * from "./rest/archetypes";
export * from "./rest/business-services";
export * from "./rest/cache";
export * from "./rest/files";
export * from "./rest/generators";
export * from "./rest/identities";
export * from "./rest/job-functions";
export * from "./rest/migration-waves";
export * from "./rest/platforms";
export * from "./rest/schemas";
export * from "./rest/tasks";

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
// TODO: These rest functions are being used, but the return types are not consistent
//       or are wrong. All functions that are correct have been moved to appropriate
//       files under the rest folder.
//
//       The general pattern to follow is:
//         GET returns code 200 with `Entity` or `Entity[]`
//         POST takes a `New<Entity>` and returns code 201 with the created `Entity`
//         PUT takes an Entity and returns code 204 with no content (void)
//         DELETE takes an id and returns code 204 with no content (void)
//
//       Each function set should be reviewed, updated, and moved to the appropriate
//       file under the rest folder.  Typically the query hooks and onSuccess/onError
//       handlers will need to be updated.
// ----------

export const getApplicationAdoptionPlan = (applicationIds: number[]) => {
  return axios.post<ApplicationAdoptionPlan[]>(
    `${REPORT}/adoptionplan`,
    applicationIds.map((f) => ({ applicationId: f }))
  );
};

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
      .get(hub`/archetypes/${itemId}/assessments`)
      .then((response) => response.data);
  } else {
    return axios
      .get(hub`/applications/${itemId}/assessments`)
      .then((response) => response.data);
  }
};

export const createAssessment = (
  obj: InitialAssessment,
  isArchetype: boolean
): Promise<Assessment> => {
  if (isArchetype) {
    return axios
      .post(hub`/archetypes/${obj?.archetype?.id}/assessments`, obj)
      .then((response) => response.data);
  } else {
    return axios
      .post(hub`/applications/${obj?.application?.id}/assessments`, obj)
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
// Task Groups
//
export const createTaskgroup = (obj: New<Taskgroup>) =>
  axios.post<Taskgroup>(TASKGROUPS, obj).then((response) => response.data);

export const submitTaskgroup = (obj: Taskgroup) =>
  axios
    .put<void>(`${TASKGROUPS}/${obj.id}/submit`, obj)
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
        .get<UnstructuredFact>(hub`/applications/${id}/facts`)
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

export const updateQuestionnaire = (
  obj: Questionnaire
): Promise<Questionnaire> => axios.put(`${QUESTIONNAIRES}/${obj.id}`, obj);

export const deleteQuestionnaire = (id: number): Promise<Questionnaire> =>
  axios.delete(`${QUESTIONNAIRES}/${id}`);
