import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { AxiosError } from "axios";
import {
  Alert,
  AlertActionCloseButton,
  Bullseye,
} from "@patternfly/react-core";
import BanIcon from "@patternfly/react-icons/dist/esm/icons/ban-icon";
import yaml from "js-yaml";

import { AssessmentRoute } from "@app/Paths";
import { Assessment } from "@app/api/models";
import { getAssessmentById } from "@app/api/rest";
import { getAxiosErrorMessage } from "@app/utils/utils";
import { ApplicationAssessmentPage } from "./components/application-assessment-page";
import { ApplicationAssessmentWizard } from "./components/application-assessment-wizard";
import { SimpleEmptyState } from "@app/components/SimpleEmptyState";
import { ConditionalRender } from "@app/components/ConditionalRender";
import { AppPlaceholder } from "@app/components/AppPlaceholder";
import { useFetchAssessmentByID } from "@app/queries/assessments";

export const ApplicationAssessment: React.FC = () => {
  const { t } = useTranslation();

  const { assessmentId } = useParams<AssessmentRoute>();
  const { assessment, isFetching, fetchError } =
    useFetchAssessmentByID(assessmentId);

  const [saveError, setSaveError] = useState<AxiosError>();

  if (fetchError) {
    return (
      <ApplicationAssessmentPage assessment={assessment}>
        <Bullseye>
          <SimpleEmptyState
            icon={BanIcon}
            title={t("message.couldNotFetchTitle")}
            description={t("message.couldNotFetchBody") + "."}
          />
        </Bullseye>
      </ApplicationAssessmentPage>
    );
  }
  return (
    <>
      <ApplicationAssessmentPage assessment={assessment}>
        {saveError && (
          <Alert
            variant="danger"
            isInline
            title={getAxiosErrorMessage(saveError)}
            actionClose={
              <AlertActionCloseButton onClose={() => setSaveError(undefined)} />
            }
          />
        )}
        <ConditionalRender when={isFetching} then={<AppPlaceholder />}>
          <ApplicationAssessmentWizard
            assessment={assessment}
            isOpen
          ></ApplicationAssessmentWizard>
        </ConditionalRender>
      </ApplicationAssessmentPage>{" "}
    </>
  );
};
