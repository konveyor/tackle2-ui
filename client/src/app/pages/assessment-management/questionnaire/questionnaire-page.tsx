import React, { useEffect, useState } from "react";
import yaml from "js-yaml";
import {
  Text,
  TextContent,
  PageSection,
  PageSectionVariants,
  Breadcrumb,
  BreadcrumbItem,
  Button,
  Tab,
  TabTitleText,
  Tabs,
  Toolbar,
  ToolbarItem,
  SearchInput,
  ToolbarContent,
} from "@patternfly/react-core";
import AngleLeftIcon from "@patternfly/react-icons/dist/esm/icons/angle-left-icon";
import { YamlAssessment } from "@app/api/models";
import { Link } from "react-router-dom";
import { Paths } from "@app/Paths";
import { ConditionalRender } from "@app/components/ConditionalRender";
import { AppPlaceholder } from "@app/components/AppPlaceholder";
import { useTranslation } from "react-i18next";
import "./questionnaire-page.css";
import QuestionsTable from "./components/questions-table";

const Questionnaire: React.FC = () => {
  const { t } = useTranslation();

  const [activeTabKey, setActiveTabKey] = React.useState<number>(0);

  const handleTabClick = (
    event: React.MouseEvent<any> | React.KeyboardEvent | MouseEvent,
    tabIndex: string | number
  ) => {
    setActiveTabKey(tabIndex as number);
  };

  const [assessmentData, setAssessmentData] = useState<YamlAssessment | null>(
    null
  );
  const activeSection = assessmentData?.sections[activeTabKey];

  // ------------------------!!
  // TODO: replace this with the real data from the API
  const fetchError = false;

  useEffect(() => {
    fetch("/questionnaire-data.yaml") // adjust this path
      .then((response) => response.text())
      .then((data) => {
        const parsedData = yaml.load(data) as YamlAssessment;
        setAssessmentData(parsedData);
      });
  }, []);
  // ------------------------!!

  const [searchValue, setSearchValue] = React.useState("");

  return (
    <>
      <PageSection variant={PageSectionVariants.light}>
        <TextContent>
          <Text component="h1">Questionnaire</Text>
        </TextContent>
        <Breadcrumb>
          <BreadcrumbItem>
            <Link to={Paths.assessment}>Assessment</Link>
          </BreadcrumbItem>
          <BreadcrumbItem to="#" isActive>
            {assessmentData?.name}
          </BreadcrumbItem>
        </Breadcrumb>
      </PageSection>
      <PageSection>
        <ConditionalRender
          // TODO: add loading state
          // when={isFetching && !(currentPageDataFromReactQuery || fetchError)}
          when={fetchError}
          then={<AppPlaceholder />}
        >
          <div
            style={{
              backgroundColor: "var(--pf-v5-global--BackgroundColor--100)",
            }}
          >
            <Toolbar>
              <ToolbarContent>
                <ToolbarItem widths={{ default: "300px" }}>
                  <SearchInput
                    placeholder="Search questions"
                    value={searchValue}
                    onChange={(_event, value) => setSearchValue(value)}
                    onClear={() => setSearchValue("")}
                    resultsCount={2}
                  />
                </ToolbarItem>
              </ToolbarContent>
            </Toolbar>
            <Link to={Paths.assessment}>
              <Button variant="link" icon={<AngleLeftIcon />}>
                Back to questionnaires
              </Button>
            </Link>
            <div className="tabs-vertical-container">
              <Tabs
                activeKey={activeTabKey}
                onSelect={handleTabClick}
                isVertical
                aria-label="Tabs for questionnaire sections"
                role="region"
              >
                {assessmentData?.sections.map((section, index) => {
                  return (
                    <Tab
                      eventKey={index}
                      title={
                        <TabTitleText aria-label="vertical" role="region">
                          {section.name}
                        </TabTitleText>
                      }
                    >
                      <QuestionsTable
                        fetchError={fetchError}
                        questions={activeSection?.questions}
                      />
                    </Tab>
                  );
                })}
              </Tabs>
            </div>
          </div>
        </ConditionalRender>
      </PageSection>
    </>
  );
};

export default Questionnaire;
