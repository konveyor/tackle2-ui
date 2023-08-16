import React, { useEffect, useState } from "react";
import yaml from "js-yaml";
import {
  Text,
  TextContent,
  PageSection,
  PageSectionVariants,
  Breadcrumb,
  BreadcrumbItem,
  Tab,
  TabTitleText,
  Tabs,
  TabContent,
} from "@patternfly/react-core";
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
              display: "flex",
            }}
          >
            <Tabs
              activeKey={activeTabKey}
              onSelect={handleTabClick}
              isVertical
              aria-label="Tabs in the vertical example"
              role="region"
              width="50px"
              className="tabs-vertical-container"
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
                    <TabContent
                      id={section.name}
                      className="tab-content-container"
                      style={{ flex: 1 }}
                    >
                      <QuestionsTable
                        fetchError={fetchError}
                        questions={activeSection?.questions}
                      />
                    </TabContent>
                  </Tab>
                );
              })}
            </Tabs>
          </div>
        </ConditionalRender>
      </PageSection>
    </>
  );
};

export default Questionnaire;
