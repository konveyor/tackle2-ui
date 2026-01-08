import { useEffect, useState } from "react";
import * as yup from "yup";

export const useAsyncYupValidation = <TFieldValues>(
  values: TFieldValues,
  schema: yup.SchemaOf<TFieldValues>
) => {
  const [isValid, setIsValid] = useState(false);
  useEffect(() => {
    const validate = async () => {
      try {
        await schema.validate(values);
        setIsValid(true);
      } catch (e: unknown) {
        setIsValid(false);
      }
    };
    validate();
  }, [values, schema]);
  return isValid;
};
