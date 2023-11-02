import React, { useContext, useMemo } from "react";
import { Table, Tbody, Td, Th, Thead, Tr } from "@patternfly/react-table";

import { useLocalTableControls } from "@app/hooks/table-controls";
import {
  ConditionalTableBody,
  TableHeaderContentWithControls,
  TableRowContentWithControls,
} from "@app/components/TableControls";
import { NoDataEmptyState } from "@app/components/NoDataEmptyState";
import { Application, Review } from "@app/api/models"; // Add the necessary model imports
import { ApplicationSelectionContext } from "../../application-selection-context";
import { useFetchReviews } from "@app/queries/reviews";
import { RiskLabel } from "@app/components/RiskLabel";

interface AdoptionCandidateTableProps {
  allApplications?: Application[];
}
export interface TableRowData {
  id: string | number;
  application: Application;
  review: Review | null;
}

const AdoptionCandidateTable: React.FC<AdoptionCandidateTableProps> = () => {
  const { reviews } = useFetchReviews();

  const {
    allItems: allApplications,
    selectedItems: selectedApplications,
    areAllSelected: areAllApplicationsSelected,
    isItemSelected: isApplicationSelected,
    toggleItemSelected: toggleApplicationSelected,
    selectAll: selectAllApplication,
    setSelectedItems: setSelectedRows,
    selectMultiple: selectMultipleApplications,
  } = useContext(ApplicationSelectionContext);

  const applicationsWithReviews: TableRowData[] = useMemo(() => {
    const combined = allApplications.map((app) => {
      const matchingReview = reviews?.find(
        (review) => review.application?.id === app.id
      );
      return {
        id: app.id,
        application: app,
        review: matchingReview || null,
      };
    });
    return combined;
  }, [allApplications, reviews]);

  const tableControls = useLocalTableControls({
    idProperty: "id",
    items: applicationsWithReviews || [],
    columnNames: {
      applicationName: "Application Name",
      criticality: "Criticality",
      priority: "Priority",
      confidence: "Confidence",
      effort: "Effort",
      risk: "Risk",
    },
    variant: "compact",
  });

  const {
    currentPageItems,
    numRenderedColumns,
    selectionState,
    propHelpers: { tableProps, getThProps, getTrProps, getTdProps },
  } = tableControls;

  return (
    <Table
      {...tableProps}
      aria-label={`Adoption Candidate Table`}
      style={{ background: "none" }}
    >
      <Thead>
        <Tr>
          <TableHeaderContentWithControls {...tableControls}>
            <Th {...getThProps({ columnKey: "applicationName" })}>
              Application Name
            </Th>
            <Th {...getThProps({ columnKey: "criticality" })}>Criticality</Th>
            <Th {...getThProps({ columnKey: "priority" })}>Priority</Th>
            <Th {...getThProps({ columnKey: "confidence" })}>Confidence</Th>
            <Th {...getThProps({ columnKey: "effort" })}>Effort</Th>
            <Th {...getThProps({ columnKey: "risk" })}>Risk</Th>
          </TableHeaderContentWithControls>
        </Tr>
      </Thead>
      <ConditionalTableBody
        isNoData={allApplications?.length === 0}
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
              <Tr key={item.id} {...getTrProps({ item: item })}>
                <TableRowContentWithControls
                  {...tableControls}
                  item={item}
                  rowIndex={rowIndex}
                >
                  <Td {...getTdProps({ columnKey: "applicationName" })}>
                    {item.application.name}
                  </Td>
                  <Td {...getTdProps({ columnKey: "criticality" })}>
                    {item?.review?.businessCriticality ?? "N/A"}
                  </Td>
                  <Td {...getTdProps({ columnKey: "priority" })}>
                    {item?.review?.workPriority ?? "N/A"}
                  </Td>
                  <Td {...getTdProps({ columnKey: "confidence" })}>
                    {item.application.confidence ?? "N/A"}
                  </Td>
                  <Td {...getTdProps({ columnKey: "effort" })}>
                    {item?.review?.effortEstimate ?? "N/A"}
                  </Td>
                  <Td {...getTdProps({ columnKey: "risk" })}>
                    <RiskLabel risk={item.application.risk || "unknown"} />
                  </Td>
                </TableRowContentWithControls>
              </Tr>
            );
          })}
        </Tbody>
      </ConditionalTableBody>
    </Table>
  );
};

export default AdoptionCandidateTable;
