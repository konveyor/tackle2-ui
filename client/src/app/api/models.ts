export interface PageQuery {
  page: number;
  perPage: number;
}

export interface SortByQuery {
  index: number;
  direction: "asc" | "desc";
}

export interface PageRepresentation<T> {
  meta: Meta;
  data: T[];
}

export interface Meta {
  count: number;
}

// Controls

export interface BusinessService {
  id?: number;
  name: string;
  description?: string;
  owner?: Stakeholder;
}

export interface Stakeholder {
  id?: number;
  name: string;
  email: string;
  jobFunction?: JobFunction;
  stakeholderGroups?: Ref[];
  businessServices?: Ref[];
}

export interface StakeholderGroup {
  id?: number;
  name: string;
  description?: string;
  stakeholders?: Ref[];
}
export interface Ref {
  id?: number;
  name: string;
}

export interface JobFunction {
  id?: number;
  name: string;
  stakeholders?: Array<Ref>;
}

export interface TagCategory {
  id?: number;
  name: string;
  rank?: number;
  colour?: string;
  tags?: Tag[];
}

export interface Tag {
  id?: number;
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
  id?: number;
  name: string;
  description?: string;
  comments?: string;
  businessService?: Ref;
  tags?: TagRef[];
  review?: Ref;
  identities?: Ref[];
  repository?: Repository;
  binary?: string;
}

export interface Review {
  id?: number;
  proposedAction: ProposedAction;
  effortEstimate: EffortEstimate;
  businessCriticality: number;
  workPriority: number;
  comments?: string;
  application?: Application;
}

export interface ApplicationDependency {
  id?: number;
  from: Application;
  to: Application;
}

export interface ApplicationAdoptionPlan {
  applicationId: number;
  applicationName: string;
  positionX: number;
  positionY: number;
  effort: number;
  decision: ProposedAction;
  effortEstimate: string;
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

export interface BulkCopyReview {
  id?: number;
  sourceReview: number;
  targetApplications: number[];
  completed?: boolean;
}

export type IdentityKind = "source" | "maven" | "proxy";

export interface Identity {
  id?: number;
  name?: string;
  description?: string;
  kind?: IdentityKind;
  createUser?: string;
  encrypted?: string;
  key?: string;
  keyFilename?: string;
  password?: string;
  user?: string;
  updateUser?: string;
  settings?: string;
  settingsFilename?: string;
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

// Pathfinder

export type AssessmentStatus = "EMPTY" | "STARTED" | "COMPLETE";
export type Risk = "GREEN" | "AMBER" | "RED" | "UNKNOWN";

export interface Assessment {
  id?: number;
  applicationId: number;
  status: AssessmentStatus;
  stakeholders?: number[];
  stakeholderGroups?: number[];
  questionnaire: Questionnaire;
}

export interface Questionnaire {
  categories: QuestionnaireCategory[];
}

export interface QuestionnaireCategory {
  id: number;
  order: number;
  title?: string;
  comment?: string;
  questions: Question[];
}

export interface Question {
  id: number;
  order: number;
  question: string;
  description: string;
  options: QuestionOption[];
}

export interface QuestionOption {
  id: number;
  order: number;
  option: string;
  checked: boolean;
  risk: Risk;
}

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

export interface BulkCopyAssessment {
  bulkId?: number;
  fromAssessmentId: number;
  applications: { applicationId: number }[];
  completed?: boolean;
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
  "download.csv.enabled": boolean;
  "download.html.enabled": boolean;
  "git.insecure.enabled": boolean;
  "mvn.dependencies.update.forced": boolean;
  "mvn.insecure.enabled": boolean;
  "review.assessment.required": boolean;
  "svn.insecure.enabled": boolean;
  "ui.bundle.order": number[];
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
  | "Ready"
  | "Pending"
  | "Postponed";

export interface Task {
  id?: number;
  createTime?: string;
  application: { id: number };
  name: string;
  addon: string;
  data: TaskData;
  error?: string;
  image?: string;
  started?: string;
  terminated?: string;
  state?: TaskState;
  job?: string;
  report?: TaskReport;
}

export interface TaskData {
  tagger: {
    enabled: boolean;
  };
  output: string;
  mode: {
    binary: boolean;
    withDeps: boolean;
    artifact: string;
    diva: boolean;
    csv?: boolean;
  };
  targets: string[];
  sources: string[];
  scope: {
    withKnown: boolean;
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
    bundles: Ref[];
    repository?: Repository;
    identity?: Ref;
  };
}

interface TaskReport {
  activity: string[];
  completed: number;
  createTime: string;
  createUser: string;
  error: string;
  id: number;
  status: string;
  task: number;
  total: number;
  updateUser: string;
}

export interface TaskgroupTask {
  name: string;
  data: any;
  application: Ref;
}

export interface Taskgroup {
  id?: number;
  name: string;
  addon: string;
  data: TaskData;
  tasks: TaskgroupTask[];
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

export interface RuleBundleImage {
  id: number;
  name?: string;
}

export enum RuleBundleKind {
  CATEGORY = "category",
}

export interface RuleBundle {
  createTime?: string;
  createUser?: string;
  description?: string;
  id: number;
  image?: RuleBundleImage;
  kind?: RuleBundleKind;
  name: string;
  rulesets: Ruleset[];
  custom?: boolean;
  repository?: Repository;
  identity?: Ref;
}
export interface Metadata {
  target: string;
  source?: string;
}
export interface Ruleset {
  name: string;
  metadata: Metadata;
  file?: {
    id: number;
  };
}

export interface ParsedRule {
  source: string | null;
  target: string | null;
  total: number;
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
}

export interface Wave {
  name: string;
  id?: number;
  startDate: string;
  endDate: string;
  applications: Application[];
  stakeholders: Stakeholder[];
  status: string;
}
