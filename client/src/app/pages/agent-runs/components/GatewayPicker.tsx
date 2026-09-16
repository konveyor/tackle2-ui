/**
 * Gateway selection for a run. One Gateway is one provider/model endpoint,
 * so "pick a model" is a list of gateways.
 *
 * The Agent's gateway list is a presence-gated constraint
 * (agentic-controller#215): when it names gateways, the run's gateway must
 * be one of them and the controller defaults to it when there is exactly
 * one. When the Agent declares none, the controller constrains nothing but
 * the run MUST name a gateway — so the picker offers every Gateway in the
 * cluster and the form requires a choice. Either way the controller never
 * picks among several: a run that omits its gateway fails validation.
 */
import React from "react";
import { useTranslation } from "react-i18next";
import {
  FormGroup,
  FormHelperText,
  FormSelect,
  FormSelectOption,
  HelperText,
  HelperTextItem,
} from "@patternfly/react-core";

import type { Gateway } from "@app/api/agentic/contract";
import { readyCondition } from "@app/utils/skills";

/**
 * True when the controller will not choose a gateway for a run of this
 * Agent: it defaults only when exactly one gateway is declared.
 */
export function gatewayRequiredFor(agent: {
  spec: { gateways?: { ref: string }[] };
}): boolean {
  return (agent.spec.gateways ?? []).length !== 1;
}

/**
 * Preselect the first allowed gateway only when a choice is required and
 * there is something to choose from; an unconstrained Agent gets no
 * preselection so the model is an explicit choice, not a silent default.
 */
export function defaultGatewayFor(
  gatewayRefs: { ref: string }[],
  required: boolean
): string | undefined {
  return required ? gatewayRefs[0]?.ref : undefined;
}

interface GatewayPickerProps {
  /** The gateways the run's Agent (or every stage Agent) declares. */
  gatewayRefs: { ref: string }[];
  /**
   * The Agent declares no gateways at all: offer every cluster Gateway
   * instead of the (empty) declared list. Distinct from an empty
   * intersection across stage Agents that each declare some.
   */
  unconstrained: boolean;
  /** The run must name a gateway; the controller will not default one. */
  required: boolean;
  /** The cluster's Gateway CRs, for model/provider labels and options. */
  gateways: Gateway[];
  value: string | undefined;
  onChange: (gateway: string | undefined) => void;
  id?: string;
}

export const GatewayPicker: React.FC<GatewayPickerProps> = ({
  gatewayRefs,
  unconstrained,
  required,
  gateways,
  value,
  onChange,
  id = "create-gateway",
}) => {
  const { t } = useTranslation();
  if (!unconstrained && gatewayRefs.length === 0) return null;

  const options: { ref: string; gw?: Gateway }[] = unconstrained
    ? gateways.map((gw) => ({ ref: gw.metadata.name ?? "", gw }))
    : gatewayRefs.map(({ ref }) => ({
        ref,
        gw: gateways.find((g) => g.metadata.name === ref),
      }));
  const noneAvailable = unconstrained && options.length === 0;

  const helper = noneAvailable
    ? t("agentic.createRun.gatewayNoneAvailable")
    : unconstrained
      ? t("agentic.createRun.gatewayUnconstrainedHelper")
      : required
        ? t("agentic.createRun.gatewayRequiredHelper")
        : t("agentic.createRun.gatewayHelper");

  return (
    <FormGroup label={t("terms.gateway")} fieldId={id} isRequired={required}>
      <FormSelect
        id={id}
        value={value ?? ""}
        onChange={(_e, v) => onChange(v || undefined)}
        isDisabled={noneAvailable}
      >
        <FormSelectOption
          value=""
          isPlaceholder={required}
          label={
            required
              ? t("agentic.createRun.gatewayPlaceholder")
              : t("agentic.createRun.gatewayDefaultOption")
          }
        />
        {options.map(({ ref, gw }) => {
          // createSandbox refuses a Gateway that is not Ready, so an
          // unconstrained pick is limited to usable ones; a declared ref
          // stays selectable so the controller's own message surfaces.
          const notReady =
            unconstrained &&
            readyCondition(gw?.status?.conditions)?.status !== "True";
          return (
            <FormSelectOption
              key={ref}
              value={ref}
              isDisabled={notReady}
              label={
                gw
                  ? t(
                      notReady
                        ? "agentic.createRun.gatewayNotReadyOption"
                        : "agentic.createRun.gatewayOption",
                      {
                        name: ref,
                        model: gw.spec.model.name,
                        provider: gw.spec.provider,
                      }
                    )
                  : t("agentic.createRun.gatewayNotFound", { name: ref })
              }
            />
          );
        })}
      </FormSelect>
      <FormHelperText>
        <HelperText>
          <HelperTextItem variant={noneAvailable ? "error" : "default"}>
            {helper}
          </HelperTextItem>
        </HelperText>
      </FormHelperText>
    </FormGroup>
  );
};
