import React from "react";
import { Bullseye, Spinner, Skeleton } from "@patternfly/react-core";
import {
  Table,
  TableHeader,
  TableBody,
  IRow,
  TableProps,
} from "@patternfly/react-table";

import { StateNoData } from "./state-no-data";
import { StateNoResults } from "./state-no-results";
import { StateError } from "./state-error";
import "./app-table.css";
import { Application } from "@app/api/models";
import { handlePropagatedRowClick } from "@app/shared/hooks/table-controls";

const ENTITY_FIELD = "entity";

export interface IAppTableProps extends TableProps {
  isLoading: boolean;
  loadingVariant?: "skeleton" | "spinner" | "none";
  fetchError?: any;

  filtersApplied?: boolean;
  noDataState?: any;
  noSearchResultsState?: any;
  errorState?: any;
  onAppClick?: (application: Application) => void;
}

export const AppTable: React.FC<IAppTableProps> = ({
  cells,
  rows,
  "aria-label": ariaLabel = "main-table",

  isLoading,
  fetchError,
  loadingVariant = "skeleton",

  filtersApplied,
  noDataState,
  noSearchResultsState,
  errorState,

  onAppClick,

  ...rest
}) => {
  if (isLoading && loadingVariant !== "none") {
    let rows: IRow[] = [];
    if (loadingVariant === "skeleton") {
      rows = [...Array(3)].map(() => {
        return {
          cells: [...Array(cells.length)].map(() => ({
            title: <Skeleton />,
          })),
        };
      });
    } else if (loadingVariant === "spinner") {
      rows = [
        {
          heightAuto: true,
          cells: [
            {
              props: { colSpan: 8 },
              title: (
                <Bullseye>
                  <Spinner size="xl" />
                </Bullseye>
              ),
            },
          ],
        },
      ];
    } else {
      throw new Error("Can not determine the loading state of table");
    }

    return (
      <Table
        className="app-table"
        aria-label={ariaLabel}
        cells={cells}
        rows={rows}
      >
        <TableHeader />
        <TableBody />
      </Table>
    );
  }

  if (fetchError) {
    return (
      <>
        <Table aria-label={ariaLabel} cells={cells} rows={[]}>
          <TableHeader />
          <TableBody />
        </Table>
        {errorState ? errorState : <StateError />}
      </>
    );
  }

  if (rows.length === 0) {
    return filtersApplied ? (
      <>
        <Table
          className="app-table"
          aria-label={ariaLabel}
          cells={cells}
          rows={[]}
        >
          <TableHeader />
          <TableBody />
        </Table>
        {noSearchResultsState ? noSearchResultsState : <StateNoResults />}
      </>
    ) : (
      <>
        <Table
          className="app-table"
          aria-label={ariaLabel}
          cells={cells}
          rows={[]}
        >
          <TableHeader />
          <TableBody />
        </Table>
        {noDataState ? noDataState : <StateNoData />}
      </>
    );
  }

  return (
    <Table
      className="app-table"
      aria-label={ariaLabel}
      cells={cells}
      rows={rows}
      {...rest}
    >
      <TableHeader />
      <TableBody
        onRowClick={(event, row) => {
          handlePropagatedRowClick(event, () => {
            onAppClick?.(row[ENTITY_FIELD] || null);
          });
        }}
      />
    </Table>
  );
};
