import * as React from "react";
import { useTranslation } from "react-i18next";
import {
  Bullseye,
  Spinner,
  Content,
  Content,
  ContentVariants,
} from "@patternfly/react-core";
import spacing from "@patternfly/react-styles/css/utilities/Spacing/spacing";

import { DecoratedApplication } from "../useDecoratedApplications";

import { ApplicationTags } from "./components/application-tags";

export const TabTagsContent: React.FC<{
  application: DecoratedApplication;
}> = ({ application }) => {
  const { t } = useTranslation();
  const task = application.tasks.currentAnalyzer;
  const isTaskRunning = task?.state === "Running";

  return (
    <>
      {isTaskRunning ? (
        <Bullseye className={spacing.mtLg}>
          <Content>
            <Content component={ContentVariants.h3}>
              {t("message.taskInProgressForTags")}
              <Spinner
                isInline
                aria-label="spinner when a new analysis is running"
              />
            </Content>
          </Content>
        </Bullseye>
      ) : null}

      <ApplicationTags application={application} />
    </>
  );
};
