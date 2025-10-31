export const formatPath = (path: Paths, data: any) => {
  let url = path as string;

  for (const k of Object.keys(data)) {
    url = url.replace(":" + k, data[k]);
  }

  return url;
};

export enum Paths {
  base = "/",
  notFound = "/not-found",

  // Developer perspective
  applications = "/applications",
  applicationsAnalysisTab = "/applications/analysis-tab",
  applicationsAssessmentTab = "/applications/assessment-tab",
  applicationsImports = "/applications/application-imports",
  applicationsImportsDetails = "/applications/application-imports/:importId",
  applicationsAssessment = "/applications/assessment/:assessmentId",
  applicationsReview = "/applications/application/:applicationId/review",
  applicationsAnalysis = "/applications/analysis",
  controls = "/controls",
  controlsBusinessServices = "/controls/business-services",
  controlsStakeholders = "/controls/stakeholders",
  controlsStakeholderGroups = "/controls/stakeholder-groups",
  controlsJobFunctions = "/controls/job-functions",
  controlsTags = "/controls/tags",
  reports = "/reports",
  migrationWaves = "/migration-waves",
  waves = "/waves",
  issues = "/issues",
  issuesAllTab = "/issues/all",
  issuesAllAffectedApplications = "/issues/all/:ruleset/:rule/affected-applications",
  issuesSingleAppTab = "/issues/single-app",
  issuesSingleAppSelected = "/issues/single-app/:applicationId",

  dependencies = "/dependencies",

  // Administrator perspective
  general = "/general",
  identities = "/identities",
  repositories = "/repositories",
  repositoriesGit = "/repositories/git",
  repositoriesSvn = "/repositories/svn",
  repositoriesMvn = "/repositories/maven",
  proxies = "/proxies",
  migrationTargets = "/migration-targets",
  assessment = "/assessment",
  questionnaire = "/questionnaire",
  jira = "/jira",
}

export interface AssessmentRoute {
  assessmentId: string;
}

export interface ReviewRoute {
  applicationId: string;
}

export interface ImportSummaryRoute {
  importId: string;
}
