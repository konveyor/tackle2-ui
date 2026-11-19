import React from "react";
import { yupResolver } from "@hookform/resolvers/yup";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { FormProvider, useForm } from "react-hook-form";
import * as yup from "yup";

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

// Mirrors the form's rule that the default must match the parameter type, so we
// can assert that changing the type re-runs the default's validation.
const defaultMatchesType = yup.object({
  params: yup.array().of(
    yup.object({
      name: yup.string(),
      type: yup.string(),
      default: yup
        .string()
        .test("default-matches-type", "Invalid default", function (value) {
          const type = (this.parent as { type?: string }).type;
          if (type === "integer") {
            return /^-?\d+$/.test((value ?? "").trim());
          }
          if (type === "boolean") {
            return value === "true" || value === "false";
          }
          return true;
        }),
    })
  ),
});

const ValidatedFormWrapper: React.FC<{ params: GeneratorParameter[] }> = ({
  params,
}) => {
  const methods = useForm({
    defaultValues: { params },
    resolver: yupResolver(defaultMatchesType),
    mode: "all",
  });
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

  // Each parameter row renders a Name box, a Type dropdown, and a Value box.
  it("exposes name, type, and value fields for each parameter row", () => {
    render(
      <FormWrapper params={[{ name: "env", type: "string", default: "dev" }]} />
    );
    expect(document.getElementById("params-name-0")).toBeInTheDocument();
    expect(document.getElementById("params-type-0")).toBeInTheDocument();
    expect(document.getElementById("params-value-0")).toBeInTheDocument();
  });

  // A boolean default is a true/false select rather than a free-text box.
  it("renders a true/false select for a boolean default", () => {
    render(
      <FormWrapper
        params={[{ name: "flag", type: "boolean", default: "true" }]}
      />
    );
    const select = document.getElementById(
      "params-value-0"
    ) as HTMLSelectElement;
    expect(select.tagName).toBe("SELECT");
    const visibleOptions = Array.from(select.options)
      .filter((option) => !option.hidden)
      .map((option) => option.value);
    expect(visibleOptions).toEqual(["true", "false"]);
    // The placeholder is shown when nothing is chosen but is not selectable.
    expect(select.options[0].value).toBe("");
    expect(select.options[0].hidden).toBe(true);
    expect(select.options[0].disabled).toBe(true);
    expect(select.value).toBe("true");
  });

  // Changing the type must re-validate the default and surface the error
  // without the user having to touch the default field.
  it("re-validates and shows the default error when the parameter type changes", async () => {
    render(
      <ValidatedFormWrapper
        params={[{ name: "env", type: "string", default: "dev" }]}
      />
    );
    const typeSelect = document.getElementById(
      "params-type-0"
    ) as HTMLSelectElement;
    fireEvent.change(typeSelect, { target: { value: "integer" } });
    expect(await screen.findByText("Invalid default")).toBeInTheDocument();
  });

  // Choosing a type before typing a default must not raise the required error.
  it("does not show a default error when only the type is chosen", async () => {
    render(
      <ValidatedFormWrapper
        params={[{ name: "env", type: "string", default: "" }]}
      />
    );
    const typeSelect = document.getElementById(
      "params-type-0"
    ) as HTMLSelectElement;
    fireEvent.change(typeSelect, { target: { value: "integer" } });
    await waitFor(() => expect(typeSelect.value).toBe("integer"));
    expect(screen.queryByText("Invalid default")).not.toBeInTheDocument();
  });

  // A boolean row only offers true/false, so a non-boolean default is cleared
  // so the select shows its placeholder instead of an option it does not hold.
  it("clears a non-boolean default when the type becomes boolean", async () => {
    render(
      <ValidatedFormWrapper
        params={[{ name: "flag", type: "string", default: "dev" }]}
      />
    );
    const typeSelect = document.getElementById(
      "params-type-0"
    ) as HTMLSelectElement;
    fireEvent.change(typeSelect, { target: { value: "boolean" } });
    await waitFor(() => {
      const select = document.getElementById(
        "params-value-0"
      ) as HTMLSelectElement;
      expect(select.tagName).toBe("SELECT");
      expect(select.value).toBe("");
    });
    expect(screen.queryByText("Invalid default")).not.toBeInTheDocument();
  });
});
