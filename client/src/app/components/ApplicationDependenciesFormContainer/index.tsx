import React from "react";
import { FormContextProvider } from "./FormContext";
import {
  ApplicationDependenciesFormProps,
  ApplicationDependenciesForm,
} from "./ApplicationDependenciesForm";

export const ApplicationDependenciesFormContainer: React.FC<
  ApplicationDependenciesFormProps
> = ({ ...props }) => {
  return (
    <FormContextProvider>
      <ApplicationDependenciesForm {...props} />
    </FormContextProvider>
  );
};
