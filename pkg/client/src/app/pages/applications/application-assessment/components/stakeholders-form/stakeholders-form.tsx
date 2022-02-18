import React, { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useFormikContext } from "formik";

import {
  FormGroup,
  FormSection,
  Grid,
  GridItem,
  Text,
  TextContent,
} from "@patternfly/react-core";

import {
  useFetchStakeholderGroups,
  useFetchStakeholders,
} from "@app/shared/hooks";

import { DEFAULT_SELECT_MAX_HEIGHT } from "@app/Constants";
import { getValidatedFromError } from "@app/utils/utils";

import { IFormValues } from "../../form-utils";

import { StakeholderSelect } from "./stakeholder-select";
import { StakeholderGroupSelect } from "./stakeholder-group-select";

export interface StakeholdersFormProps {}

export const StakeholdersForm: React.FC<StakeholdersFormProps> = () => {
  const { t } = useTranslation();
  const formik = useFormikContext<IFormValues>();

  const {
    stakeholders,
    isFetching: isFetchingStakeholders,
    fetchError: fetchErrorStakeholders,
    fetchAllStakeholders,
  } = useFetchStakeholders();

  useEffect(() => {
    fetchAllStakeholders();
  }, [fetchAllStakeholders]);

  const {
    stakeholderGroups,
    isFetching: isFetchingStakeholderGroups,
    fetchError: fetchErrorStakeholderGroups,
    fetchAllStakeholderGroups,
  } = useFetchStakeholderGroups();

  useEffect(() => {
    fetchAllStakeholderGroups();
  }, [fetchAllStakeholderGroups]);

  return (
    <div className="pf-c-form">
      <FormSection>
        <TextContent>
          <Text component="h1">
            {
              // t('terms.stakeholders')
              t("composed.selectMany", {
                what: t("terms.stakeholders").toLowerCase(),
              })
            }
          </Text>
          <Text component="p">{t("message.assessmentStakeholderHeader")}</Text>
        </TextContent>
      </FormSection>

      <Grid className="pf-c-form__section">
        <GridItem md={6} className="pf-c-form">
          <FormSection>
            <FormGroup
              label={t("terms.stakeholders")}
              fieldId="stakeholders"
              isRequired={false}
              validated={getValidatedFromError(formik.errors.stakeholders)}
              helperTextInvalid={formik.errors.stakeholders}
            >
              <StakeholderSelect
                fieldConfig={{
                  name: "stakeholders",
                }}
                selectConfig={{
                  variant: "typeaheadmulti",
                  "aria-label": "stakeholders",
                  "aria-describedby": "stakeholders",
                  typeAheadAriaLabel: "stakeholders",
                  toggleAriaLabel: "stakeholders",
                  clearSelectionsAriaLabel: "stakeholders",
                  removeSelectionAriaLabel: "stakeholders",
                  // t('terms.stakeholder(s)')
                  placeholderText: t("composed.selectMany", {
                    what: t("terms.stakeholder(s)").toLowerCase(),
                  }),
                  maxHeight: DEFAULT_SELECT_MAX_HEIGHT,
                  isFetching: isFetchingStakeholders,
                  fetchError: fetchErrorStakeholders,
                }}
                stakeholders={stakeholders?.data || []}
              />
            </FormGroup>
            <FormGroup
              label={t("terms.stakeholderGroups")}
              fieldId="stakeholderGroups"
              isRequired={false}
              validated={getValidatedFromError(formik.errors.stakeholderGroups)}
              helperTextInvalid={formik.errors.stakeholderGroups}
            >
              <StakeholderGroupSelect
                fieldConfig={{
                  name: "stakeholderGroups",
                }}
                selectConfig={{
                  variant: "typeaheadmulti",
                  "aria-label": "stakeholder-groups",
                  "aria-describedby": "stakeholder-groups",
                  typeAheadAriaLabel: "stakeholder-groups",
                  toggleAriaLabel: "stakeholder-groups",
                  clearSelectionsAriaLabel: "stakeholder-groups",
                  removeSelectionAriaLabel: "stakeholder-groups",
                  // t('terms.stakeholderGroup(s)')
                  placeholderText: t("composed.selectMany", {
                    what: t("terms.stakeholderGroup(s)").toLowerCase(),
                  }),
                  maxHeight: DEFAULT_SELECT_MAX_HEIGHT,
                  isFetching: isFetchingStakeholderGroups,
                  fetchError: fetchErrorStakeholderGroups,
                }}
                stakeholderGroups={stakeholderGroups?.data || []}
              />
            </FormGroup>
          </FormSection>
        </GridItem>
      </Grid>
    </div>
  );
};
