import { useEffect } from "react";
import { FieldValues, UseFormReturn } from "react-hook-form";

/**
 * Log the form's values and state every time it changes
 */
export const useLogFormValues = <TFormValues extends FieldValues>(
  form: UseFormReturn<TFormValues>
) => {
  useEffect(() => {
    const { subscribe } = form;
    return subscribe({
      formState: { values: true, isValid: true, errors: true },
      callback: ({ values, isValid, errors }) => {
        console.log(
          "Form isValid?",
          isValid,
          "values:",
          values,
          "errors:",
          errors
        );
      },
    });
  }, [form]);
};
