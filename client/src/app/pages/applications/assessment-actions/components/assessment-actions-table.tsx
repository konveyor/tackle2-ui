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
import {
  Application,
  Assessment,
  InitialAssessment,
  Questionnaire,
} from "@app/api/models";
import { Button } from "@patternfly/react-core";
import { Paths, formatPath } from "@app/Paths";
import { useHistory } from "react-router-dom";
import { useFetchQuestionnaires } from "@app/queries/questionnaires";
import { useCreateAssessmentMutation } from "@app/queries/assessments";
export interface AssessmentActionsTableProps {
  application?: Application;
}

const AssessmentActionsTable: React.FC<AssessmentActionsTableProps> = ({
  application,
}) => {
  const { questionnaires } = useFetchQuestionnaires();

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

  const onSuccessHandler = () => {};
  const onErrorHandler = () => {};

  const history = useHistory();
  const { mutateAsync: createAssessmentAsync } = useCreateAssessmentMutation(
    onSuccessHandler,
    onErrorHandler
  );

  const handleAssessmentCreationAndNav = async (
    questionnaire: Questionnaire
  ) => {
    //TODO handle archetypes here too
    if (!application) {
      console.error("Application is undefined. Cannot proceed.");
      return;
    }

    // Replace with your actual assessment data
    const newAssessment: InitialAssessment = {
      questionnaire: { name: questionnaire.name, id: questionnaire.id },
      application: { name: application.name, id: application?.id },
      //TODO handle archetypes here too
    };

    try {
      const result = await createAssessmentAsync(newAssessment);
      history.push(
        formatPath(Paths.applicationsAssessment, {
          assessmentId: result.id,
        })
      );
    } catch (error) {
      console.error("Error while creating assessment:", error);
    }
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
            </TableHeaderContentWithControls>
          </Tr>
        </Thead>
        <ConditionalTableBody
          isNoData={questionnaires.length === 0}
          numRenderedColumns={numRenderedColumns}
          noDataEmptyState={
            <div>
              <NoDataEmptyState title="No Questionnaires are currently available to be taken. " />
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
                        //TODO:Dynamic assessment button. Determine if matching assessment. Derive button status from that
                        onClick={() =>
                          handleAssessmentCreationAndNav(questionnaire)
                        }
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
