import React from "react";
import { Table, Tbody, Td, Th, Thead, Tr } from "@patternfly/react-table";
import { useFetchAssessmentsWithArchetypeApplications } from "@app/queries/assessments";
import { useTranslation } from "react-i18next";
import {
  Answer,
  AssessmentWithArchetypeApplications,
  IdRef,
  Question,
  Ref,
} from "@app/api/models";
import { NoDataEmptyState } from "@app/components/NoDataEmptyState";
import {
  TableHeaderContentWithControls,
  ConditionalTableBody,
  TableRowContentWithControls,
} from "@app/components/TableControls";
import {
  serializeFilterUrlParams,
  useLocalTableControls,
} from "@app/hooks/table-controls";
import { SimplePagination } from "@app/components/SimplePagination";
import {
  TextContent,
  Toolbar,
  ToolbarContent,
  ToolbarItem,
  Text,
  Divider,
} from "@patternfly/react-core";
import { Link } from "react-router-dom";
import { Paths } from "@app/Paths";
import spacing from "@patternfly/react-styles/css/utilities/Spacing/spacing";
import RiskIcon from "@app/components/risk-icon/risk-icon";

export interface IIdentifiedRisksTableProps {
  assessmentRefs?: IdRef[];
}

export const IdentifiedRisksTable: React.FC<IIdentifiedRisksTableProps> = ({
  assessmentRefs,
}) => {
  const { t } = useTranslation();

  const { assessmentsWithArchetypeApplications } =
    useFetchAssessmentsWithArchetypeApplications();

  interface ITableRowData {
    assessmentName: string;
    questionId: string;
    section: string;
    question: Question;
    answer: Answer;
    applications: Ref[];
  }

  const tableData: ITableRowData[] = [];

  const filterAssessmentsByRefs = (
    assessments: AssessmentWithArchetypeApplications[],
    refs: IdRef[]
  ) => {
    if (refs && refs.length > 0) {
      return assessments.filter((assessment) =>
        refs.some((ref) => ref.id === assessment.id)
      );
    }
    return assessments;
  };

  const filteredAssessments = filterAssessmentsByRefs(
    assessmentsWithArchetypeApplications,
    assessmentRefs || []
  );

  filteredAssessments.forEach((assessment) => {
    const combinedApplications = [
      ...(assessment.application ? [assessment.application] : []),
      ...(assessment.archetypeApplications ?? []),
    ];

    const uniqueApplications = combinedApplications.reduce(
      (acc: Ref[], current) => {
        if (!acc.find((item) => item?.id === current.id)) {
          acc.push(current);
        }
        return acc;
      },
      []
    );

    assessment.sections.forEach((section) => {
      section.questions.forEach((question) => {
        question.answers.forEach((answer) => {
          if (answer.selected) {
            const itemId = [
              assessment.questionnaire.id,
              section.order,
              question.order,
              answer.order,
            ].join(".");

            const existingItemIndex = tableData.findIndex(
              (item) => item.questionId === itemId
            );

            if (existingItemIndex !== -1) {
              const existingItem = tableData[existingItemIndex];
              uniqueApplications.forEach((application) => {
                if (
                  !existingItem.applications.some(
                    (app) => app.id === application.id
                  )
                ) {
                  existingItem.applications.push(application);
                }
              });
            } else {
              tableData.push({
                section: section.name,
                question: question,
                answer: answer,
                applications: uniqueApplications ? uniqueApplications : [],
                assessmentName: assessment.questionnaire.name,
                questionId: itemId,
              });
            }
          }
        });
      });
    });
  });

  const tableControls = useLocalTableControls({
    idProperty: "questionId",
    items: tableData || [],
    columnNames: {
      assessmentName: "Assessment Name",
      section: "Section",
      question: "Question",
      answer: "Answer",
      risk: "Risk",
      applications: "Applications",
    },
    variant: "compact",
    isPaginationEnabled: true,
    isSortEnabled: true,
    hasActionsColumn: false,
    getSortValues: (item) => ({
      assessmentName: item.assessmentName,
      section: item.section,
      question: item.question.text,
      answer: item.answer.text,
      applications: item.applications.length,
    }),
    sortableColumns: ["assessmentName", "section", "question", "answer"],
    isExpansionEnabled: true,
    expandableVariant: "single",
  });

  const {
    currentPageItems,
    numRenderedColumns,
    propHelpers: {
      toolbarProps,
      paginationToolbarItemProps,
      paginationProps,
      tableProps,
      getThProps,
      getTrProps,
      getTdProps,
      getExpandedContentTdProps,
    },
    expansionDerivedState: { isCellExpanded },
  } = tableControls;

  return (
    <>
      <Toolbar {...toolbarProps}>
        <ToolbarContent>
          <ToolbarItem {...paginationToolbarItemProps}>
            <SimplePagination
              idPrefix={`${"identified-risks-table"}}`}
              isTop
              paginationProps={paginationProps}
            />
          </ToolbarItem>
        </ToolbarContent>
      </Toolbar>
      <Table
        {...tableProps}
        aria-label={`Adoption Candidate Table`}
        style={{ background: "none" }}
      >
        <Thead>
          <Tr>
            <TableHeaderContentWithControls {...tableControls}>
              <Th {...getThProps({ columnKey: "assessmentName" })}>
                Assessment name
              </Th>
              <Th {...getThProps({ columnKey: "section" })}>Section</Th>
              <Th {...getThProps({ columnKey: "question" })}>Question</Th>
              <Th {...getThProps({ columnKey: "answer" })}>Answer</Th>
              <Th {...getThProps({ columnKey: "risk" })}>Risk</Th>
              <Th {...getThProps({ columnKey: "applications" })}>
                Application
              </Th>
            </TableHeaderContentWithControls>
          </Tr>
        </Thead>
        <ConditionalTableBody
          isNoData={assessmentsWithArchetypeApplications?.length === 0}
          numRenderedColumns={numRenderedColumns}
          noDataEmptyState={
            <div>
              <NoDataEmptyState title="No data available." />
            </div>
          }
        >
          <Tbody>
            {currentPageItems?.map((item, rowIndex) => {
              return (
                <>
                  <Tr key={item.questionId} {...getTrProps({ item: item })}>
                    <TableRowContentWithControls
                      {...tableControls}
                      item={item}
                      rowIndex={rowIndex}
                    >
                      <Td {...getTdProps({ columnKey: "assessmentName" })}>
                        {item.assessmentName}
                      </Td>
                      <Td {...getTdProps({ columnKey: "section" })}>
                        {item?.section ?? "N/A"}
                      </Td>
                      <Td {...getTdProps({ columnKey: "question" })}>
                        {item?.question.text ?? "N/A"}
                      </Td>
                      <Td {...getTdProps({ columnKey: "answer" })}>
                        {item.answer.text ?? "N/A"}
                      </Td>
                      <Td {...getTdProps({ columnKey: "risk" })}>
                        <RiskIcon risk={item.answer.risk} />
                      </Td>
                      <Td {...getTdProps({ columnKey: "applications" })}>
                        {item?.applications.length ? (
                          <Link to={getApplicationsUrl(item?.applications)}>
                            {t("composed.totalApplications", {
                              count: item.applications.length,
                            })}
                          </Link>
                        ) : (
                          "N/A"
                        )}
                      </Td>
                    </TableRowContentWithControls>
                  </Tr>
                  {isCellExpanded(item) ? (
                    <Tr isExpanded>
                      <Td />
                      <Td {...getExpandedContentTdProps({ item: item })}>
                        <TextContent style={{ margin: 5 }}>
                          <Text component="h6">Rationale</Text>
                          <Text component="small">
                            {item?.answer?.rationale
                              ? item.answer.rationale
                              : "N/A"}
                          </Text>
                          <Divider className={spacing.mtMd}></Divider>

                          <Text component="h6">Mitigation</Text>
                          <Text component="small">
                            {item?.answer?.mitigation
                              ? item.answer.mitigation
                              : "N/A"}
                          </Text>
                        </TextContent>
                      </Td>
                    </Tr>
                  ) : null}
                </>
              );
            })}
          </Tbody>
        </ConditionalTableBody>
      </Table>
      <SimplePagination
        idPrefix={`${"identified-risks-table"}}`}
        isTop={false}
        paginationProps={paginationProps}
      />
    </>
  );
};

const getApplicationsUrl = (applications: Ref[]) => {
  const filterValues = {
    name: applications.map((app) => app.name),
  };

  const serializedParams = serializeFilterUrlParams(filterValues);

  const queryString = serializedParams.filters
    ? `filters=${serializedParams.filters}`
    : "";
  return `${Paths.applications}?${queryString}`;
};
