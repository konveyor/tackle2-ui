import React from "react";
import { render, screen } from "@testing-library/react";
import { FormProvider, useForm } from "react-hook-form";

import { GeneratorParameter } from "../../utils";

import { ParameterFields } from "./generator-parameter-fields";

// Renders ParameterFields inside a form context, the way the real generator form does.
const FormWrapper: React.FC<{ params?: GeneratorParameter[] }> = ({
  params = [],
}) => {
  const methods = useForm({ defaultValues: { params } });
  return (
    <FormProvider {...methods}>
      <ParameterFields
        name="params"
        noParametersMessage="No parameters to display"
        removeLabel="Remove this parameter"
      />
    </FormProvider>
  );
};

describe("ParameterFields", () => {
  // With no parameters, the section shows the empty-state placeholder.
  it("shows the empty message when there are no parameters", () => {
    render(<FormWrapper />);
    expect(screen.getByText("No parameters to display")).toBeInTheDocument();
  });

  it("exposes name, type, value, and description fields for each parameter row", () => {
    render(
      <FormWrapper params={[{ name: "env", type: "string", default: "dev" }]} />
    );
    expect(document.getElementById("params-name-0")).toBeInTheDocument();
    expect(document.getElementById("params-type-0")).toBeInTheDocument();
    expect(document.getElementById("params-value-0")).toBeInTheDocument();
    expect(document.getElementById("params-description-0")).toBeInTheDocument();
  });
});
