import { render, screen } from "@testing-library/react";

import { JsonSchemaObject } from "@app/api/models";

import { SchemaAsFields } from "./SchemaAsFields";

const schema: JsonSchemaObject = {
  type: "object",
  properties: {
    replicas: {
      type: "integer",
      default: 2,
      description: "Number of pods",
    },
    enabled: {
      type: "boolean",
      default: true,
      description: "Turn the feature on",
    },
  },
};

describe("SchemaAsFields", () => {
  it("renders one input per property, labelled with the property name", () => {
    render(<SchemaAsFields id="test" jsonDocument={{}} jsonSchema={schema} />);

    expect(screen.getByLabelText("replicas")).toBeInTheDocument();
    expect(screen.getByLabelText("enabled")).toBeInTheDocument();
  });

  it("shows the description of each property as helper text", () => {
    render(<SchemaAsFields id="test" jsonDocument={{}} jsonSchema={schema} />);

    expect(screen.getByText("Number of pods")).toBeInTheDocument();
    expect(screen.getByText("Turn the feature on")).toBeInTheDocument();
  });

  it("renders the listed properties inside a collapsible section", () => {
    render(
      <SchemaAsFields
        id="test"
        jsonDocument={{}}
        jsonSchema={schema}
        sections={[
          {
            id: "generator-1",
            title: "My generator",
            propertyKeys: ["replicas"],
          },
        ]}
      />
    );

    expect(screen.getByText("My generator")).toBeInTheDocument();
    expect(screen.getByLabelText("replicas")).toBeInTheDocument();
    expect(screen.getByText("Number of pods")).toBeInTheDocument();
    // Properties not listed in a section still render.
    expect(screen.getByLabelText("enabled")).toBeInTheDocument();
  });
});
