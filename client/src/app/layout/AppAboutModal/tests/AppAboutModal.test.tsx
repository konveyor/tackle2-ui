import { render } from "@app/test-config/test-utils";
import React from "react";
import { AppAboutModal } from "../AppAboutModal";

it("AppAboutModal", () => {
  const wrapper = render(<AppAboutModal isOpen={true} onClose={jest.fn()} />);
  expect(wrapper).toMatchSnapshot();
});
