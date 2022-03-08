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

export interface TagType {
  id?: number;
  name: string;
  rank?: number;
  colour?: string;
  tags?: Tag[];
}

export interface Tag {
  id?: number;
  name: string;
  tagType?: Ref;
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
export interface Application {
  id?: number;
  name: string;
  description?: string;
  comments?: string;
  businessService?: Ref;
  tags?: Ref[];
  review?: Review;
  identities?: Ref[];
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
export interface Identity {
  id?: number;
  name?: string;
  description?: string;
  kind?: string;
  createUser?: string;
  encrypted?: string;
  key?: string;
  password?: string;
  user?: string;
  updateUser?: string;
  settings?: string;
}

export interface Proxy {
  host: string;
  kind: string;
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

export interface TagTypePage {
  _embedded: {
    "tag-type": TagType[];
  };
  total_count: number;
}

export interface TagTypePage {
  _embedded: {
    "tag-type": TagType[];
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

export interface Setting {
  key: string;
  value: boolean | undefined;
}

// Analysis Task

export type TaskStatus =
  | "Canceled"
  | "Completed"
  | "Failed"
  | "InProgress"
  | "NotStarted"
  | "Scheduled";

export interface Task {
  id?: number;
  name: string;
  addon: string;
  data: TaskData;
  error?: string;
  image?: string;
  started?: string;
  terminated?: string;
  status?: TaskStatus;
  job?: string;
  report?: TaskReport;
}
export interface TaskData {
  application: number;
  path: string;
  mode: {
    binary: boolean;
    withDeps: boolean;
    artifact?: {
      bucket: number;
      path: string;
    };
  };
  targets: string[];
  scope: {
    withKnown: boolean;
    packages: {
      included: string[];
      excluded: string[];
    };
  };
  rules?: {
    directory: {
      bucket: number;
      path: string;
    };
    tags: {
      included: string[];
      excluded: string[];
    };
  };
}

interface TaskReport {
  activity: string;
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

export interface Rule {
  name: string;
  source: string;
  target: string;
  total: number;
}
