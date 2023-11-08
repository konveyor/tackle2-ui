import React from "react";
import { Table, Tbody, Td, Th, Thead, Tr } from "@patternfly/react-table";
import { useFetchAssessments } from "@app/queries/assessments";
import { useTranslation } from "react-i18next";
import { Ref } from "@app/api/models";
import { NoDataEmptyState } from "@app/components/NoDataEmptyState";
import {
  TableHeaderContentWithControls,
  ConditionalTableBody,
  TableRowContentWithControls,
} from "@app/components/TableControls";
import { useLocalTableControls } from "@app/hooks/table-controls";
import { SimplePagination } from "@app/components/SimplePagination";
import { Toolbar, ToolbarContent, ToolbarItem } from "@patternfly/react-core";

export interface IIdentifiedRisksTableProps {}

export const IdentifiedRisksTable: React.FC<
  IIdentifiedRisksTableProps
> = () => {
  const { t } = useTranslation();

  const { assessments } = useFetchAssessments();

  interface ITableRowData {
    assessmentName: string;
    questionId: string;
    section: string;
    question: string;
    answer: string;
    applications: Ref[];
  }

  const tableData: ITableRowData[] = [];

  // ...
  assessments.forEach((assessment) => {
    assessment.sections.forEach((section) => {
      section.questions.forEach((question) => {
        question.answers.forEach((answer) => {
          if (answer.selected) {
            const itemId = [
              assessment.id,
              section.order,
              question.order,
              answer.order,
            ].join(".");

            const existingItemIndex = tableData.findIndex(
              (item) => item.questionId === itemId
            );

            if (existingItemIndex !== -1) {
              const existingItem = tableData[existingItemIndex];
              if (
                assessment.application &&
                !existingItem.applications
                  .map((app) => app.name)
                  .includes(assessment.application.name)
              ) {
                existingItem.applications.push(assessment.application);
              }
            } else {
              tableData.push({
                section: section.name,
                question: question.text,
                answer: answer.text,
                applications: assessment.application
                  ? [assessment.application]
                  : [],
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
      applications: "Applications",
    },
    variant: "compact",
    isPaginationEnabled: true,
    isSortEnabled: true,
    hasActionsColumn: false,
    getSortValues: (item) => ({
      assessmentName: item.assessmentName,
      section: item.section,
      question: item.question,
      answer: item.answer,
      applications: item.applications.length,
    }),
    sortableColumns: ["assessmentName", "section", "question", "answer"],
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
    },
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
              <Th {...getThProps({ columnKey: "applications" })}>
                Application
              </Th>
            </TableHeaderContentWithControls>
          </Tr>
        </Thead>
        <ConditionalTableBody
          isNoData={assessments?.length === 0}
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
                      {item?.question ?? "N/A"}
                    </Td>
                    <Td {...getTdProps({ columnKey: "answer" })}>
                      {item.answer ?? "N/A"}
                    </Td>
                    <Td {...getTdProps({ columnKey: "applications" })}>
                      {item?.applications.length ?? "N/A"}
                    </Td>
                  </TableRowContentWithControls>
                </Tr>
              );
            })}
          </Tbody>
        </ConditionalTableBody>
      </Table>
    </>
  );
};
