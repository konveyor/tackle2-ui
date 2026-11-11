import { useState } from "react";
import * as React from "react";
import { useFormContext, useWatch } from "react-hook-form";

import { Identity } from "@app/api/models";
import { HookFormPFTextInput } from "@app/components/HookFormPFFields";
import KeyDisplayToggle from "@app/components/KeyDisplayToggle";

export const KindBearerTokenForm: React.FC<{ identity?: Identity }> = ({
  identity,
}) => {
  const { control, resetField } = useFormContext();
  const key = useWatch({ control, name: "key" });

  const [isKeyHidden, setIsKeyHidden] = useState(true);
  const toggleHideKey = (e: React.FormEvent<HTMLElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsKeyHidden(!isKeyHidden);
  };

  const isKeyEncrypted = identity?.key === key;

  return (
    <HookFormPFTextInput
      control={control}
      name="key"
      label={"Token"}
      fieldId="key"
      isRequired={true}
      type={isKeyHidden ? "password" : "text"}
      formGroupProps={{
        labelHelp: !isKeyEncrypted ? (
          <KeyDisplayToggle
            keyName="key"
            isKeyHidden={isKeyHidden}
            onClick={toggleHideKey}
          />
        ) : undefined,
      }}
      onFocus={() => resetField("key")}
    />
  );
};
