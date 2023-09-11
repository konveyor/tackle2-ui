import React from "react";
import { Table, Tbody, Td, Th, Thead, Tr } from "@patternfly/react-table";

import { useLocalTableControls } from "@app/hooks/table-controls";
import {
  ConditionalTableBody,
  TableHeaderContentWithControls,
  TableRowContentWithControls,
} from "@app/components/TableControls";
import { NoDataEmptyState } from "@app/components/NoDataEmptyState";
import { Application, Assessment, Questionnaire } from "@app/api/models";
import DynamicAssessmentButton from "./dynamic-assessment-button";
import {
  assessmentsByAppIdQueryKey,
  useDeleteAssessmentMutation,
} from "@app/queries/assessments";
import { Button } from "@patternfly/react-core";
import { TrashIcon } from "@patternfly/react-icons";
import { NotificationsContext } from "@app/components/NotificationsContext";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { getAxiosErrorMessage } from "@app/utils/utils";
import { AxiosError } from "axios";

interface QuestionnairesTableProps {
  tableName: string;
  isFetching: boolean;
  application?: Application;
  assessments?: Assessment[];
  questionnaires?: Questionnaire[];
}

const QuestionnairesTable: React.FC<QuestionnairesTableProps> = ({
  assessments,
  questionnaires,
  isFetching,
  application,
  tableName,
}) => {
  const { t } = useTranslation();
  const { pushNotification } = React.useContext(NotificationsContext);
  const queryClient = useQueryClient();

  const onDeleteAssessmentSuccess = (name: string) => {
    pushNotification({
      title: t("toastr.success.assessmentDiscarded", {
        application: name,
      }),
      variant: "success",
    });
    queryClient.invalidateQueries([assessmentsByAppIdQueryKey]);
  };

  const onDeleteError = (error: AxiosError) => {
    pushNotification({
      title: getAxiosErrorMessage(error),
      variant: "danger",
    });
  };

  const { mutate: deleteAssessment } = useDeleteAssessmentMutation(
    onDeleteAssessmentSuccess,
    onDeleteError
  );

  if (!questionnaires) {
    return <div>Application is undefined</div>;
  }

  const tableControls = useLocalTableControls({
    idProperty: "id",
    items: questionnaires,
    columnNames: {
      questionnaires: tableName,
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

  if (!questionnaires || !application) {
    return <div>No data available.</div>;
  }

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
            {currentPageItems?.map((questionnaire, rowIndex) => {
              const matchingAssessment = assessments?.find(
                (assessment) => assessment.questionnaire.id === questionnaire.id
              );
              return (
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
                      <DynamicAssessmentButton
                        questionnaire={questionnaire}
                        assessments={assessments}
                        application={application}
                      />
                    </Td>
                    {matchingAssessment ? (
                      <Td isActionCell>
                        <Button
                          type="button"
                          variant="plain"
                          onClick={() => {
                            deleteAssessment({
                              id: matchingAssessment.id,
                              name: matchingAssessment.name,
                            });
                          }}
                        >
                          <TrashIcon />
                        </Button>
                      </Td>
                    ) : null}
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

export default QuestionnairesTable;
