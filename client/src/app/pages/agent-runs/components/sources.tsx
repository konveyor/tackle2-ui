import React from "react";
import {
  Checkbox,
  FormGroup,
  FormSelect,
  FormSelectOption,
  Label,
  TextInput,
} from "@patternfly/react-core";

import type {
  AgentParam,
  AgentRunModelSelection,
  Condition,
  LLMProvider,
} from "@app/api/agentic/contract";

export function readyCondition(
  conditions?: Condition[]
): Condition | undefined {
  return conditions?.find((c) => c.type === "Ready");
}

export function ReadyLabel({ conditions }: { conditions?: Condition[] }) {
  const ready = readyCondition(conditions);
  if (!ready) return <Label color="grey">Unknown</Label>;
  return ready.status === "True" ? (
    <Label color="green">Ready</Label>
  ) : (
    <Label color="red">{ready.reason ?? "NotReady"}</Label>
  );
}

export function skillCount(spec: {
  skillCards?: { ref: string }[];
  skillCollections?: { ref: string }[];
}): number {
  return (spec.skillCards?.length ?? 0) + (spec.skillCollections?.length ?? 0);
}

export function defaultModelFor(
  providers: LLMProvider[],
  agentProviderRefs: { ref: string }[]
): AgentRunModelSelection | undefined {
  if (!agentProviderRefs.length || !providers.length) return undefined;
  const first = providers.find(
    (p) => p.metadata.name === agentProviderRefs[0]?.ref
  );
  if (!first || !first.spec.models.length) return undefined;
  const primary =
    first.spec.models.find((m) => m.tier === "primary") ??
    first.spec.models[0]!;
  return {
    role: "primary",
    provider: first.metadata.name!,
    model: primary.name,
  };
}

export function ModelPicker({
  providers,
  agentProviderRefs,
  value,
  onChange,
}: {
  providers: LLMProvider[];
  agentProviderRefs: { ref: string }[];
  value: AgentRunModelSelection | undefined;
  onChange: (m: AgentRunModelSelection | undefined) => void;
}) {
  const options: { label: string; provider: string; model: string }[] = [];
  for (const ref of agentProviderRefs) {
    const prov = providers.find((p) => p.metadata.name === ref.ref);
    if (!prov) continue;
    for (const m of prov.spec.models) {
      options.push({
        label: `${prov.metadata.name}/${m.name}${m.tier ? ` (${m.tier})` : ""}`,
        provider: prov.metadata.name!,
        model: m.name,
      });
    }
  }
  const selected = value ? `${value.provider}/${value.model}` : "";

  return (
    <FormGroup label="Model" fieldId="model-picker">
      <FormSelect
        id="model-picker"
        value={selected}
        onChange={(_e, v) => {
          if (!v) {
            onChange(undefined);
            return;
          }
          const opt = options.find((o) => `${o.provider}/${o.model}` === v);
          if (opt)
            onChange({
              role: "primary",
              provider: opt.provider,
              model: opt.model,
            });
        }}
      >
        <FormSelectOption value="" label="Default (shim policy)" />
        {options.map((o) => (
          <FormSelectOption
            key={`${o.provider}/${o.model}`}
            value={`${o.provider}/${o.model}`}
            label={o.label}
          />
        ))}
      </FormSelect>
    </FormGroup>
  );
}

export function ParamValueField({
  param,
  value,
  onChange,
}: {
  param: AgentParam;
  value: string;
  onChange: (v: string) => void;
}) {
  if (param.type === "boolean") {
    return (
      <Checkbox
        id={`param-${param.name}`}
        label={param.name}
        isChecked={value === "true"}
        onChange={(_e, checked) => onChange(checked ? "true" : "false")}
      />
    );
  }
  return (
    <TextInput
      id={`param-${param.name}`}
      type={param.type === "number" ? "number" : "text"}
      isRequired={param.required}
      value={value}
      onChange={(_e, v) => onChange(v)}
    />
  );
}

export function paramHelperText(p: AgentParam): string {
  const parts: string[] = [];
  if (p.description) parts.push(p.description);
  if (p.type && p.type !== "string") parts.push(`type: ${p.type}`);
  if (p.default) parts.push(`default: ${p.default}`);
  return parts.join(" — ");
}
