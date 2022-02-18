import React from "react";
import { mount, shallow } from "enzyme";
import { ICell } from "@patternfly/react-table";

import { AppTableWithControls } from "../app-table-with-controls";

describe("AppTableWithControls", () => {
  const columns: ICell[] = [{ title: "Col1" }];
  const itemsToRow = (items: string[]) => {
    return items.map((item) => ({
      cells: [
        {
          title: item,
        },
      ],
    }));
  };

  it("Renders without crashing", () => {
    const wrapper = shallow(
      <AppTableWithControls
        count={120}
        rows={[{ cells: ["first", "second", "third"] }]}
        pagination={{ page: 1, perPage: 10 }}
        onPaginationChange={jest.fn()}
        onSort={jest.fn()}
        cells={columns}
        isLoading={false}
        filtersApplied={false}
      />
    );
    expect(wrapper).toMatchSnapshot();
  });

  it("Renders adding toolbar", () => {
    const wrapper = shallow(
      <AppTableWithControls
        count={120}
        rows={[{ cells: ["first", "second", "third"] }]}
        pagination={{ page: 1, perPage: 10 }}
        onPaginationChange={jest.fn()}
        onSort={jest.fn()}
        cells={columns}
        isLoading={false}
        toolbarActions={<p>This is an additional content to toolbar</p>}
        filtersApplied={false}
      />
    );
    expect(wrapper).toMatchSnapshot();
  });
});
