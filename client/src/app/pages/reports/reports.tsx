import React, { useState } from "react";
import { useTranslation } from "react-i18next";

import {
  Bullseye,
  Card,
  CardActions,
  CardBody,
  CardExpandableContent,
  CardHeader,
  CardTitle,
  PageSection,
  PageSectionVariants,
  Popover,
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

import {
  AppPlaceholder,
  ConditionalRender,
  StateError,
} from "@app/shared/components";
import { ApplicationSelectionContextProvider } from "./application-selection-context";
import { Landscape } from "./components/landscape";
import { AdoptionCandidateTable } from "./components/adoption-candidate-table";
import { AdoptionPlan } from "./components/adoption-plan";
import { IdentifiedRisksTable } from "./components/identified-risks-table";
import { AdoptionCandidateGraph } from "./components/adoption-candidate-graph/adoption-candidate-graph";
import { useFetchApplications } from "@app/queries/applications";

export const Reports: React.FC = () => {
  // i18
  const { t } = useTranslation();

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
                    <TextContent>
                      <Text component="h3">{t("terms.currentLandscape")}</Text>
                    </TextContent>
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
                  <CardHeader>
                    <CardActions>
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
                    </CardActions>
                    <CardTitle>
                      <TextContent>
                        <Text component="h3">
                          {t("terms.adoptionCandidateDistribution")}
                        </Text>
                      </TextContent>
                    </CardTitle>
                  </CardHeader>
                  <CardBody>
                    {isAdoptionCandidateTable ? (
                      <AdoptionCandidateTable allApplications={applications} />
                    ) : (
                      <AdoptionCandidateGraph />
                    )}
                  </CardBody>
                </Card>
              </StackItem>
              <StackItem>
                <Card isExpanded={isAdoptionPlanOpen}>
                  <CardHeader
                    onExpand={() => setAdoptionPlanOpen((current) => !current)}
                  >
                    <CardTitle>
                      <Split style={{ marginTop: -5 }}>
                        <SplitItem>
                          <Bullseye style={{ marginTop: -3 }}>
                            <TextContent>
                              <Text component="h3">
                                {t("terms.suggestedAdoptionPlan")}
                              </Text>
                            </TextContent>
                          </Bullseye>
                        </SplitItem>
                        <SplitItem>
                          <Popover
                            bodyContent={
                              <div>
                                {t("message.suggestedAdoptionPlanHelpText")}
                              </div>
                            }
                            position="right"
                          >
                            <button
                              type="button"
                              aria-label="More info"
                              onClick={(e) => e.preventDefault()}
                              className="pf-c-button pf-m-plain"
                            >
                              <HelpIcon />
                            </button>
                          </Popover>
                        </SplitItem>
                      </Split>
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
