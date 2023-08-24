import React from "react";
import { useTranslation } from "react-i18next";
import { Table, Tbody, Td, Th, Thead, Tr } from "@patternfly/react-table";

import { useLocalTableControls } from "@app/hooks/table-controls";
import {
  ConditionalTableBody,
  TableHeaderContentWithControls,
  TableRowContentWithControls,
} from "@app/components/TableControls";
import { NoDataEmptyState } from "@app/components/NoDataEmptyState";
import { Questionnaire } from "@app/api/models";
import { Button } from "@patternfly/react-core";
export interface AssessmentActionsTableProps {
  questionnaires: Questionnaire[];
}

const AssessmentActionsTable: React.FC<AssessmentActionsTableProps> = ({
  questionnaires,
}) => {
  const tableControls = useLocalTableControls({
    idProperty: "id",
    items: questionnaires,
    columnNames: {
      questionnaires: "Required questionnaires",
    },
    hasActionsColumn: false,
    hasPagination: false,
    variant: "compact",
  });
  const {
    currentPageItems,
    numRenderedColumns,
    propHelpers: { tableProps, getThProps, getTdProps },
  } = tableControls;

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
            </TableHeaderContentWithControls>
          </Tr>
        </Thead>
        <ConditionalTableBody
          isNoData={questionnaires.length === 0}
          numRenderedColumns={numRenderedColumns}
          noDataEmptyState={
            <div>
              <NoDataEmptyState title="No assessments are associated with this application." />
            </div>
          }
        >
          <Tbody>
            {currentPageItems?.map((questionnaire, rowIndex) => (
              <>
                <Tr key={questionnaire.name}>
                  <TableRowContentWithControls
                    {...tableControls}
                    item={questionnaire}
                    rowIndex={rowIndex}
                  >
                    <Td
                      width={20}
                      {...getTdProps({ columnKey: "questionnaires" })}
                    >
                      {questionnaire.name}
                    </Td>
                    <Td>
                      <Button
                        type="button"
                        variant="primary"
                        onClick={() => console.log("trigger assessment")}
                      >
                        Take
                      </Button>
                    </Td>
                  </TableRowContentWithControls>
                </Tr>
              </>
            ))}
          </Tbody>
        </ConditionalTableBody>
      </Table>
    </>
  );
};

export default AssessmentActionsTable;
