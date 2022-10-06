import React from "react";
import { Form, FormGroup, TextInput } from "@patternfly/react-core";

interface ISampleForm {
  formValue: string;
  isFormValid: boolean;
  onChange: (isvalid: boolean, value: any) => void;
}

export const SampleForm: React.FC<ISampleForm> = ({
  formValue = "",
  isFormValid = false,
  onChange,
}: ISampleForm) => {
  const [value, setValue] = React.useState(formValue);
  const [isValid, setIsValid] = React.useState(isFormValid);

  const handleTextInputChange = (value: any) => {
    const isValid = /^\d+$/.test(value);
    setValue(value);
    setIsValid(isValid);
    onChange(isValid, value);
  };

  const validated = isValid ? "default" : "error";

  return (
    <Form>
      <FormGroup
        label="Age:"
        type="number"
        helperText="Write your age in numbers."
        helperTextInvalid="Age has to be a number"
        fieldId="age"
        validated={validated}
      >
        <TextInput
          validated={validated}
          value={value}
          id="age"
          aria-describedby="age-helper"
          onChange={handleTextInputChange}
        />
      </FormGroup>
    </Form>
  );
};

export default SampleForm;
