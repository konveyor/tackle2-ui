import { render } from "@app/test-config/test-utils";
import React from "react";
<<<<<<<< HEAD:client/src/app/shared/components/iconed-status/tests/status-icon.test.tsx
import { IconedStatus } from "../iconed-status";
========
import { StatusIcon } from "../StatusIcon";
>>>>>>>> 9f86cb51 (shared/components files: Remove index and CamelCase rename):client/src/app/components/tests/StatusIcon.test.tsx

describe("StatusIcon", () => {
  it("Renders without crashing", () => {
    const wrapper = render(<IconedStatus preset="NotStarted" />);
    expect(wrapper).toMatchSnapshot();
  });
});
