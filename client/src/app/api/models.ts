// hub OpenAPI definition: https://github.com/konveyor/tackle2-hub/blob/main/docs/openapi3.json

export enum MimeType {
  TAR = "tar",
  YAML = "yaml",
}

/** Mark an object as "New" therefore does not have an `id` field. */
export type New<T extends { id: number }> = Omit<T, "id">;

/**
 * Mark an object as having a unique client generated id field.  Use this type if
 * an objects from hub does not have a single field with a unique key AND the object
 * is to be used in a table.  Our table handlers assume a single field with a unique
 * value across all objects in a set to properly handle row selections.
 */
export type WithUiId<T> = T & { _ui_unique_id: string };

export interface EmptyObject extends Record<string, never> {}

export interface JsonDocument extends Record<string, unknown> {}

export interface HubFilter {
  field: string;
  operator?: "=" | "!=" | "~" | ">" | ">=" | "<" | "<=";
  value:
    | string
    | number
    | {
        list: (string | number)[];
        operator?: "AND" | "OR";
      };
}

export interface HubRequestParams {
  filters?: HubFilter[];
  sort?: {
    field: string;
    direction: "asc" | "desc";
  };
  page?: {
    pageNumber: number; // 1-indexed
    itemsPerPage: number;
  };
}

export interface HubPaginatedResult<T> {
  data: T[];
  total: number;
  params: HubRequestParams;
}

// Controls

export interface BusinessService {
  id: number;
  name: string;
  description?: string;
  owner?: Ref;
}

export interface Stakeholder {
  id: number;
  name: string;
  email: string;
  jobFunction: Ref | null;
  stakeholderGroups?: Ref[];
  businessServices?: Ref[];
  migrationWaves?: Ref[];
  owns?: Ref[];
  contributes?: Ref[];
}

export interface StakeholderWithRole extends Stakeholder {
  role: Role;
}

export interface StakeholderGroup {
  id: number;
  name: string;
  description?: string;
  stakeholders?: Ref[];
}

export interface Ref {
  id: number;
  name: string;
}
export interface IdRef {
  id: number;
}

export interface RefWithRole<RoleType = string> extends Ref {
  role?: RoleType;
}

export interface JobFunction {
  id: number;
  name: string;
  stakeholders?: Array<Ref>;
}

export interface TagCategory {
  id: number;
  name: string;
  colour?: string;
  tags?: Tag[];
}

export interface Tag {
  id: number;
  name: string;
  category?: Ref;
}

// Application inventory
export type ProposedAction =
  | "rehost"
  | "replatform"
  | "refactor"
  | "repurchase"
  | "retire"
  | "retain";

export type EffortEstimate = "small" | "medium" | "large" | "extra_large";

export type ImportSummaryStatus = "Completed" | "In Progress" | "Failed";

export interface Repository<Kind = string> {
  kind?: Kind;
  url?: string;
  branch?: string;
  path?: string;
}

/** A JSON document with its schema */
export interface Document {
  content: JsonDocument;
  /** name of the schema */ schema: string;
}

export type ManagedIdentityRole = "source" | "maven" | "asset";
export type IdentityRole = ManagedIdentityRole | string;

export interface Application {
  id: number;
  name: string;
  description?: string;
  bucket?: Ref;
  repository?: Repository;
  assets?: Repository;
  binary?: string;
  coordinates?: Document;
  review?: Ref;
  comments?: string;
  identities?: RefWithRole<IdentityRole>[];
  tags?: TagRef[];
  businessService?: Ref;
  owner?: Ref;
  contributors?: Ref[];
  migrationWave: Ref | null;
  platform?: Ref;
  archetypes?: Ref[];
  assessments?: Ref[];
  manifests?: Ref[];
  assessed?: boolean;
  risk?: Risk;
  confidence?: number;
  effort?: number;
}

export interface Review {
  id: number;
  proposedAction: ProposedAction;
  effortEstimate: EffortEstimate;
  businessCriticality: number;
  workPriority: number;
  comments?: string;
  application?: Ref;
  archetype?: Ref;
}

export interface ApplicationDependency {
  id?: number;
  from: Ref;
  to: Ref;
}

export interface ApplicationAdoptionPlan {
  applicationId: number;
  applicationName: string;
  decision: ProposedAction;
  effortEstimate: string;
  effort: number;
  positionX: number;
  positionY: number;
}

export interface ApplicationImportSummary {
  id: number;
  filename: string;
  createUser: string;
  importTime: string;
  validCount: number;
  invalidCount: number;
  importStatus: ImportSummaryStatus;
}

