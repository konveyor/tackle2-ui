import React from "react";
import { mount, shallow } from "enzyme";
import { Label, Skeleton, Spinner } from "@patternfly/react-core";
import {
  ICell,
  IRow,
  IActions,
  SortColumn,
  sortable,
} from "@patternfly/react-table";

import { AppTable } from "../app-table";
import { StateNoData } from "../state-no-data";
import { StateNoResults } from "../state-no-results";
import { StateError } from "../state-error";

describe("AppTable", () => {
  const columns: ICell[] = [
    { title: "Col1", transforms: [sortable] },
    { title: "Col2" },
    { title: "Col3" },
  ];
  const rows: IRow[] = [...Array(15)].map((_, rowIndex) => {
    return {
      cells: [...Array(columns.length)].map((_, colIndex) => ({
        title: <Label>${`${rowIndex},${colIndex}`}</Label>,
      })),
    };
  });
  const actions: IActions = [
    {
      title: "Action1",
      onClick: jest.fn,
    },
    {
      title: "Action2",
      onClick: jest.fn,
    },
  ];

  it("Renders without crashing", () => {
    const wrapper = shallow(
      <AppTable
        cells={columns}
        rows={rows}
        isLoading={false}
        filtersApplied={false}
      />
    );
    expect(wrapper).toMatchSnapshot();
  });

  it.skip("Renders error", () => {
    const wrapper = mount(
      <AppTable
        cells={columns}
        rows={rows}
        isLoading={false}
        fetchError={"Any error"}
        filtersApplied={false}
      />
    );
    expect(wrapper.find(StateError).length).toEqual(1);
  });

  it("Renders loading with skeleton", () => {
    const wrapper = mount(
      <AppTable
        cells={columns}
        rows={rows}
        isLoading={true}
        loadingVariant="skeleton"
        filtersApplied={false}
      />
    );
    expect(wrapper.find(Skeleton).length).toBeGreaterThan(1);
  });

  it("Renders loading with spinner", () => {
    const wrapper = mount(
      <AppTable
        cells={columns}
        rows={rows}
        isLoading={true}
        loadingVariant="spinner"
        filtersApplied={false}
      />
    );
    expect(wrapper.find(Spinner).length).toBe(1);
  });

  it.skip("Renders empty table without aplying filters", () => {
    const wrapper = mount(
      <AppTable
        cells={columns}
        rows={[]}
        isLoading={false}
        filtersApplied={false}
      />
    );
    expect(wrapper.find(StateNoData).length).toEqual(1);
  });

  it.skip("Renders empty table after applying filters", () => {
    const wrapper = mount(
      <AppTable
        cells={columns}
        rows={[]}
        isLoading={false}
        filtersApplied={true}
      />
    );
    expect(wrapper.find(StateNoResults).length).toEqual(1);
  });

  it("Render rows with static actions", () => {
    const wrapper = mount(
      <AppTable
        cells={columns}
        rows={rows}
        actions={actions}
        isLoading={false}
        filtersApplied={false}
      />
    );
    expect(wrapper.find(Label).length).toEqual(45); // 3 columns * 15 rows
  });

  it("Renders on sort", () => {
    const onSortMock = jest.fn();

    const wrapper = mount(
      <AppTable
        cells={columns}
        rows={rows}
        isLoading={false}
        onSort={onSortMock}
        filtersApplied={false}
      />
    );

    wrapper.find(SortColumn).simulate("click");
    expect(onSortMock.mock.calls.length).toEqual(1);
  });
});
