import React from "react";
import { BrowserRouter as Router } from "react-router-dom";
import { mount, shallow } from "enzyme";
import { BreadCrumbPath } from "../breadcrumb-path";

describe("BreadCrumbPath", () => {
  it("Renders without crashing", () => {
    const wrapper = shallow(
      <BreadCrumbPath
        breadcrumbs={[
          {
            title: "first",
            path: "/first",
          },
          {
            title: "second",
            path: "/second",
          },
          {
            title: "thrid",
            path: "/thrid",
          },
        ]}
      />
    );
    expect(wrapper).toMatchSnapshot();
  });

  it("Given a function path, should callback", () => {
    const secondBreadcrumbSpy = jest.fn();

    const wrapper = mount(
      <Router>
        <BreadCrumbPath
          breadcrumbs={[
            {
              title: "first",
              path: "/first",
            },
            {
              title: "second",
              path: secondBreadcrumbSpy,
            },
            {
              title: "thrid",
              path: "/thrid",
            },
          ]}
        />
      </Router>
    );

    wrapper.find("button").simulate("click");
    expect(secondBreadcrumbSpy).toHaveBeenCalledTimes(1);
  });
});
