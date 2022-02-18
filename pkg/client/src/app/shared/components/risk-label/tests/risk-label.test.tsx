import React from "react";
import { mount } from "enzyme";
import { RiskLabel } from "../risk-label";

describe("RiskLabel", () => {
  it("Green", () => {
    const wrapper = mount(<RiskLabel risk="GREEN" />);
    expect(wrapper.find(".pf-m-green").length).toBe(1);
    expect(wrapper.find(".pf-c-label__content").text()).toBe("risks.low");
  });

  it("Amber", () => {
    const wrapper = mount(<RiskLabel risk="AMBER" />);
    expect(wrapper.find(".pf-m-orange").length).toBe(1);
    expect(wrapper.find(".pf-c-label__content").text()).toBe("risks.medium");
  });

  it("Red", () => {
    const wrapper = mount(<RiskLabel risk="RED" />);
    expect(wrapper.find(".pf-m-red").length).toBe(1);
    expect(wrapper.find(".pf-c-label__content").text()).toBe("risks.high");
  });

  it("Unknown", () => {
    const wrapper = mount(<RiskLabel risk="UNKNOWN" />);
    expect(wrapper.find(".pf-c-label").length).toBe(1);
    expect(wrapper.find(".pf-c-label__content").text()).toBe("risks.unknown");
  });

  it("Not defined risk", () => {
    const wrapper = mount(<RiskLabel risk={"ANYTHING_ELSE" as any} />);

    expect(wrapper.find(".pf-c-label__content").text()).toBe("ANYTHING_ELSE");
  });
});
