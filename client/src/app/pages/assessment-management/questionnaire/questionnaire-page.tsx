import React, { useEffect, useState, useMemo } from "react";
import yaml from "js-yaml";
import {
  Text,
  TextContent,
  PageSection,
  PageSectionVariants,
  Breadcrumb,
  BreadcrumbItem,
  Button,
  Tabs,
  Toolbar,
  ToolbarItem,
  SearchInput,
  ToolbarContent,
  Tab,
} from "@patternfly/react-core";
import AngleLeftIcon from "@patternfly/react-icons/dist/esm/icons/angle-left-icon";
import { Assessment } from "@app/api/models";
import { Link } from "react-router-dom";
import { Paths } from "@app/Paths";
import { ConditionalRender } from "@app/components/ConditionalRender";
import { AppPlaceholder } from "@app/components/AppPlaceholder";
import { useTranslation } from "react-i18next";
import QuestionnaireSectionTabTitle from "./components/questionnaire-section-tab-title";
import QuestionsTable from "./components/questions-table";
import "./questionnaire-page.css";
import { useFetchQuestionnaires } from "@app/queries/questionnaires";

const Questionnaire: React.FC = () => {
  const { t } = useTranslation();

  const [activeSectionIndex, setActiveSectionIndex] = React.useState<
    "all" | number
  >("all");

  const handleTabClick = (
    _event: React.MouseEvent<any> | React.KeyboardEvent | MouseEvent,
    tabKey: string | number
  ) => {
    setActiveSectionIndex(tabKey as "all" | number);
  };

  const [assessmentData, setAssessmentData] = useState<Assessment | null>(null);

  const { questionnaires, isFetching, fetchError } = useFetchQuestionnaires();

  const [searchValue, setSearchValue] = React.useState("");
  const filteredAssessmentData = useMemo<Assessment | null>(() => {
    if (!assessmentData) return null;
    return {
      ...assessmentData,
      sections: assessmentData?.sections.map((section) => ({
        ...section,
        questions: section.questions.filter(({ text, explanation }) =>
          [text, explanation].some(
            (text) => text?.toLowerCase().includes(searchValue.toLowerCase())
          )
        ),
      })),
    };
  }, [assessmentData, searchValue]);
  const allQuestions =
    assessmentData?.sections.flatMap((section) => section.questions) || [];
  const allMatchingQuestions =
    filteredAssessmentData?.sections.flatMap((section) => section.questions) ||
    [];

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
        <ConditionalRender when={isFetching} then={<AppPlaceholder />}>
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
                    resultsCount={
                      (searchValue && allMatchingQuestions.length) || undefined
                    }
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
                activeKey={activeSectionIndex}
                onSelect={handleTabClick}
                isVertical
                aria-label="Tabs for questionnaire sections"
                role="region"
              >
                {[
                  <Tab
                    eventKey="all"
                    title={
                      <QuestionnaireSectionTabTitle
                        isSearching={!!searchValue}
                        sectionName="All questions"
                        unfilteredQuestions={allQuestions}
                        filteredQuestions={allMatchingQuestions}
                      />
                    }
                  >
                    <QuestionsTable
                      fetchError={fetchError as Error}
                      questions={allMatchingQuestions}
                      isSearching={!!searchValue}
                      assessmentData={assessmentData}
                      isAllQuestionsTab
                    />
                  </Tab>,
                  ...(assessmentData?.sections.map((section, index) => {
                    const filteredQuestions =
                      filteredAssessmentData?.sections[index]?.questions || [];
                    return (
                      <Tab
                        eventKey={index}
                        title={
                          <QuestionnaireSectionTabTitle
                            isSearching={!!searchValue}
                            sectionName={section.name}
                            unfilteredQuestions={section.questions}
                            filteredQuestions={filteredQuestions}
                          />
                        }
                      >
                        <QuestionsTable
                          fetchError={fetchError as Error}
                          questions={filteredQuestions}
                          isSearching={!!searchValue}
                          assessmentData={assessmentData}
                        />
                      </Tab>
                    );
                  }) || []),
                ]}
              </Tabs>
            </div>
          </div>
        </ConditionalRender>
      </PageSection>
    </>
  );
};

export default Questionnaire;