export interface ApplicationImport {
  "Application Name": string;
  errorMessage: string;
  isValid: boolean;
}

export const IdentityKinds = [
  "source",
  "maven",
  "proxy",
  "basic-auth",
  "bearer",
] as const;

export type IdentityKind = (typeof IdentityKinds)[number];

export interface Identity {
  id: number;
  createUser?: string;
  updateUser?: string;
  createTime?: string;

  kind: IdentityKind;
  default?: boolean;
  name: string;
  description?: string;
  user?: string;
  password?: string;
  key?: string;
  settings?: string;
}

export interface Proxy {
  id?: number;
  host: string;
  kind: "http" | "https";
  port: number;
  excluded: Array<string>;
  identity?: Ref;
  createTime?: string;
  createUser?: string;
  enabled: boolean;
}

// Pagination

export interface BusinessServicePage {
  _embedded: {
    "business-service": BusinessService[];
  };
  total_count: number;
}

export interface StakeholderPage {
  _embedded: {
    stakeholder: Stakeholder[];
  };
  total_count: number;
}

export interface StakeholderGroupPage {
  _embedded: {
    "stakeholder-group": StakeholderGroup[];
  };
  total_count: number;
}

export type JobFunctionPage = Array<JobFunction>;

export interface TagCategoryPage {
  _embedded: {
    "tag-type": TagCategory[];
  };
  total_count: number;
}

export interface ApplicationPage {
  _embedded: {
    application: Application[];
  };
  total_count: number;
}

export interface ApplicationDependencyPage {
  _embedded: {
    "applications-dependency": ApplicationDependency[];
  };
  total_count: number;
}

export interface ApplicationImportSummaryPage {
  _embedded: {
    "import-summary": ApplicationImportSummary[];
  };
  total_count: number;
}

export interface ApplicationImportPage {
  _embedded: {
    "application-import": ApplicationImport[];
  };
  total_count: number;
}

export type SettingTypes = {
  "git.insecure.enabled": boolean;
  "mvn.dependencies.update.forced": boolean;
  "mvn.insecure.enabled": boolean;
  "download.html.enabled": boolean;
  "svn.insecure.enabled": boolean;
  "ui.target.order": number[];
};

export type Setting<K extends keyof SettingTypes> = {
  key: K;
  value: SettingTypes[K];
};

// Analysis Task

export type TaskState =
  | "not supported"
  | "Canceled"
  | "Created"
  | "Succeeded"
  | "Failed"
  | "Running"
  | "No task"
  | "QuotaBlocked"
  | "Ready"
  | "Pending"
  | "Postponed"
  | "SucceededWithErrors"; // synthetic state for ease-of-use in UI;

export interface Task<DataType> {
  id: number;
  createUser?: string;
  updateUser?: string;
  createTime?: string;

  name?: string;
  kind: string;
  addon?: string;
  extensions?: string[];
  state?: TaskState;
  locator?: string;
  priority?: number;
  policy?: TaskPolicy;
  ttl?: TTL;
  data?: DataType;
  application?: Ref;
  platform?: Ref;
  bucket?: Ref;
  pod?: string;
  retries?: number;
  started?: string;
  terminated?: string;
  events?: TaskEvent[];
  errors?: TaskError[];
  activity?: string[];
  attached?: TaskAttachment[];
}

export interface AnalysisTask extends Omit<
  Task<AnalysisTaskData>,
  "application" | "platform"
> {
  kind: "analysis";
  application: Ref;
}

export interface ApplicationManifestTask extends Omit<
  Task<EmptyObject>,
  "application" | "platform"
> {
  kind: "application-manifest";
  application: Ref;
}

export interface ApplicationAssetGenerationTask extends Omit<
  Task<AssetGenerationTaskData>,
  "application" | "platform"
> {
  kind: "asset-generation";
  application: Ref;
}

export interface PlatformApplicationImportTask extends Omit<
  Task<PlatformApplicationImportTaskData>,
  "application" | "platform"
> {
  kind: "application-import";
  platform: Ref;
}

/** A smaller version of `Task` fetched from the report/dashboard endpoint. */
export interface TaskDashboard {
  id: number;
  createUser: string;
  updateUser: string;
  createTime: string; // ISO-8601
  name: string;
  kind?: string;
  addon?: string;
  state: TaskState;
  application?: Ref;
  platform?: Ref;
  started?: string; // ISO-8601
  terminated?: string; // ISO-8601

