import React from "react";
import { FormContextProvider } from "./form-context";
import {
  ApplicationDependenciesFormProps,
  ApplicationDependenciesForm,
} from "./application-dependencies-form";

export const ApplicationDependenciesFormContainer: React.FC<
  ApplicationDependenciesFormProps
> = ({ ...props }) => {
  return (
    <FormContextProvider>
      <ApplicationDependenciesForm {...props} />
    </FormContextProvider>
  );
};
