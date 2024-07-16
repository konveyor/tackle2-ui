// hub OpenAPI definition: https://github.com/konveyor/tackle2-hub/blob/main/docs/openapi3.json

export enum MimeType {
  TAR = "tar",
  YAML = "yaml",
}

/** Mark an object as "New" therefore does not have an `id` field. */
export type New<T extends { id: number }> = Omit<T, "id">;

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

export interface JobFunction {
  id: number;
  name: string;
  stakeholders?: Array<Ref>;
}

export interface TagCategory {
  id: number;
  name: string;
  rank?: number;
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

export interface Repository {
  kind?: string;
  branch?: string;
  path?: string;
  url?: string;
}

export interface Application {
  id: number;
  name: string;
  description?: string;
  comments?: string;
  businessService?: Ref;
  tags?: TagRef[];
  owner?: Ref;
  contributors?: Ref[];
  review?: Ref;
  identities?: Ref[];
  repository?: Repository;
  binary?: string;
  migrationWave: Ref | null;
  assessments?: Ref[];
  assessed?: boolean;
  archetypes?: Ref[];
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

export type IdentityKind =
  | "source"
  | "maven"
  | "proxy"
  | "basic-auth"
  | "bearer";

export interface Identity {
  id: number;
  createUser?: string;
  updateUser?: string;
  createTime?: string;

  kind: IdentityKind;
  name: string;
  description?: string;
  user?: string;
  password?: string;
  key?: string;
  settings?: string;
}

export interface Proxy {
  host: string;
  kind: "http" | "https";
  port: number;
  excluded: Array<string>;
  identity?: Ref;
  createTime?: string;
  createUser?: string;
  id: any;
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

export interface Task {
  id: number;
  createUser?: string;
  updateUser?: string;
  createTime?: string;

  name?: string;
  kind?: string;
  addon?: string;
  extensions?: string[];
  state?: TaskState;
  locator?: string;
  priority?: number;
  policy?: TaskPolicy;
  ttl?: TTL;
  data?: TaskData;
  application: Ref;
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
  application: Ref;
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

export interface TaskData {
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
    tags: {
      excluded: string[];
    };
    repository?: Repository;
    identity?: Ref;
    labels: {
      included: string[];
      excluded: string[];
    };
  };
}

export interface TaskgroupTask {
  name: string;
  data: any;
  application: Ref;
}

export interface Taskgroup {
  id: number;
  name: string;
  kind?: string;
  addon?: string;
  data: TaskData;
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

export type FileLoadError = {
  name?: string;
  message?: string;
  stack?: string;
  cause?: {};
};

export interface IReadFile {
  fileName: string;
  fullFile?: File;
  loadError?: FileLoadError;
  loadPercentage?: number;
  loadResult?: "danger" | "success";
  data?: string;
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

export interface AnalysisIssueLink {
  url: string;
  title: string;
}

interface AnalysisIssuesCommonFields {
  name: string;
  description: string;
  ruleset: string;
  rule: string;
  category: string;
  effort: number;
  labels: string[];
  links?: AnalysisIssueLink[];
}

// Hub type: Issue
export interface AnalysisIssue extends AnalysisIssuesCommonFields {
  id: number;
}

// Hub type: AppReport - Issues collated by application (but filtered by ruleset/rule)
// When filtered by ruleset/rule, this object matches exactly one issue and includes that issue's details
export interface AnalysisAppReport extends AnalysisIssue {
  id: number; // Application id
  name: string;
  description: string;
  effort: number;
  businessService: string;
  incidents: number;
  files: number;
  issue: {
    id: number;
    name: string;
    ruleset: string;
    rule: string;
  };
}

// Hub type: RuleReport - Issues collated by ruleset/rule
export interface BaseAnalysisRuleReport extends AnalysisIssuesCommonFields {
  applications: number;
}

// Hub type: IssueReport - Issues collated by ruleset/rule, filtered by one application
export interface BaseAnalysisIssueReport extends AnalysisIssuesCommonFields {
  id: number; // Issue id
  files: number;
}

/**
 * Mark an object as having a unique client generated id field.  Use this type if
 * an objects from hub does not have a single field with a unique key AND the object
 * is to be used in a table.  Our table handlers assume a single field with a unique
 * value across all objects in a set to properly handle row selections.
 */
export type WithUiId<T> = T & { _ui_unique_id: string };

export type AnalysisRuleReport = WithUiId<BaseAnalysisRuleReport>;
export type AnalysisIssueReport = WithUiId<BaseAnalysisIssueReport>;

// Hub type: FileReport - Incidents collated by file
export interface AnalysisFileReport {
  issueId: number;
  file: string;
  incidents: number;
  effort: number;
}

export interface AnalysisIncident {
  id: number;
  file: string;
  line: number;
  message: string;
  codeSnip: string;
  facts: Record<string, string>; // TODO what's actually in here?
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
export type UnstructuredFact = any;

export type Fact = {
  name: string;
  //TODO: Address this when moving to structured facts api
  data: any;
};

export type HubFile = {
  id: number;
  name: string;
  path: string;
};

export interface LooseQuestionnaire {
  [key: string]: any;
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
  includeFor?: CategorizedTag[];
  excludeFor?: CategorizedTag[];
}

export interface Answer {
  order: number;
  text: string;
  risk: string;
  rationale?: string;
  mitigation?: string;
  applyTags?: CategorizedTag[];
  autoAnswerFor?: CategorizedTag[];
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
export type Risk = "green" | "yellow" | "red" | "unknown";

export interface InitialAssessment {
  application?: Ref;
  archetype?: Ref;
  questionnaire: Ref;
}
export interface Assessment
  extends Pick<Questionnaire, "thresholds" | "sections" | "riskMessages"> {
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
export interface CategorizedTag {
  category: TagCategory;
  tag: Tag;
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
}
export type ProviderType = "Java" | "Go";

export interface QuestionWithSectionOrder extends Question {
  sectionOrder: number;
}

export interface SectionWithQuestionOrder extends Section {
  questions: QuestionWithSectionOrder[];
}

export interface AssessmentWithSectionOrder extends Assessment {
  sections: SectionWithQuestionOrder[];
}

export interface AssessmentWithArchetypeApplications
  extends AssessmentWithSectionOrder {
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
