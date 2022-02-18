import React from "react";
import { mount, shallow } from "enzyme";
import { EmptyTextMessage } from "@app/shared/components";
import { Application } from "@app/api/models";
import { ApplicationListExpandedArea } from "../application-list-expanded-area";

describe("ApplicationListExpandedArea", () => {
  it("Should shown 'not yet reviewed'", () => {
    const application: Application = {
      name: "anyApp",
    };

    const wrapper = shallow(
      <ApplicationListExpandedArea application={application} />
    );

    const notReviewed = "terms.notYetReviewed";
    expect(
      wrapper.find({ "cy-data": "proposed-action" }).children().props().message
    ).toBe(notReviewed);
    expect(
      wrapper.find({ "cy-data": "effort-estimate" }).children().props().message
    ).toBe(notReviewed);
    expect(
      wrapper.find({ "cy-data": "business-criticality" }).children().props()
        .message
    ).toBe(notReviewed);
    expect(
      wrapper.find({ "cy-data": "work-priority" }).children().props().message
    ).toBe(notReviewed);
    expect(
      wrapper.find({ "cy-data": "review-comments" }).children().props().message
    ).toBe(notReviewed);
  });

  it("Should shown values from Review", () => {
    const application: Application = {
      name: "anyApp",
      review: {
        proposedAction: "rehost",
        effortEstimate: "small",
        businessCriticality: 2,
        workPriority: 3,
        comments: "my review comments",
      },
    };

    const wrapper = shallow(
      <ApplicationListExpandedArea application={application} />
    );

    expect(
      wrapper
        .find({ "cy-data": "proposed-action" })
        .children()
        .children()
        .text()
    ).toBe("proposedActions.rehost");
    expect(
      wrapper.find({ "cy-data": "effort-estimate" }).children().text()
    ).toBe("efforts.small");
    expect(
      wrapper.find({ "cy-data": "business-criticality" }).children().text()
    ).toBe("2");
    expect(wrapper.find({ "cy-data": "work-priority" }).children().text()).toBe(
      "3"
    );
    expect(wrapper.find({ "cy-data": "risk" }).children().length).toBe(1);
    expect(
      wrapper.find({ "cy-data": "review-comments" }).children().text()
    ).toBe("my review comments");
  });
});