  /** Count of errors recorded on the task - even Succeeded tasks may have errors. */
  errors?: number;
}

export interface TaskPolicy {
  isolated?: boolean;
  preemptEnabled?: boolean;
  preemptExempt?: boolean;
}

export interface TTL {
  created?: number;
  pending?: number;
  running?: number;
  succeeded?: number;
  failed?: number;
}

export interface TaskEvent {
  kind: string;
  count: number;
  reason?: string;
  last: string; // time
}

export interface TaskError {
  severity: string;
  description: string;
}

export interface TaskAttachment {
  id: number;
  name?: string;
  activity?: number;
}

export interface AnalysisTaskData {
  tagger: {
    enabled: boolean;
  };
  verbosity: number;
  mode: {
    binary: boolean;
    withDeps: boolean;
    artifact: string;
    csv?: boolean;
  };
  targets?: string[];
  sources?: string[];
  scope: {
    withKnownLibs: boolean;
    packages: {
      included: string[];
      excluded: string[];
    };
  };
  rules?: {
    path: string;
    tags?: {
      excluded: string[];
    };
    repository?: Repository;
    identity?: Ref;
    labels: {
      included: string[];
      excluded: string[];
    };
    ruleSets?: Ref[]; // Target.ruleset.{ id, name }
  };
}

export interface PlatformApplicationImportTaskData {
  filter: JsonDocument;
}

export interface AssetGenerationTaskData {
  profiles: Ref[];
  params: JsonDocument;
  render: boolean;
}

export interface TaskgroupTask {
  name: string;
  data: unknown;
  application: Ref;
}

export interface Taskgroup {
  id: number;
  name: string;
  kind?: string;
  addon?: string;
  data: AnalysisTaskData;
  tasks: TaskgroupTask[];
}

export interface TaskQueue {
  /** Total number of tasks scheduled */
  total: number;
  /** number of tasks ready to run */
  ready: number;
  /** number of postponed tasks */
  postponed: number;
  /** number of tasks with pods created awaiting node scheduler */
  pending: number;
  /** number of tasks with running pods */
  running: number;
}

export interface Cache {
  path: string;
  capacity: string;
  used: string;
  exists: boolean;
}

export interface ITypeOptions {
  key: string;
  value: string;
}

export interface RulesetImage {
  id: number;
  name?: string;
}

export enum RulesetKind {
  CATEGORY = "category",
}

export interface Ruleset {
  id?: number;
  kind?: RulesetKind;
  name?: string;
  description?: string;
  rules: Rule[];
  repository?: Repository;
  identity?: Ref;
}
export interface TargetLabel {
  name: string;
  label: string;
}
export interface Target {
  id: number;
  name: string;
  description?: string;
  choice?: boolean;
  custom?: boolean;
  labels?: TargetLabel[];
  image?: RulesetImage;
  ruleset: Ruleset;
  provider?: string;
}

export interface Metadata {
  target: string;
  source?: string;
  otherLabels?: string[];
}
export interface Rule {
  name: string;
  metadata?: Metadata;
  labels?: string[];
  file?: {
    id: number;
  };
}

export interface ParsedRule {
  source: string | null;
  target: string | null;
  total: number;
  otherLabels?: string[];
  allLabels?: string[];
  fileID?: number;
}

export const UploadFileStatus = [
  "exists",
  "starting",
  "reading",
  "read",
  "validated",
  "uploaded",
  "failed",
] as const;

export interface UploadFile {
  fileId?: number;
  fileName: string;
  fullFile: File;
  uploadProgress: number;
  status: (typeof UploadFileStatus)[number];
  contents?: string;
  loadError?: string;
  responseID?: number;
}

export interface TagRef extends Ref {
  source?: string;
  virtual?: boolean;
}

export interface MigrationWave {
  id: number;
  name: string;
  startDate: string;
  endDate: string;
  applications: Ref[];
  stakeholders: Ref[];
  stakeholderGroups: Ref[];
}

export type IssueManagerKind = "jira-cloud" | "jira-onprem";

export interface Tracker {
  connected: boolean;
  id: number;
  identity?: Ref;
  kind: IssueManagerKind;
  message: string;
  name: string;
  url: string;
  insecure: boolean;
}

export interface TrackerProject {
  id: string;
  name: string;
}

export interface TrackerProjectIssuetype {
  id: string;
  name: string;
}

export interface AnalysisDependency {
  provider: string;
  name: string;
  labels: string[];
  applications: number;
}

