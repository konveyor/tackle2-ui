import React from "react";
import { shallow } from "enzyme";
import { AdIcon } from "@patternfly/react-icons/dist/esm/icons/ad-icon";

import { SimpleEmptyState } from "../simple-empty-state";

describe("SimpleEmptyState", () => {
  it("Renders without crashing", () => {
    const wrapper = shallow(<SimpleEmptyState title="my title" />);
    expect(wrapper).toMatchSnapshot();
  });

  it("Renders with icon", () => {
    const wrapper = shallow(
      <SimpleEmptyState title="my title" icon={AdIcon} />
    );
    expect(wrapper).toMatchSnapshot();
  });

  it("Renders with description", () => {
    const wrapper = shallow(
      <SimpleEmptyState title="my title" description="my description" />
    );
    expect(wrapper).toMatchSnapshot();
  });

  it("Renders with primaryAction", () => {
    const wrapper = shallow(
      <SimpleEmptyState
        title="my title"
        description="my description"
        primaryAction={<button>My action</button>}
      />
    );
    expect(wrapper).toMatchSnapshot();
  });
});
