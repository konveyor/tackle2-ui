import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Bullseye,
  Button,
  ButtonVariant,
  Card,
  CardBody,
  CardExpandableContent,
  CardHeader,
  CardTitle,
  Flex,
  FlexItem,
  MenuToggle,
  MenuToggleElement,
  PageSection,
  PageSectionVariants,
  Popover,
  Select,
  SelectOption,
  Split,
  SplitItem,
  Stack,
  StackItem,
  Text,
  TextContent,
  ToggleGroup,
  ToggleGroupItem,
} from "@patternfly/react-core";
import HelpIcon from "@patternfly/react-icons/dist/esm/icons/help-icon";

import { AppPlaceholder } from "@app/components/AppPlaceholder";
import { ConditionalRender } from "@app/components/ConditionalRender";
import { StateError } from "@app/components/StateError";
import { ApplicationSelectionContextProvider } from "./application-selection-context";
import { Landscape } from "./components/landscape";
import { AdoptionPlan } from "./components/adoption-plan";
import { IdentifiedRisksTable } from "./components/identified-risks-table";
import { useFetchApplications } from "@app/queries/applications";
import { useFetchAssessments } from "@app/queries/assessments";

export const Reports: React.FC = () => {
  // i18
  const { t } = useTranslation();

  const [isQuestionnaireSelectOpen, setIsQuestionnaireSelectOpen] =
    React.useState<boolean>(false);

  const [selectedQuestionnaire, setSelectedQuestionnaire] =
    React.useState<string>("All questionnaires");

  const { assessments } = useFetchAssessments();

  // Cards
  const [isAdoptionCandidateTable, setIsAdoptionCandidateTable] =
    useState(true);
  const [isAdoptionPlanOpen, setAdoptionPlanOpen] = useState(false);
  const [isRiskCardOpen, setIsRiskCardOpen] = useState(false);

  const {
    data: applications,
    isFetching,
    error: fetchError,
  } = useFetchApplications();
  const pageHeaderSection = (
    <PageSection variant={PageSectionVariants.light}>
      <TextContent>
        <Text component="h1">{t("terms.reports")}</Text>
      </TextContent>
    </PageSection>
  );

  if (fetchError) {
    return (
      <>
        {pageHeaderSection}
        <PageSection>
          <StateError />
        </PageSection>
      </>
    );
  }

  const toggle = (toggleRef: React.Ref<MenuToggleElement>) => (
    <MenuToggle
      ref={toggleRef}
      aria-label="kebab dropdown toggle"
      onClick={() => {
        setIsQuestionnaireSelectOpen(!isQuestionnaireSelectOpen);
      }}
      isExpanded={isQuestionnaireSelectOpen}
    >
      {selectedQuestionnaire}
    </MenuToggle>
  );

  const onSelectQuestionnaire = (
    _event: React.MouseEvent<Element, MouseEvent> | undefined,
    value: string | number | undefined
  ) => {
    setSelectedQuestionnaire(value as string);
    setIsQuestionnaireSelectOpen(false);
  };

  return (
    <>
      {pageHeaderSection}
      <PageSection>
        <ConditionalRender when={isFetching} then={<AppPlaceholder />}>
          <ApplicationSelectionContextProvider
            applications={applications || []}
          >
            <Stack hasGutter>
              <StackItem>
                <Card>
                  <CardHeader>
                    <Flex>
                      <FlexItem>
                        <TextContent>
                          <Text component="h3">
                            {t("terms.currentLandscape")}
                          </Text>
                        </TextContent>
                      </FlexItem>
                      <FlexItem>
                        <Select
                          id="select-questionnaires"
                          isOpen={isQuestionnaireSelectOpen}
                          selected={selectedQuestionnaire}
                          onSelect={onSelectQuestionnaire}
                          onOpenChange={(_isOpen) =>
                            setIsQuestionnaireSelectOpen(false)
                          }
                          toggle={toggle}
                          shouldFocusToggleOnSelect
                        >
                          <SelectOption key={0} value="All questionnaires">
                            All questionnaires
                          </SelectOption>
                          {assessments.map((assessment, index) => (
                            <SelectOption
                              key={index}
                              value={assessment.questionnaire.name}
                            >
                              {assessment.questionnaire.name}
                            </SelectOption>
                          ))}
                        </Select>
                      </FlexItem>
                    </Flex>
                  </CardHeader>
                  <CardBody>
                    <Bullseye>
                      <Landscape />
                    </Bullseye>
                  </CardBody>
                </Card>
              </StackItem>
              <StackItem>
                <Card>
                  <CardHeader
                    actions={{
                      actions: (
                        <ToggleGroup>
                          <ToggleGroupItem
                            key={0}
                            text={t("terms.tableView")}
                            isSelected={isAdoptionCandidateTable}
                            onChange={() => {
                              setIsAdoptionCandidateTable(true);
                            }}
                          />
                          <ToggleGroupItem
                            key={1}
                            text={t("terms.graphView")}
                            isSelected={!isAdoptionCandidateTable}
                            onChange={() => {
                              setIsAdoptionCandidateTable(false);
                            }}
                          />
                        </ToggleGroup>
                      ),
                    }}
                  >
                    <CardTitle>
                      <TextContent>
                        <Text component="h3">
                          {t("terms.adoptionCandidateDistribution")}
                        </Text>
                      </TextContent>
                    </CardTitle>
                  </CardHeader>
                  <CardBody>
                    {/* {isAdoptionCandidateTable ? (
                      <AdoptionCandidateTable allApplications={applications} />
                    ) : (
                      <AdoptionCandidateGraph />
                    )} */}
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
              <StackItem>
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
              </StackItem>
            </Stack>
          </ApplicationSelectionContextProvider>
        </ConditionalRender>
      </PageSection>
    </>
  );
};
