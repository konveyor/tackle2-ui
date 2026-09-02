import React from "react";
import { Checkbox, TextInput } from "@patternfly/react-core";

import type { AgentParam } from "@app/api/agentic/contract";
import i18n from "@app/i18n";

export function paramValueInvalidReason(
  p: AgentParam,
  value: string
): string | undefined {
  const v = value.trim();
  if (!v) return undefined; // emptiness is handled by the required check
  if (p.type === "number" && !Number.isFinite(Number(v)))
    return i18n.t("agentic.createRun.mustBeNumber");
  return undefined;
}

export function ParamValueField({
  param,
  value,
  onChange,
  id,
  isDisabled,
}: {
  param: AgentParam;
  value: string;
  onChange: (v: string) => void;
  id?: string;
  isDisabled?: boolean;
}) {
  const fieldId = id ?? `param-${param.name}`;
  if (param.type === "boolean") {
    return (
      <Checkbox
        id={fieldId}
        label={param.name}
        isChecked={value === "true"}
        isDisabled={isDisabled}
        onChange={(_e, checked) => onChange(checked ? "true" : "false")}
      />
    );
  }
  const invalid = paramValueInvalidReason(param, value);
  return (
    <TextInput
      id={fieldId}
      type={param.type === "number" ? "number" : "text"}
      isRequired={param.required}
      value={value}
      isDisabled={isDisabled}
      validated={invalid ? "error" : "default"}
      onChange={(_e, v) => onChange(v)}
    />
  );
}

export function paramHelperText(p: AgentParam): string {
  const parts: string[] = [];
  if (p.description) parts.push(p.description);
  if (p.type && p.type !== "string")
    parts.push(i18n.t("agentic.createRun.paramType", { type: p.type }));
  if (p.default)
    parts.push(i18n.t("agentic.createRun.paramDefault", { value: p.default }));
  return parts.join(" — ");
}
