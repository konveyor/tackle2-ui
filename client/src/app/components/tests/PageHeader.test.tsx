import React from "react";
import { PageHeader } from "../PageHeader";
import { Button } from "@patternfly/react-core";
import { render } from "@app/test-config/test-utils";
import { BrowserRouter as Router } from "react-router-dom";

describe("PageHeader", () => {
  it("Renders without crashing", () => {
    const wrapper = render(
      <Router>
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
      </Router>
    );
    expect(wrapper).toMatchSnapshot();
  });
});
