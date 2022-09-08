import React from "react";
import { shallow } from "enzyme";
import { PageHeader } from "../page-header";
import { Button } from "@patternfly/react-core";

describe("PageHeader", () => {
  it("Renders without crashing", () => {
    const wrapper = shallow(
      <PageHeader
        title="mycompany"
        breadcrumbs={[
          {
            title: "Companies",
            path: "/companies",
          },
          {
            title: "Company details",
            path: "/companies/1",
          },
        ]}
        btnActions={<Button>send email</Button>}
        menuActions={[
          {
            label: "Edit",
            callback: jest.fn(),
          },
          {
            label: "Delete",
            callback: jest.fn(),
          },
        ]}
        navItems={[
          {
            title: "Overview",
            path: "/companies/1/overview",
          },
          {
            title: "YAML",
            path: "/companies/1/yaml",
          },
          {
            title: "SUNAT",
            path: "/companies/1/sunat",
          },
        ]}
      />
    );
    expect(wrapper).toMatchSnapshot();
  });
});
