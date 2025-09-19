import React from "react";
import { useTranslation } from "react-i18next";
import {
  Bullseye,
  Spinner,
  Text,
  TextContent,
  TextVariants,
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
          <TextContent>
            <Text component={TextVariants.h3}>
              {t("message.taskInProgressForTags")}
              <Spinner
                isInline
                aria-label="spinner when a new analysis is running"
              />
            </Text>
          </TextContent>
        </Bullseye>
      ) : null}

      <ApplicationTags application={application} />
    </>
  );
};
