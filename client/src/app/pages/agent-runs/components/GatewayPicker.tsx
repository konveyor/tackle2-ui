/**
 * Gateway selection for a run. One Gateway is one provider/model endpoint,
 * so "pick a model" is a list of the Agent's declared gateways.
 *
 * The controller defaults the gateway when the Agent declares exactly one,
 * and fails validation when it declares several and the run names none —
 * hence defaultGatewayFor, which preselects only in the multi-gateway case.
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

export function defaultGatewayFor(
  gatewayRefs: { ref: string }[]
): string | undefined {
  if (gatewayRefs.length <= 1) return undefined;
  return gatewayRefs[0]?.ref;
}

interface GatewayPickerProps {
  /** The gateways the run's Agent (or every stage Agent) declares. */
  gatewayRefs: { ref: string }[];
  /** The cluster's Gateway CRs, for model/provider labels. */
  gateways: Gateway[];
  value: string | undefined;
  onChange: (gateway: string | undefined) => void;
  id?: string;
}

export const GatewayPicker: React.FC<GatewayPickerProps> = ({
  gatewayRefs,
  gateways,
  value,
  onChange,
  id = "create-gateway",
}) => {
  const { t } = useTranslation();
  if (gatewayRefs.length === 0) return null;

  return (
    <FormGroup label={t("terms.gateway")} fieldId={id}>
      <FormSelect
        id={id}
        value={value ?? ""}
        onChange={(_e, v) => onChange(v || undefined)}
      >
        <FormSelectOption
          value=""
          label={t("agentic.createRun.gatewayDefaultOption")}
        />
        {gatewayRefs.map(({ ref }) => {
          const gw = gateways.find((g) => g.metadata.name === ref);
          return (
            <FormSelectOption
              key={ref}
              value={ref}
              label={
                gw
                  ? t("agentic.createRun.gatewayOption", {
                      name: ref,
                      model: gw.spec.model.name,
                      provider: gw.spec.provider,
                    })
                  : t("agentic.createRun.gatewayNotFound", { name: ref })
              }
            />
          );
        })}
      </FormSelect>
      <FormHelperText>
        <HelperText>
          <HelperTextItem>
            {gatewayRefs.length > 1
              ? t("agentic.createRun.gatewayRequiredHelper")
              : t("agentic.createRun.gatewayHelper")}
          </HelperTextItem>
        </HelperText>
      </FormHelperText>
    </FormGroup>
  );
};
