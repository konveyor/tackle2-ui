import React from "react";
import { shallow, mount } from "enzyme";
import { global_palette_blue_300 as blue } from "@patternfly/react-tokens";
import { Color } from "../color";

describe("Color", () => {
  it("Renders without crashing", () => {
    const wrapper = shallow(<Color hex="#FFF" />);
    expect(wrapper).toMatchSnapshot();
  });

  it("Applies hex color style", () => {
    const wrapper = mount(<Color hex="#FFF" />);

    expect(
      wrapper.find('div[cy-data="color-box"]').prop("style")
    ).toHaveProperty("backgroundColor", "#FFF");
  });

  it("Applies color label with lowercase hex", () => {
    const wrapper = mount(<Color hex={blue.value.toLowerCase()} />);

    expect(wrapper.find('span[cy-data="color-label"]').text()).toEqual(
      "colors.blue"
    );
  });

  it("Applies color label with upercase hex", () => {
    const wrapper = mount(<Color hex={blue.value.toUpperCase()} />);

    expect(wrapper.find('span[cy-data="color-label"]').text()).toEqual(
      "colors.blue"
    );
  });

  it("Applies color hex code", () => {
    const wrapper = mount(<Color hex={"#fff"} />);

    expect(wrapper.find('span[cy-data="color-label"]').text()).toEqual("#fff");
  });
});
