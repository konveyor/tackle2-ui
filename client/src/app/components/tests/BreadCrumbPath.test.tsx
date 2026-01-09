import { BrowserRouter as Router } from "react-router-dom";

import { fireEvent, render, screen } from "@app/test-config/test-utils";

import { BreadCrumbPath } from "../BreadCrumbPath";

describe("BreadCrumbPath", () => {
  it("Renders without crashing", () => {
    const wrapper = render(
      <Router>
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
      </Router>
    );
    expect(wrapper).toMatchSnapshot();
  });

  it("Given a function path, should callback", () => {
    const secondBreadcrumbSpy = jest.fn();

    render(
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
              title: "third",
              path: "/third",
            },
          ]}
        />
      </Router>
    );

    const button = screen.getByRole("button");

    fireEvent.click(button);
    expect(secondBreadcrumbSpy).toHaveBeenCalledTimes(1);
  });
});
