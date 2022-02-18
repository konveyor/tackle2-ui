import React from "react";
import { mount, shallow } from "enzyme";
import { Toolbar, ToolbarChip, ToolbarContent } from "@patternfly/react-core";
import { AppTableToolbarToggleGroup } from "../app-table-toolbar-toggle-group";

describe("AppTableToolbarToggleGroup", () => {
  const categoriesValue = [
    {
      key: "name",
      name: "Name",
    },
    {
      key: "description",
      name: "Description",
    },
  ];

  const chipsValue = new Map<string, (string | ToolbarChip)[]>();
  chipsValue.set("name", [{ key: "carlos", node: "Carlos" }, "maria"]);
  chipsValue.set("description", [
    { key: "engineer", node: "Enginner" },
    "teacher",
  ]);

  it("Renders without crashing", () => {
    const wrapper = shallow(
      <Toolbar>
        <ToolbarContent>
          <AppTableToolbarToggleGroup
            categories={categoriesValue}
            chips={chipsValue}
            onChange={jest.fn()}
          >
            <span>children</span>
          </AppTableToolbarToggleGroup>
        </ToolbarContent>
      </Toolbar>
    );
    expect(wrapper).toMatchSnapshot();
  });

  it("Category<key,name> => render chips", () => {
    const wrapper = mount(
      <Toolbar>
        <ToolbarContent>
          <AppTableToolbarToggleGroup
            categories={categoriesValue}
            chips={chipsValue}
            onChange={jest.fn()}
          >
            <span>children</span>
          </AppTableToolbarToggleGroup>
        </ToolbarContent>
      </Toolbar>
    );

    //Verify
    expect(wrapper.find(".pf-m-category").length).toBe(2);

    expect(wrapper.find(".pf-c-chip-group__label").at(0).text()).toBe("Name");
    expect(wrapper.find(".pf-c-chip-group__label").at(1).text()).toBe(
      "Description"
    );

    expect(wrapper.find(".pf-c-chip-group__list-item").length).toBe(4);
  });

  it("Category<string> => render chip", () => {
    const wrapper = mount(
      <Toolbar>
        <ToolbarContent>
          <AppTableToolbarToggleGroup
            categories={categoriesValue.map((f) => f.key)}
            chips={chipsValue}
            onChange={jest.fn()}
          >
            <span>children</span>
          </AppTableToolbarToggleGroup>
        </ToolbarContent>
      </Toolbar>
    );

    //Verify
    expect(wrapper.find(".pf-m-category").length).toBe(2);

    expect(wrapper.find(".pf-c-chip-group__label").at(0).text()).toBe("name");
    expect(wrapper.find(".pf-c-chip-group__label").at(1).text()).toBe(
      "description"
    );

    expect(wrapper.find(".pf-c-chip-group__list-item").length).toBe(4);
  });

  it("Category<key,name> => delete chip", () => {
    const onChangeSpy = jest.fn();

    const wrapper = mount(
      <Toolbar>
        <ToolbarContent>
          <AppTableToolbarToggleGroup
            categories={categoriesValue}
            chips={chipsValue}
            onChange={onChangeSpy}
          >
            <span>children</span>
          </AppTableToolbarToggleGroup>
        </ToolbarContent>
      </Toolbar>
    );

    // Delete 2nd chip of 2nd group
    wrapper.find("button[aria-label='close']").at(2).simulate("click");

    //Verify
    expect(onChangeSpy).toHaveBeenCalledWith("description", ["teacher"]);
  });

  it("Category<string> => delete chip", () => {
    const onChangeSpy = jest.fn();

    const wrapper = mount(
      <Toolbar>
        <ToolbarContent>
          <AppTableToolbarToggleGroup
            categories={categoriesValue.map((f) => f.key)}
            chips={chipsValue}
            onChange={onChangeSpy}
          >
            <span>children</span>
          </AppTableToolbarToggleGroup>
        </ToolbarContent>
      </Toolbar>
    );

    // Delete 2nd chip of 2nd group
    wrapper.find("button[aria-label='close']").at(3).simulate("click");

    //Verify
    expect(onChangeSpy).toHaveBeenCalledWith("description", [
      { key: "engineer", node: "Enginner" },
    ]);
  });

  it("Category<key,name> => delete chip group", () => {
    const onChangeSpy = jest.fn();

    const wrapper = mount(
      <Toolbar>
        <ToolbarContent>
          <AppTableToolbarToggleGroup
            categories={categoriesValue}
            chips={chipsValue}
            onChange={onChangeSpy}
          >
            <span>children</span>
          </AppTableToolbarToggleGroup>
        </ToolbarContent>
      </Toolbar>
    );

    // Delete 2nd chip group
    wrapper
      .find("button[aria-label='Close chip group']")
      .at(1)
      .simulate("click");

    //Verify
    expect(onChangeSpy).toHaveBeenCalledWith("description", []);
  });

  it("Category<string> => delete chip group", () => {
    const onChangeSpy = jest.fn();

    const wrapper = mount(
      <Toolbar>
        <ToolbarContent>
          <AppTableToolbarToggleGroup
            categories={categoriesValue.map((f) => f.key)}
            chips={chipsValue}
            onChange={onChangeSpy}
          >
            <span>children</span>
          </AppTableToolbarToggleGroup>
        </ToolbarContent>
      </Toolbar>
    );

    // Delete 2nd chip group
    wrapper
      .find("button[aria-label='Close chip group']")
      .at(1)
      .simulate("click");

    //Verify
    expect(onChangeSpy).toHaveBeenCalledWith("description", []);
  });
});
