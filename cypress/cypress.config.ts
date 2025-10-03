const dotenv = require("dotenv");
dotenv.config();

import { defineConfig } from "cypress";
import cypressFastFail from "cypress-fail-fast/plugin";
import { tagify } from "cypress-tags";
import decompress from "decompress";
import esbuildPreprocessor from "../cypress/support/esbuild-preprocessor";
const { downloadFile } = require("cypress-downloadfile/lib/addPlugin");
const { verifyDownloadTasks } = require("cy-verify-downloads");

export default defineConfig({
  viewportWidth: 1920,
  viewportHeight: 1080,
  video: false,
  env: {
    jira_stage_datacenter_url: "https://issues.stage.redhat.com/",
    jira_stage_bearer_token: "",
    jira_stage_basic_login: "",
    jira_stage_basic_password: "",
    jira_atlassian_cloud_email: "",
    jira_atlassian_cloud_token: "",
    jira_atlassian_cloud_url: "",
    jira_atlassian_cloud_project: "Test",
    jira_stage_datacenter_project_id: 12335626,
    rwx_enabled: true,
    logLevel: "VERBOSE",
    mtaVersion: "",
    FAIL_FAST_PLUGIN: true,
    FAIL_FAST_ENABLED: false,
    metricsUrl: "",
  },
  retries: {
    runMode: 0,
    openMode: 0,
  },
  reporter: "cypress-multi-reporters",
  reporterOptions: {
    reporterEnabled: "cypress-mochawesome-reporter, mocha-junit-reporter",
    cypressMochawesomeReporterReporterOptions: {
      reportDir: "cypress/reports",
      charts: true,
      reportPageTitle: "Tackle test report",
      embeddedScreenshots: true,
      inlineAssets: true,
    },
    mochaJunitReporterReporterOptions: {
      mochaFile: "cypress/reports/junit/results-[hash].xml",
    },
  },
  defaultCommandTimeout: 8000,
  e2e: {
    baseUrl: process.env.CYPRESS_BASE_URL,
    specPattern: [
      "e2e/tests/login.test.ts",
      "e2e/tests/**/*.test.{js,jsx,ts,tsx}",
    ],
    supportFile: "support/e2e.ts",
    fixturesFolder: "fixtures",
    experimentalMemoryManagement: true,

    setupNodeEvents(on, config) {
      config.env.baseUrl = process.env.CYPRESS_BASE_URL;
      config.env.initialPassword = process.env.CYPRESS_INITIAL_PASSWORD;
      config.env.user = process.env.CYPRESS_USER;
      config.env.pass = process.env.CYPRESS_PASSWORD;
      config.env.keycloakAdminPassword =
        process.env.CYPRESS_KEYCLOAK_ADMIN_PASSWORD;
      config.env.git_user = process.env.CYPRESS_GIT_USER;
      config.env.git_password = process.env.CYPRESS_GIT_PASSWORD;
      config.env.svn_user = process.env.CYPRESS_SVN_USER;
      config.env.svn_password = process.env.CYPRESS_SVN_PASSWORD;

      //Plugins
      esbuildPreprocessor(on);
      on("file:preprocessor", tagify(config));
      cypressFastFail(on, config);
      require("cypress-fs/plugins")(on, config);

      on("task", { downloadFile });
      on("task", verifyDownloadTasks);
      on("task", {
        unzip: ({ path, file }) => {
          decompress(path + file, path + "/" + file.split(".")[0]);
          return null;
        },
      });
      return config;
    },
  },
});
