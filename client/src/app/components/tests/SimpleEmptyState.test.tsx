import AdIcon from "@patternfly/react-icons/dist/esm/icons/ad-icon";

import { render } from "@app/test-config/test-utils";

import { SimpleEmptyState } from "../SimpleEmptyState";

describe("SimpleEmptyState", () => {
  it("Renders without crashing", () => {
    const wrapper = render(<SimpleEmptyState title="my title" />);
    expect(wrapper).toMatchSnapshot();
  });

  it("Renders with icon", () => {
    const wrapper = render(<SimpleEmptyState title="my title" icon={AdIcon} />);
    expect(wrapper).toMatchSnapshot();
  });

  it("Renders with description", () => {
    const wrapper = render(
      <SimpleEmptyState title="my title" description="my description" />
    );
    expect(wrapper).toMatchSnapshot();
  });

  it("Renders with primaryAction", () => {
    const wrapper = render(
      <SimpleEmptyState
        title="my title"
        description="my description"
        primaryAction={<button>My action</button>}
      />
    );
    expect(wrapper).toMatchSnapshot();
  });
});
