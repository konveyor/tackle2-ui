import React from "react";
import {
  TableComposable,
  Thead,
  Tr,
  Th,
  Tbody,
  Td,
  TdProps,
  ExpandableRowContent,
} from "@patternfly/react-table";

import { Application, Stakeholder, Wave } from "@app/api/models";
import dayjs from "dayjs";

export const WavesTable: React.FunctionComponent = () => {
  var now = dayjs();
  // In real usage, this data would come from some external source like an API via props.
  const waves: Wave[] = [
    {
      name: "wave1",
      startDate: "2018-02-03 22:15:01",
      endDate: "2020-01-03 22:15:014",
      applications: [{ name: "app1" }, { name: "app2" }],
      stakeholders: [{ name: "sh1", email: "aaakwd@aol.com" }],
      status: "n/a",
    },
    {
      name: "wave2",
      startDate: "2019-03-03 22:15:01",
      endDate: "2020-01-03 22:15:014",
      applications: [{ name: "app3" }, { name: "app4" }],
      stakeholders: [{ name: "sh1", email: "aaakwd@aol.com" }],
      status: "n/a",
    },
  ];

  const columnNames = {
    name: "Name",
    startDate: "Start date",
    endDate: "End date",
    applications: "Applications",
    stakeholders: "Stakeholders",
    status: "Status",
  };

  type ColumnKey = keyof typeof columnNames;

  const [expandedCells, setExpandedCells] = React.useState<
    Record<string, ColumnKey>
  >({
    wave1: "applications", // Default to the first cell of the first row being expanded
  });
  const setCellExpanded = (
    application: Application,
    columnKey: ColumnKey,
    isExpanding = true
  ) => {
    const newExpandedCells = { ...expandedCells };
    if (isExpanding) {
      newExpandedCells[application.name] = columnKey;
    } else {
      delete newExpandedCells[application.name];
    }
    setExpandedCells(newExpandedCells);
  };
  const compoundExpandParams = (
    application: Application,
    columnKey: ColumnKey,
    rowIndex: number,
    columnIndex: number
  ): TdProps["compoundExpand"] => ({
    isExpanded: expandedCells[application.name] === columnKey,
    onToggle: () =>
      setCellExpanded(
        application,
        columnKey,
        expandedCells[application.name] !== columnKey
      ),
    expandId: "composable-compound-expandable-example",
    rowIndex,
    columnIndex,
  });

  return (
    <TableComposable aria-label="Compound expandable table">
      <Thead>
        <Tr>
          <Th>{columnNames.name}</Th>
          <Th>{columnNames.startDate}</Th>
          <Th>{columnNames.endDate}</Th>
          <Th>{columnNames.applications}</Th>
          <Th>{columnNames.stakeholders}</Th>
          <Th>{columnNames.status}</Th>
          <Th />
        </Tr>
      </Thead>
      {waves.map((wave: Wave, rowIndex: number) => {
        const expandedCellKey = expandedCells[wave.name];
        const isRowExpanded = !!expandedCellKey;
        return (
          <Tbody key={wave.name} isExpanded={isRowExpanded}>
            <Tr>
              <Td width={25} dataLabel={columnNames.name} component="th">
                {wave.name}
              </Td>
              <Td width={25} dataLabel={columnNames.startDate} component="th">
                {dayjs(wave.startDate).format("DD/MM/YYYY")}
              </Td>
              <Td width={25} dataLabel={columnNames.endDate} component="th">
                {dayjs(wave.endDate).format("DD/MM/YYYY")}
              </Td>
              <Td
                width={10}
                dataLabel={columnNames.applications}
                compoundExpand={compoundExpandParams(
                  wave,
                  "applications",
                  rowIndex,
                  1
                )}
              >
                {wave.applications.length}
              </Td>
              <Td
                width={10}
                dataLabel={columnNames.stakeholders}
                compoundExpand={compoundExpandParams(
                  wave,
                  "stakeholders",
                  rowIndex,
                  2
                )}
              >
                {wave.stakeholders.length}
              </Td>
              <Td width={15} dataLabel={columnNames.status}>
                {wave.status}
              </Td>
            </Tr>
            {isRowExpanded ? (
              <Tr isExpanded={isRowExpanded}>
                <Td
                  dataLabel={columnNames[expandedCellKey]}
                  noPadding
                  colSpan={6}
                >
                  {expandedCellKey === "applications" && (
                    <ExpandableRowContent>
                      <div className="pf-u-m-md">
                        {wave.applications.map((app) => (
                          <div>{app.name}</div>
                        ))}
                      </div>
                    </ExpandableRowContent>
                  )}

                  {expandedCellKey === "stakeholders" && (
                    <ExpandableRowContent>
                      <div className="pf-u-m-md">
                        {wave.stakeholders.map((sh) => (
                          <div>
                            {sh.name} - {sh.email}
                          </div>
                        ))}
                      </div>
                    </ExpandableRowContent>
                  )}
                </Td>
              </Tr>
            ) : null}
          </Tbody>
        );
      })}
    </TableComposable>
  );
};