export interface AnalysisAppDependency {
  id: number;
  name: string;
  description: string;
  businessService: string;
  dependency: {
    id: number;
    provider: string;
    name: string;
    version: string;
    sha: string;
    indirect: boolean;
    labels: string[];
  };
}

export interface AnalysisInsight {
  id: number;
  analysis: number;
  ruleset: string;
  rule: string;
  name: string;
  description?: string;
  category?: string;
  effort?: number;

  incidents?: AnalysisIncident[];
  links?: AnalysisInsightLink[];
  facts?: AnalysisFacts;
  labels: string[];
}

export interface AnalysisIncident {
  id: number;
  insight: number;
  file: string;
  line: number;
  message: string;
  codeSnip: string;
  facts: AnalysisFacts;
}

export interface AnalysisInsightLink {
  url: string;
  title: string;
}

export interface AnalysisFacts extends Record<string, unknown> {}

/** HUB RuleReport - Insight / Ruleset+Rule summary */
export interface AnalysisReportInsight {
  ruleset: string;
  rule: string;
  name: string;
  description: string;
  category: string;
  effort: number;
  labels: string[];
  links: AnalysisInsightLink[];

  /** count of applications that have this insight */
  applications: number;
}

export type UiAnalysisReportInsight = WithUiId<AnalysisReportInsight>;

/** HUB InsightReport - Insight / Ruleset+Rule summary, for one application */
export interface AnalysisReportApplicationInsight {
  /** insight id */ id: number;
  ruleset: string;
  rule: string;
  name: string;
  description: string;
  category: string;
  effort: number;
  labels: string[];
  links: AnalysisInsightLink[];

  /** count of files that have this insight */
  files: number;
}

export type UiAnalysisReportApplicationInsight =
  WithUiId<AnalysisReportApplicationInsight>;

/**
 * HUB InsightAppReport - Insight for application
 * When filtered by ruleset/rule, this object matches exactly one insight and includes that insight's details
 */
export interface AnalysisReportInsightApplication {
  /** application id */ id: number;
  /** application name */ name: string;
  /** application description */ description: string;
  /** application business service */ businessService: string;

  effort: number;
  incidents: number;
  files: number;

  insight: {
    id: number;
    name: string;
    description: string;
    ruleset: string;
    rule: string;
  };
}

/** HUB FileReport - Insight occurrence in a file summary */
export interface AnalysisReportFile {
  insightId: number;
  file: string;

  /** count of incidents in the file */ incidents: number;
  /** total effort of all incidents in the file */ effort: number;
}

export type TicketStatus = "" | "New" | "In Progress" | "Done" | "Error";

export type AggregateTicketStatus =
  | "Creating Issues"
  | "Issues Created"
  | "In Progress"
  | "Completed"
  | "Error"
  | "No Issues"
  | "Not Started";

export interface Ticket {
  id: number;
  application?: Ref | null;
  tracker: Ref;
  kind: string;
  parent: string;
  fields?: Ref | null;
  readonly message?: string | null;
  reference?: string | null;
  readonly status?: TicketStatus | null;
  error?: boolean;
  link?: string;
}

export type Role = "Owner" | "Contributor" | null;
export interface WaveWithStatus extends MigrationWave {
  ticketStatus: TicketStatus[];
  status: string;
  fullApplications: Application[];
  allStakeholders: StakeholderWithRole[];
}
export type UnstructuredFact = never;

export type Fact = {
  name: string;
  // TODO: Address this when moving to structured facts api
  data: unknown;
};

export type HubFile = {
  id: number;
  name: string;
  path: string;
};

export interface LooseQuestionnaire {
  [key: string]: unknown;
}

export interface Questionnaire {
  id: number;
  name: string;
  description: string;
  revision: number;
  questions: number;
  rating: string;
  required: boolean;
  sections: Section[];
  thresholds: Thresholds;
  riskMessages: RiskMessages;
  builtin?: boolean;
  createTime?: string;
  createUser?: string;
  updateTime?: string;
  updateUser?: string;
}

export interface RiskMessages {
  green: string;
  red: string;
  unknown: string;
  yellow: string;
}
export interface Section {
  name: string;
  questions: Question[];
  order: number;
  comment?: string;
}

export interface Question {
  answers: Answer[];
  text: string;
  order: number;
  explanation?: string;
  includeFor?: QuestionnaireTag[];
  excludeFor?: QuestionnaireTag[];
}

