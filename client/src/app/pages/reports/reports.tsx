import { useMemo } from "react";
import * as React from "react";
import { useTranslation } from "react-i18next";
import {
  Card,
  CardBody,
  CardHeader,
  Flex,
  FlexItem,
  PageSection,
  PageSectionVariants,
  Stack,
  StackItem,
  Text,
  TextContent,
} from "@patternfly/react-core";

import { Questionnaire } from "@app/api/models";
import { AppPlaceholder } from "@app/components/AppPlaceholder";
import { ConditionalRender } from "@app/components/ConditionalRender";
import SimpleSelect from "@app/components/FilterToolbar/components/SimpleSelect";
import { StateError } from "@app/components/StateError";
import { useFetchApplications } from "@app/queries/applications";
import { useFetchAssessments } from "@app/queries/assessments";
import { useFetchQuestionnaires } from "@app/queries/questionnaires";
import { toIdRef } from "@app/utils/model-utils";
import { universalComparator } from "@app/utils/utils";

import { ApplicationSelectionContextProvider } from "./application-selection-context";
import { ApplicationLandscape } from "./components/application-landscape";
import { IdentifiedRisksTable } from "./components/identified-risks-table";

const ALL_QUESTIONNAIRES = -1;

export const Reports: React.FC = () => {
  const { t } = useTranslation();

  const {
    assessments,
    isFetching: isAssessmentsFetching,
    fetchError: assessmentsFetchError,
  } = useFetchAssessments();

  const {
    questionnaires,
    isFetching: isQuestionnairesFetching,
    fetchError: questionnairesFetchError,
  } = useFetchQuestionnaires();

  const questionnairesById = useMemo(
    () =>
      questionnaires.reduce<Record<number, Questionnaire>>((byId, q) => {
        byId[q.id] = q;
        return byId;
      }, {}),
    [questionnaires]
  );

  const {
    data: applications,
    isFetching: isApplicationsFetching,
    error: applicationsFetchError,
  } = useFetchApplications();

  const [selectedQuestionnaireId, setSelectedQuestionnaireId] =
    React.useState<number>(ALL_QUESTIONNAIRES);

  const pageHeaderSection = (
    <PageSection variant={PageSectionVariants.light}>
      <TextContent>
        <Text component="h1">{t("terms.reports")}</Text>
      </TextContent>
    </PageSection>
  );

  if (
    applicationsFetchError ||
    assessmentsFetchError ||
    questionnairesFetchError
  ) {
    return (
      <>
        {pageHeaderSection}
        <PageSection>
          <StateError />
        </PageSection>
      </>
    );
  }

  const answeredQuestionnaires: Questionnaire[] =
    isAssessmentsFetching || isQuestionnairesFetching
      ? []
      : Array.from(
          new Set(
            assessments
              .map((assessment) => assessment?.questionnaire?.id)
              .filter((id) => id > 0)
          )
        )
          .map((id) => questionnairesById[id])
          .filter((questionnaire) => questionnaire !== undefined)
          .sort((a, b) => universalComparator(a.name, b.name));

  const isAllQuestionnairesSelected =
    selectedQuestionnaireId === ALL_QUESTIONNAIRES;

  const questionnaire = isAllQuestionnairesSelected
    ? null
    : questionnairesById[selectedQuestionnaireId];

  const assessmentRefs = assessments
    .filter(
      (assessment) =>
        isAllQuestionnairesSelected ||
        assessment.questionnaire.id === selectedQuestionnaireId
    )
    .map((assessment) => toIdRef(assessment))
    .filter(Boolean);

  return (
    <>
      {pageHeaderSection}
      <PageSection>
        <ConditionalRender
          when={
            isApplicationsFetching ||
            isAssessmentsFetching ||
            isQuestionnairesFetching
          }
          then={<AppPlaceholder />}
        >
          <ApplicationSelectionContextProvider
            applications={applications || []}
          >
            <Stack hasGutter>
              <StackItem>
                <Card isClickable isSelectable>
                  <CardHeader>
                    <TextContent>
                      <Flex>
                        <FlexItem>
                          <Text component="h3">
                            {t("terms.currentLandscape")}
                          </Text>
                        </FlexItem>
                        <FlexItem>
                          <SimpleSelect
                            toggleId="select-questionnaires"
                            toggleAriaLabel="select questionnaires dropdown toggle"
                            value={selectedQuestionnaireId.toString()}
                            onSelect={(value) =>
                              setSelectedQuestionnaireId(Number(value))
                            }
                            options={[
                              {
                                value: ALL_QUESTIONNAIRES.toString(),
                                label: "All questionnaires",
                              },
                              ...answeredQuestionnaires.map(
                                (answeredQuestionnaire) => ({
                                  value: answeredQuestionnaire.id.toString(),
                                  label: answeredQuestionnaire.name,
                                })
                              ),
                            ]}
                          />
                        </FlexItem>
                      </Flex>
                    </TextContent>
                  </CardHeader>
                  <CardBody>
                    <ApplicationLandscape
                      questionnaire={questionnaire}
                      assessmentRefs={assessmentRefs}
                    />
                  </CardBody>
                </Card>
              </StackItem>
              <StackItem>
                <Card>
                  <CardHeader>
                    <TextContent>
                      <Text component="h3">{t("terms.identifiedRisks")}</Text>
                    </TextContent>
                  </CardHeader>
                  <CardBody>
                    <IdentifiedRisksTable />
                  </CardBody>
                </Card>
              </StackItem>
            </Stack>
          </ApplicationSelectionContextProvider>
        </ConditionalRender>
      </PageSection>
    </>
  );
};
