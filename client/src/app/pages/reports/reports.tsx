import { useMemo } from "react";
import * as React from "react";
import { useTranslation } from "react-i18next";
import {
  Card,
  CardBody,
  CardHeader,
  Content,
  Flex,
  FlexItem,
  MenuToggle,
  PageSection,
  Select,
  SelectList,
  SelectOption,
  Stack,
  StackItem,
} from "@patternfly/react-core";

import { Questionnaire } from "@app/api/models";
import { AppPlaceholder } from "@app/components/AppPlaceholder";
import { ConditionalRender } from "@app/components/ConditionalRender";
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

  const [isQuestionnaireSelectOpen, setIsQuestionnaireSelectOpen] =
    React.useState<boolean>(false);

  const [selectedQuestionnaireId, setSelectedQuestionnaireId] =
    React.useState<number>(ALL_QUESTIONNAIRES);

  const pageHeaderSection = (
    <PageSection>
      <Content>
        <h1>{t("terms.reports")}</h1>
      </Content>
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

  const onSelectQuestionnaire = (
    _event: React.MouseEvent<Element, MouseEvent> | undefined,
    value: string | number | undefined
  ) => {
    setSelectedQuestionnaireId(value as number);
    setIsQuestionnaireSelectOpen(false);
  };

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
                    <Content>
                      <Flex>
                        <FlexItem>
                          <h3>{t("terms.currentLandscape")}</h3>
                        </FlexItem>
                        <FlexItem>
                          <Select
                            id="select-questionnaires"
                            isOpen={isQuestionnaireSelectOpen}
                            selected={selectedQuestionnaireId}
                            onSelect={onSelectQuestionnaire}
                            onOpenChange={(_isOpen) =>
                              setIsQuestionnaireSelectOpen(false)
                            }
                            toggle={(toggleRef) => (
                              <MenuToggle
                                ref={toggleRef}
                                aria-label="select questionnaires dropdown toggle"
                                onClick={() => {
                                  setIsQuestionnaireSelectOpen(
                                    !isQuestionnaireSelectOpen
                                  );
                                }}
                                isExpanded={isQuestionnaireSelectOpen}
                              >
                                {selectedQuestionnaireId === ALL_QUESTIONNAIRES
                                  ? "All questionnaires"
                                  : questionnairesById[selectedQuestionnaireId]
                                      ?.name}
                              </MenuToggle>
                            )}
                            shouldFocusToggleOnSelect
                          >
                            <SelectList>
                              <SelectOption
                                key={ALL_QUESTIONNAIRES}
                                value={ALL_QUESTIONNAIRES}
                              >
                                All questionnaires
                              </SelectOption>
                              {answeredQuestionnaires.map(
                                (answeredQuestionnaire) => (
                                  <SelectOption
                                    key={answeredQuestionnaire.id}
                                    value={answeredQuestionnaire.id}
                                  >
                                    {answeredQuestionnaire.name}
                                  </SelectOption>
                                )
                              )}
                            </SelectList>
                          </Select>
                        </FlexItem>
                      </Flex>
                    </Content>
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
                    <Content>
                      <h3>{t("terms.identifiedRisks")}</h3>
                    </Content>
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
