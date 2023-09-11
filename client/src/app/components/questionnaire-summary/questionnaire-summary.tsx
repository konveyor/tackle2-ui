import React, { useState, useMemo } from "react";
import {
  Tabs,
  Tab,
  SearchInput,
  Toolbar,
  ToolbarItem,
  ToolbarContent,
  TextContent,
  PageSection,
  PageSectionVariants,
  Breadcrumb,
  BreadcrumbItem,
  Button,
  Text,
} from "@patternfly/react-core";
import AngleLeftIcon from "@patternfly/react-icons/dist/esm/icons/angle-left-icon";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Paths } from "@app/Paths";
import { ConditionalRender } from "@app/components/ConditionalRender";
import { AppPlaceholder } from "@app/components/AppPlaceholder";
import QuestionsTable from "@app/components/questions-table/questions-table";
import { Assessment, Questionnaire } from "@app/api/models";
import QuestionnaireSectionTabTitle from "./components/questionnaire-section-tab-title";
import { AxiosError } from "axios";
import { formatPath } from "@app/utils/utils";

export enum SummaryType {
  Assessment = "Assessment",
  Questionnaire = "Questionnaire",
}

interface QuestionnaireSummaryProps {
  isFetching: boolean;
  fetchError: AxiosError | null;
  summaryData: Assessment | Questionnaire | undefined;
  summaryType: SummaryType;
}

const QuestionnaireSummary: React.FC<QuestionnaireSummaryProps> = ({
  summaryData,
  summaryType,
  isFetching,
  fetchError,
}) => {
  const { t } = useTranslation();

  const [activeSectionIndex, setActiveSectionIndex] = useState<"all" | number>(
    "all"
  );

  const handleTabClick = (
    _event: React.MouseEvent<any> | React.KeyboardEvent | MouseEvent,
    tabKey: string | number
  ) => {
    setActiveSectionIndex(tabKey as "all" | number);
  };

  const [searchValue, setSearchValue] = useState("");

  const filteredSummaryData = useMemo<Assessment | Questionnaire | null>(() => {
    if (!summaryData) return null;

    return {
      ...summaryData,
      sections: summaryData?.sections.map((section) => ({
        ...section,
        questions: section.questions.filter(({ text, explanation }) =>
          [text, explanation].some(
            (text) => text?.toLowerCase().includes(searchValue.toLowerCase())
          )
        ),
      })),
    };
  }, [summaryData, searchValue]);

  const allQuestions =
    summaryData?.sections.flatMap((section) => section.questions) || [];
  const allMatchingQuestions =
    filteredSummaryData?.sections.flatMap((section) => section.questions) || [];

  if (!summaryData) {
    return <div>No data available.</div>;
  }
  const BreadcrumbPath =
    summaryType === SummaryType.Assessment ? (
      <Breadcrumb>
        <BreadcrumbItem>
          <Link
            to={formatPath(Paths.assessmentActions, {
              applicationId: (summaryData as Assessment)?.application?.id,
            })}
          >
            Assessment
          </Link>
        </BreadcrumbItem>
        <BreadcrumbItem to="#" isActive>
          {summaryData?.name}
        </BreadcrumbItem>
      </Breadcrumb>
    ) : (
      <Breadcrumb>
        <BreadcrumbItem>
          <Link to={Paths.assessment}>Assessment</Link>
        </BreadcrumbItem>
        <BreadcrumbItem to="#" isActive>
          {summaryData?.name}
        </BreadcrumbItem>
      </Breadcrumb>
    );
  return (
    <>
      <PageSection variant={PageSectionVariants.light}>
        <TextContent>
          <Text component="h1">{summaryType}</Text>
        </TextContent>
        {BreadcrumbPath}
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

            <Link
              to={
                summaryType === SummaryType.Assessment
                  ? formatPath(Paths.assessmentActions, {
                      applicationId: (summaryData as Assessment)?.application
                        ?.id,
                    })
                  : Paths.assessment
              }
            >
              <Button variant="link" icon={<AngleLeftIcon />}>
                Back to {summaryType.toLowerCase()}
              </Button>
            </Link>
            <div className="tabs-vertical-container">
              <Tabs
                activeKey={activeSectionIndex}
                onSelect={handleTabClick}
                isVertical
                aria-label="Tabs for summaryData sections"
                role="region"
              >
                {[
                  <Tab
                    key="all"
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
                      fetchError={fetchError}
                      questions={allMatchingQuestions}
                      isSearching={!!searchValue}
                      data={summaryData}
                      isAllQuestionsTab
                      hideAnswerKey={summaryType === SummaryType.Assessment}
                    />
                  </Tab>,
                  ...(summaryData?.sections.map((section, index) => {
                    const filteredQuestions =
                      filteredSummaryData?.sections[index]?.questions || [];
                    return (
                      <Tab
                        key={index}
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
                          fetchError={fetchError}
                          questions={filteredQuestions}
                          isSearching={!!searchValue}
                          data={summaryData}
                          hideAnswerKey={summaryType === SummaryType.Assessment}
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

export default QuestionnaireSummary;
