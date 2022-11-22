import { render } from "@app/test-config/test-utils";
import React from "react";
import { NodeFetch } from "../node-fetch";

describe("NodeFetch", () => {
  it("Renders loading...", () => {
    const wrapper = render(<NodeFetch isFetching={true} node="myChip" />);
    // expect(wrapper.text()).toBe(" terms.loading...");
  });

  it("Renders error...", () => {
    const wrapper = render(
      <NodeFetch isFetching={true} fetchError={"error"} node="myChip" />
    );
    // expect(wrapper.text()).toBe("terms.unknown");
  });

  it("Renders chip...", () => {
    const wrapper = render(<NodeFetch isFetching={false} node="myChip" />);
    // expect(wrapper.text()).toBe("myChip");
  });
});
