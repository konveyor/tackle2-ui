import { useState } from "react";
import * as React from "react";
import { useFormContext } from "react-hook-form";

import { Identity } from "@app/api/models";
import { HookFormPFTextInput } from "@app/components/HookFormPFFields";
import KeyDisplayToggle from "@app/components/KeyDisplayToggle";

export const KindSimpleUsernamePasswordForm: React.FC<{
  identity?: Identity;
  usernameLabel: string;
  passwordLabel: string;
  passwordRequired?: boolean;
}> = ({
  identity,
  usernameLabel = "Username",
  passwordLabel = "Password",
  passwordRequired = true,
}) => {
  const { control, getValues, resetField } = useFormContext();
  const values = getValues();

  const [isPasswordHidden, setIsPasswordHidden] = useState(true);
  const toggleHidePassword = (e: React.FormEvent<HTMLElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsPasswordHidden(!isPasswordHidden);
  };

  const isPasswordEncrypted = identity?.password === values.password;

  return (
    <>
      <HookFormPFTextInput
        control={control}
        name="user"
        label={usernameLabel}
        fieldId="user"
        isRequired
      />
      <HookFormPFTextInput
        control={control}
        name="password"
        label={passwordLabel}
        fieldId="password"
        isRequired={passwordRequired}
        type={isPasswordHidden ? "password" : "text"}
        formGroupProps={{
          labelIcon: !isPasswordEncrypted ? (
            <KeyDisplayToggle
              keyName="password"
              isKeyHidden={isPasswordHidden}
              onClick={toggleHidePassword}
            />
          ) : undefined,
        }}
        onFocus={() => resetField("password")}
      />
    </>
  );
};