export interface Answer {
  order: number;
  text: string;
  risk: string;
  rationale?: string;
  mitigation?: string;
  applyTags?: QuestionnaireTag[];
  autoAnswerFor?: QuestionnaireTag[];
  autoAnswered?: boolean;
  selected?: boolean;
}
export interface Thresholds {
  red?: number;
  unknown?: number;
  yellow?: number;
  green?: number;
}

export type AssessmentStatus = "empty" | "started" | "complete";
export type Risk = "green" | "yellow" | "red" | "unknown" | "unassessed";

export interface InitialAssessment {
  application?: Ref;
  archetype?: Ref;
  questionnaire: Ref;
}
export interface Assessment extends Pick<
  Questionnaire,
  "thresholds" | "sections" | "riskMessages"
> {
  name: string;
  id: number;
  application?: Ref;
  archetype?: Ref;
  questionnaire: Ref;
  description: string;
  status: AssessmentStatus;
  risk: Risk;
  confidence?: number;
  stakeholders?: Ref[];
  stakeholderGroups?: Ref[];
  required?: boolean;
}
export interface QuestionnaireTag {
  category: string;
  tag: string;
}

//TODO: update to use new api
export interface AssessmentRisk {
  assessmentId: number;
  applicationId: number;
  risk: Risk;
}

export interface AssessmentQuestionRisk {
  category: string;
  question: string;
  answer: string;
  applications: number[];
}

export interface AssessmentConfidence {
  assessmentId: number;
  applicationId: number;
  confidence: number;
}

export interface TargetProfile {
  id: number;
  name: string;
  generators: Ref[];
}

export interface Archetype {
  id: number;
  name: string;
  description: string;
  comments: string;
  tags: TagRef[];
  criteria: TagRef[];
  stakeholders?: Ref[];
  stakeholderGroups?: Ref[];
  applications?: Ref[];
  assessments?: Ref[];
  assessed?: boolean;
  review?: Ref;
  risk?: Risk;
  profiles?: TargetProfile[];
}

export interface QuestionWithSectionOrder extends Question {
  sectionOrder: number;
}

export interface SectionWithQuestionOrder extends Section {
  questions: QuestionWithSectionOrder[];
}

export interface AssessmentWithSectionOrder extends Assessment {
  sections: SectionWithQuestionOrder[];
}

export interface AssessmentWithArchetypeApplications extends AssessmentWithSectionOrder {
  archetypeApplications: Ref[];
}
export interface AssessmentsWithArchetype {
  archetype: Archetype;
  assessments: Assessment[];
}

export enum StakeholderType {
  Stakeholder = "Stakeholder",
  StakeholderGroup = "Stakeholder Group",
}
export interface GroupedStakeholderRef extends Ref {
  group: StakeholderType.Stakeholder | StakeholderType.StakeholderGroup;
  uniqueId: string;
}

export interface SourcePlatform {
  id: number;
  kind: string;
  name: string;
  url: string;
  identity?: Ref;
  applications?: Ref[];
  coordinates?: JsonDocument;
  discoverApplicationsState?: TaskState;
}

export interface Generator {
  id: number;
  kind: string;
  name: string;
  description?: string;
  repository?: Repository;
  params?: JsonDocument;
  values?: JsonDocument;
  identity?: Ref;
  /** all profiles currently referencing this generator */ profiles?: Ref[];
}

// Could use https://www.npmjs.com/package/@types/json-schema in future if needed
export interface JsonSchemaObject {
  $schema?: "https://json-schema.org/draft/2020-12/schema" | string;
  type: "string" | "integer" | "number" | "boolean" | "object" | "array";
  title?: string;
  description?: string;

  /** For type string, RegEx pattern */
  pattern?: string;

  /** For type string, min length */
  minLength?: number;

  /** For type string, max length */
  maxLength?: number;

  /** For type string, enum values */
  enum?: string[];

  /** For type number, minimum value */
  minimum?: number;

  /** For type number, maximum value */
  maximum?: number;

  /** For type array */
  items?: JsonSchemaObject;

  /** For type array, minimum number of items */
  minItems?: number;

  /** For type array, maximum number of items */
  maxItems?: number;

  /** For type object, defined properties */
  properties?: { [key: string]: JsonSchemaObject };

  /** For type object, what property names are required */
  required?: string[];

  /** For type object, whether additional properties are allowed */
  additionalProperties?: boolean;
}

export interface Schema {
  name: string;
  domain: string;
  variant: string;
  subject: string;
  versions: Array<{
    id: number;
    definition: JsonSchemaObject;
  }>;
}

export interface TargetedSchema {
  name: string;
  definition: JsonSchemaObject;
}
