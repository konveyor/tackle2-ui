// Controls

export interface BusinessServiceRef {
  id?: number;
  name: string;
}
export interface BusinessService {
  id?: number;
  name: string;
  description?: string;
  owner?: StakeholderRef;
}

export interface StakeholderRef {
  id?: number;
  name: string;
}
export interface Stakeholder {
  id?: number;
  name: string;
  email: string;
  jobFunction?: JobFunction;
  stakeholderGroups?: StakeholderGroupRef[];
}
export interface StakeholderGroup {
  id?: number;
  name: string;
  description?: string;
  stakeholders?: StakeholderRef[];
}

export interface StakeholderGroupRef {
  id?: number;
  name: string;
}

export interface JobFunction {
  id?: number;
  name: string;
  stakeholders: Array<StakeholderRef>;
}

export interface TagType {
  id?: number;
  name: string;
  rank?: number;
  colour?: string;
  tags?: Tag[];
}
export interface TagTypeRef {
  id?: number;
  name: string;
}

export interface Tag {
  id?: number;
  name: string;
  tagType?: TagType;
}

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
  description?: string;
  data: { application?: number };
  status: TaskStatus;
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
  businessService?: BusinessServiceRef;
  tags?: string[];
  review?: Review;
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
  name: string;
  description?: string;
  kind: string;
  createUser: string;
  encrypted?: string;
  key?: string;
  password?: string;
  user?: string;
  updateUser?: string;
  settings?: string;
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

export interface Setting {
  key: string;
  value: boolean | undefined;
}
