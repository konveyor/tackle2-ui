import React from "react";
import { mount } from "enzyme";
import { Toolbar, ToolbarChip, ToolbarContent } from "@patternfly/react-core";
import { ApplicationFilterKey } from "@app/Constants";
import { ApplicationToolbarToggleGroup } from "../application-toolbar-toggle-group";

describe("ApplicationToolbarToggleGroup", () => {
  const value = new Map<ApplicationFilterKey, ToolbarChip[]>();
  value.set(ApplicationFilterKey.TAG, [{ key: "1", node: "Tag1" }]);

  it.skip("Renders without crashing", () => {
    const wrapper = mount(
      <Toolbar>
        <ToolbarContent>
          <ApplicationToolbarToggleGroup
            value={value}
            addFilter={jest.fn()}
            setFilter={jest.fn()}
          />
        </ToolbarContent>
      </Toolbar>
    );
  });
});
