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
          // Check if there is a clickable element between the event target and the row such as a
          // checkbox, button or link. Don't trigger the row click if those are clicked.
          // This recursive parent check is necessary because the event target could be,
          // for example, the SVG icon inside a button rather than the button itself.
          const isClickableElementInTheWay = (element: Element): boolean => {
            if (
              ["input", "button", "a"].includes(element.tagName.toLowerCase())
            ) {
              return true;
            }
            if (
              !element.parentElement ||
              element.parentElement?.tagName.toLowerCase() === "tr"
            ) {
              return false;
            }
            return isClickableElementInTheWay(element.parentElement);
          };
          if (
            event.target instanceof Element &&
            !isClickableElementInTheWay(event.target)
          ) {
            onAppClick?.(row[ENTITY_FIELD] || null);
          }
        }}
      />
    </Table>
  );
};
