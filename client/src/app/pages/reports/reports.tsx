import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Button,
  ButtonVariant,
  Card,
  CardBody,
  CardExpandableContent,
  CardHeader,
  CardTitle,
  MenuToggle,
  PageSection,
  PageSectionVariants,
  Popover,
  Select,
  SelectOption,
  Stack,
  StackItem,
  Text,
  TextContent,
} from "@patternfly/react-core";
import { HelpIcon } from "@patternfly/react-icons";

import { Questionnaire } from "@app/api/models";
import { useFetchApplications } from "@app/queries/applications";
import { useFetchAssessments } from "@app/queries/assessments";
import { useFetchQuestionnaires } from "@app/queries/questionnaires";

import { AppPlaceholder } from "@app/components/AppPlaceholder";
import { ConditionalRender } from "@app/components/ConditionalRender";
import { StateError } from "@app/components/StateError";

import { ApplicationSelectionContextProvider } from "./application-selection-context";
import { Landscape } from "./components/landscape";
import AdoptionCandidateTable from "./components/adoption-candidate-table/adoption-candidate-table";
import { AdoptionPlan } from "./components/adoption-plan";

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

  const [isAdoptionPlanOpen, setAdoptionPlanOpen] = useState(false);

  const [isRiskCardOpen, setIsRiskCardOpen] = useState(false);

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
      : assessments
          .map((assessment) => assessment?.questionnaire?.id)
          .filter((id) => id > 0)
          .map((id) => questionnairesById[id])
          .sort((a, b) => a.name.localeCompare(b.name))
          .filter((questionnaire) => questionnaire !== undefined);

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
                  <CardHeader
                    actions={{
                      hasNoOffset: false,
                      actions: (
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
                          <SelectOption
                            key={ALL_QUESTIONNAIRES}
                            value={ALL_QUESTIONNAIRES}
                          >
                            All questionnaires
                          </SelectOption>
                          {...answeredQuestionnaires.map(
                            (answeredQuestionnaire) => (
                              <SelectOption
                                key={answeredQuestionnaire.id}
                                value={answeredQuestionnaire.id}
                              >
                                {answeredQuestionnaire.name}
                              </SelectOption>
                            )
                          )}
                        </Select>
                      ),
                    }}
                  >
                    <TextContent>
                      <Text component="h3">{t("terms.currentLandscape")}</Text>
                    </TextContent>
                  </CardHeader>
                  <CardBody>
                    <Landscape
                      questionnaire={
                        selectedQuestionnaireId === ALL_QUESTIONNAIRES
                          ? null
                          : questionnairesById[selectedQuestionnaireId]
                      }
                      assessments={
                        selectedQuestionnaireId === ALL_QUESTIONNAIRES
                          ? assessments
                          : assessments.filter(
                              ({ questionnaire }) =>
                                questionnaire.id === selectedQuestionnaireId
                            )
                      }
                    />
                  </CardBody>
                </Card>
              </StackItem>
              <StackItem>
                <Card isClickable isSelectable>
                  <CardHeader>
                    <CardTitle>
                      <TextContent>
                        <Text component="h3">
                          {t("terms.adoptionCandidateDistribution")}
                        </Text>
                      </TextContent>
                    </CardTitle>
                  </CardHeader>
                  <CardBody>
                    <AdoptionCandidateTable />
                  </CardBody>
                </Card>
              </StackItem>
              <StackItem>
                <Card isExpanded={isAdoptionPlanOpen}>
                  <CardHeader
                    onExpand={() => setAdoptionPlanOpen((current) => !current)}
                  >
                    <CardTitle style={{ marginTop: -6 }}>
                      <TextContent>
                        <Text component="h3">
                          {t("terms.suggestedAdoptionPlan")}
                          <Popover
                            bodyContent={
                              <div>
                                {t("message.suggestedAdoptionPlanHelpText")}
                              </div>
                            }
                            position="right"
                          >
                            <Button
                              type="button"
                              aria-label="More info"
                              onClick={(e) => e.preventDefault()}
                              isInline
                              variant={ButtonVariant.plain}
                            >
                              <HelpIcon />
                            </Button>
                          </Popover>
                        </Text>
                      </TextContent>
                    </CardTitle>
                  </CardHeader>
                  <CardExpandableContent>
                    <CardBody style={{ maxHeight: 700, overflowY: "auto" }}>
                      {isAdoptionPlanOpen && <AdoptionPlan />}
                    </CardBody>
                  </CardExpandableContent>
                </Card>
              </StackItem>
              {/* <StackItem>
                <Card isExpanded={isRiskCardOpen}>
                  <CardHeader
                    onExpand={() => setIsRiskCardOpen((current) => !current)}
                  >
                    <CardTitle>
                      <Split style={{ marginTop: -3 }}>
                        <SplitItem>
                          <Bullseye>
                            <TextContent>
                              <Text component="h3">
                                {t("terms.identifiedRisks")}
                              </Text>
                            </TextContent>
                          </Bullseye>
                        </SplitItem>
                      </Split>
                    </CardTitle>
                  </CardHeader>
                  <CardExpandableContent>
                    <CardBody>
                      {isRiskCardOpen && <IdentifiedRisksTable />}
                    </CardBody>
                  </CardExpandableContent>
                </Card>
              </StackItem> */}
            </Stack>
          </ApplicationSelectionContextProvider>
        </ConditionalRender>
      </PageSection>
    </>
  );
};
