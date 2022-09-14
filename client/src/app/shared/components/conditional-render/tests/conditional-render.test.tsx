import React from "react";
import { mount } from "enzyme";
import { ConditionalRender } from "../conditional-render";

describe("ConditionalRender", () => {
  it("Renders WHEN=true", () => {
    const wrapper = mount(
      <ConditionalRender when={true} then={"Hello world"}>
        I'm the content
      </ConditionalRender>
    );
    wrapper.text().match("Hello world");
  });

  it("Renders WHEN=false", () => {
    const wrapper = mount(
      <ConditionalRender when={false} then={"Hello world"}>
        I'm the content
      </ConditionalRender>
    );
    wrapper.text().match("I'm the content");
  });
});
