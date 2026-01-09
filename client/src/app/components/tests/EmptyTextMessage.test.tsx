import { render } from "@app/test-config/test-utils";

import { EmptyTextMessage } from "../EmptyTextMessage";

describe("EmptyTextMessage", () => {
  it("Renders without crashing", () => {
    const wrapper = render(<EmptyTextMessage message="my custom message" />);
    expect(wrapper).toMatchSnapshot();
  });
});
