import React from "react";
import { ConditionalRender } from "../ConditionalRender";
import { render, screen } from "@app/test-config/test-utils";

describe("ConditionalRender", () => {
  it("Renders WHEN=true", () => {
    render(
      <ConditionalRender when={true} then={"Hello world"}>
        I&apos;m the content
      </ConditionalRender>
    );
    screen.findByRole("heading", { name: /Hello world/i });
  });

  it("Renders WHEN=false", () => {
    render(
      <ConditionalRender when={false} then={"Hello world"}>
        I&apos;m the content
      </ConditionalRender>
    );
    screen.findByRole("heading", { name: /I'm the content/i });
  });
});
