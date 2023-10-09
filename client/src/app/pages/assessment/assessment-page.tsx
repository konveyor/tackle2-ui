import React, { useState } from "react";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { AxiosError } from "axios";
import {
  Alert,
  AlertActionCloseButton,
  Bullseye,
  PageSection,
  PageSectionTypes,
} from "@patternfly/react-core";
import BanIcon from "@patternfly/react-icons/dist/esm/icons/ban-icon";
import { AssessmentRoute } from "@app/Paths";
import { getAxiosErrorMessage } from "@app/utils/utils";
import { SimpleEmptyState } from "@app/components/SimpleEmptyState";
import { useFetchAssessmentById } from "@app/queries/assessments";
import { AssessmentPageHeader } from "./components/assessment-page-header";
import { AssessmentWizard } from "./components/assessment-wizard/assessment-wizard";

const AssessmentPage: React.FC = () => {
  const { t } = useTranslation();

  const { assessmentId } = useParams<AssessmentRoute>();

  const { assessment, isFetching, fetchError } =
    useFetchAssessmentById(assessmentId);

  const [saveError, setSaveError] = useState<AxiosError>();

  if (fetchError) {
    return (
      <>
        <PageSection variant="light">
          <AssessmentPageHeader assessment={assessment} />
        </PageSection>
        <PageSection variant="light" type={PageSectionTypes.wizard}>
          <Bullseye>
            <SimpleEmptyState
              icon={BanIcon}
              title={t("message.couldNotFetchTitle")}
              description={t("message.couldNotFetchBody") + "."}
            />
          </Bullseye>
        </PageSection>
      </>
    );
  }
  return (
    <>
      <PageSection variant="light">
        <AssessmentPageHeader assessment={assessment} />
      </PageSection>
      <PageSection variant="light" type={PageSectionTypes.wizard}>
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
        <AssessmentWizard
          assessment={assessment}
          isOpen
          isLoadingAssessment={isFetching}
        />
      </PageSection>
    </>
  );
};
export default AssessmentPage;
