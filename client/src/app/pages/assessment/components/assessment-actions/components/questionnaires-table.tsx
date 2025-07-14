import "./questionnaires-table.css";
import React, { useState } from "react";
import { Table, Tbody, Td, Th, Thead, Tr } from "@patternfly/react-table";

import { useLocalTableControls } from "@app/hooks/table-controls";
import {
  ConditionalTableBody,
  TableHeaderContentWithControls,
  TableRowContentWithControls,
} from "@app/components/TableControls";
import { NoDataEmptyState } from "@app/components/NoDataEmptyState";
import {
  Application,
  Archetype,
  AssessmentWithSectionOrder,
  Questionnaire,
} from "@app/api/models";
import DynamicAssessmentActionsRow from "./dynamic-assessment-actions-row";
import AssessmentModal from "../../assessment-wizard/assessment-wizard-modal";

interface QuestionnairesTableProps {
  tableName: string;
  isFetching: boolean;
  isReadonly?: boolean;
  application?: Application;
  archetype?: Archetype;
  assessments?: AssessmentWithSectionOrder[];
  questionnaires?: Questionnaire[];
}

const QuestionnairesTable: React.FC<QuestionnairesTableProps> = ({
  assessments,
  questionnaires,
  isReadonly,
  application,
  archetype,
  tableName,
}) => {
  const tableControls = useLocalTableControls({
    tableName: "questionnaires-table",
    idProperty: "id",
    dataNameProperty: "name",
    items: questionnaires || [],
    columnNames: {
      questionnaires: tableName,
    },
    variant: "compact",
  });

  const {
    currentPageItems,
    numRenderedColumns,
    propHelpers: { tableProps, getThProps, getTrProps, getTdProps },
  } = tableControls;

  const [createdAssessment, setCreatedAssessment] =
    useState<AssessmentWithSectionOrder | null>(null);
  const handleModalOpen = (assessment: AssessmentWithSectionOrder) => {
    setCreatedAssessment(assessment);
  };

  const handleModalClose = () => {
    setCreatedAssessment(null);
  };

  return (
    <>
      <Table
        {...tableProps}
        aria-label={`Questionnaire table for assessment actions`}
        style={{ background: "none" }}
      >
        <Thead>
          <Tr>
            <TableHeaderContentWithControls {...tableControls}>
              <Th {...getThProps({ columnKey: "questionnaires" })} />
              {application || archetype ? (
                <Th screenReaderText="row actions" />
              ) : null}
            </TableHeaderContentWithControls>
          </Tr>
        </Thead>
        <ConditionalTableBody
          isNoData={questionnaires?.length === 0}
          numRenderedColumns={numRenderedColumns}
          noDataEmptyState={
            <div>
              <NoDataEmptyState title="No Questionnaires are currently available to be taken. " />
            </div>
          }
        >
          <Tbody>
            {currentPageItems?.map((questionnaire, rowIndex) => {
              const matchingArchetypeAssessment = assessments?.find(
                (assessment) =>
                  assessment.questionnaire.id === questionnaire.id &&
                  assessment?.archetype?.id === archetype?.id
              );

              const matchingApplicationAssessment = assessments?.find(
                (assessment) =>
                  assessment.questionnaire.id === questionnaire.id &&
                  assessment?.application?.id === application?.id
              );

              return (
                <Tr key={questionnaire.name} className="actions-row">
                  <TableRowContentWithControls
                    {...tableControls}
                    item={questionnaire}
                    rowIndex={rowIndex}
                  >
                    <Td
                      width={20}
                      {...getTdProps({ columnKey: "questionnaires" })}
                      className="actions-col"
                    >
                      {questionnaire.name}
                    </Td>
                    {application || archetype ? (
                      <DynamicAssessmentActionsRow
                        assessment={
                          archetype
                            ? matchingArchetypeAssessment
                            : matchingApplicationAssessment
                        }
                        questionnaire={questionnaire}
                        application={application}
                        archetype={archetype}
                        isReadonly={isReadonly}
                        onOpenModal={handleModalOpen}
                      />
                    ) : null}
                  </TableRowContentWithControls>
                </Tr>
              );
            })}
          </Tbody>
        </ConditionalTableBody>
      </Table>
      <AssessmentModal
        isOpen={!!createdAssessment}
        onRequestClose={handleModalClose}
        assessment={createdAssessment}
      />
    </>
  );
};

export default QuestionnairesTable;
