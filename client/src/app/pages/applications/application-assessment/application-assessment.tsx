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

import { AssessmentRoute } from "@app/Paths";
import { Assessment } from "@app/api/models";
import { getAssessmentById } from "@app/api/rest";
import { getAxiosErrorMessage } from "@app/utils/utils";
import { ApplicationAssessmentPage } from "./components/application-assessment-page";
import { ApplicationAssessmentWizard } from "./components/application-assessment-wizard";
import { SimpleEmptyState } from "@app/components/SimpleEmptyState";
import { ConditionalRender } from "@app/components/ConditionalRender";
import { AppPlaceholder } from "@app/components/AppPlaceholder";

export const ApplicationAssessment: React.FC = () => {
  const { t } = useTranslation();

  const { assessmentId } = useParams<AssessmentRoute>();

  const [saveError, setSaveError] = useState<AxiosError>();

  const [assessment, setAssessment] = useState<Assessment>();
  const [isFetchingAssessment, setIsFetchingAssessment] = useState(true);
  const [fetchAssessmentError, setFetchAssessmentError] =
    useState<AxiosError>();

  useEffect(() => {
    if (assessmentId) {
      setIsFetchingAssessment(true);

      getAssessmentById(assessmentId)
        .then(({ data }) => {
          setIsFetchingAssessment(false);
          setAssessment(data);
        })
        .catch((error) => {
          setIsFetchingAssessment(false);
          setFetchAssessmentError(error);
        });
    }
  }, [assessmentId]);

  if (fetchAssessmentError) {
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
        <ConditionalRender
          when={isFetchingAssessment}
          then={<AppPlaceholder />}
        >
          <ApplicationAssessmentWizard
            assessment={assessment}
            isOpen
          ></ApplicationAssessmentWizard>
        </ConditionalRender>
      </ApplicationAssessmentPage>{" "}
    </>
  );
};
