import React from "react";
import { mount } from "enzyme";
import { NodeFetch } from "../node-fetch";

describe("NodeFetch", () => {
  it("Renders loading...", () => {
    const wrapper = mount(<NodeFetch isFetching={true} node="myChip" />);
    expect(wrapper.text()).toBe(" terms.loading...");
  });

  it("Renders error...", () => {
    const wrapper = mount(
      <NodeFetch isFetching={true} fetchError={"error"} node="myChip" />
    );
    expect(wrapper.text()).toBe("terms.unknown");
  });

  it("Renders chip...", () => {
    const wrapper = mount(<NodeFetch isFetching={false} node="myChip" />);
    expect(wrapper.text()).toBe("myChip");
  });
});
