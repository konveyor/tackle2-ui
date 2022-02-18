import React from "react";
import { BrowserRouter as Router } from "react-router-dom";
import { shallow } from "enzyme";
import { SidebarApp } from "../SidebarApp";

it("Renders without crashing", () => {
  jest.mock("react-i18next", () => ({
    useTranslation: () => {
      return {
        t: (str: any) => str,
        i18n: {
          changeLanguage: () => new Promise(() => {}),
        },
      };
    },
  }));

  const wrapper = shallow(
    <Router>
      <SidebarApp />
    </Router>
  );
  expect(wrapper).toMatchSnapshot();
});
