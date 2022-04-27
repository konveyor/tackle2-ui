import * as React from "react";
import {
  Button,
  Form,
  FormGroup,
  InputGroup,
  Select,
  SelectOption,
  SelectVariant,
  Text,
  TextContent,
  TextInput,
  Title,
} from "@patternfly/react-core";
import { useForm, useFormContext } from "react-hook-form";
import DelIcon from "@patternfly/react-icons/dist/esm/icons/error-circle-o-icon";
import spacing from "@patternfly/react-styles/css/utilities/Spacing/spacing";
import { getValidatedFromError } from "@app/utils/utils";

const defaultTargets = [
  "camel",
  "cloud-readiness",
  "drools",
  "eap",
  "eap6",
  "eap7",
  "eapxp",
  "fsw",
  "fuse",
  "hibernate",
  "hibernate-search",
  "jakarta-ee",
  "java-ee",
  "jbpm",
  "linux",
  "openjdk",
  "quarkus",
  "quarkus1",
  "resteasy",
  "rhr",
];

const defaultSources = [
  "agroal",
  "amazon",
  "artemis",
  "avro",
  "camel",
  "config",
  "drools",
  "eap",
  "eap6",
  "eap7",
  "eapxp",
  "elytron",
  "glassfish",
  "hibernate",
  "hibernate-search",
  "java",
  "java-ee",
  "javaee",
  "jbpm",
  "jdbc",
  "jonas",
  "jrun",
  "jsonb",
  "jsonp",
  "kafka",
  "keycloak",
  "kubernetes",
  "log4j",
  "logging",
  "narayana",
  "openshift",
  "oraclejdk",
  "orion",
  "quarkus1",
  "resin",
  "resteasy",
  "rmi",
  "rpc",
  "seam",
  "soa",
  "soa-p",
  "sonic",
  "sonicesb",
  "springboot",
  "thorntail",
  "weblogic",
  "websphere",
];

export const SetOptions: React.FunctionComponent = () => {
  const { getValues, setValue } = useFormContext();
  const {
    register,
    formState: { errors },
  } = useForm({ mode: "onBlur" });

  const targets: string[] = getValues("targets");
  const sources: string[] = getValues("sources");
  const excludedRulesTags: string[] = getValues("excludedRulesTags");

  const [isSelectTargetsOpen, setSelectTargetsOpen] = React.useState(false);
  const [isSelectSourcesOpen, setSelectSourcesOpen] = React.useState(false);
  const [ruleToExclude, setRuleToExclude] = React.useState("");

  return (
    <>
      <TextContent>
        <Title headingLevel="h3" size="xl">
          Advanced options
        </Title>
        <Text>Specify additional options here.</Text>
      </TextContent>
      <Form isHorizontal>
        <FormGroup label="Targets" fieldId="targets">
          <Select
            variant={SelectVariant.typeaheadMulti}
            aria-label="Select targets"
            selections={targets}
            isOpen={isSelectTargetsOpen}
            onSelect={(_, selection) => {
              if (!targets.includes(selection as string))
                setValue("targets", [...targets, selection] as string[]);
              else
                setValue(
                  "targets",
                  targets.filter((target) => target !== selection)
                );
              setSelectTargetsOpen(!isSelectTargetsOpen);
            }}
            onToggle={() => {
              setSelectTargetsOpen(!isSelectTargetsOpen);
            }}
            onClear={() => {
              setValue("targets", []);
            }}
          >
            {defaultTargets.map((target, index) => (
              <SelectOption key={index} component="button" value={target} />
            ))}
          </Select>
        </FormGroup>
        <FormGroup label="Sources" fieldId="sources">
          <Select
            variant={SelectVariant.typeaheadMulti}
            aria-label="Select sources"
            selections={sources}
            isOpen={isSelectSourcesOpen}
            onSelect={(_, selection) => {
              if (!sources.includes(selection as string))
                setValue("sources", [...sources, selection] as string[]);
              else
                setValue(
                  "sources",
                  sources.filter((source) => source !== selection)
                );
              setSelectSourcesOpen(!isSelectSourcesOpen);
            }}
            onToggle={() => {
              setSelectSourcesOpen(!isSelectSourcesOpen);
            }}
            onClear={() => {
              setValue("sources", []);
            }}
          >
            {defaultSources.map((source, index) => (
              <SelectOption key={index} component="button" value={source} />
            ))}
          </Select>
        </FormGroup>
        <FormGroup
          label="Excluded rules tags"
          fieldId="ruleTagToExclude"
          validated={getValidatedFromError(errors.ruleTagToExclude)}
          helperTextInvalid={errors?.ruleTagToExclude?.message}
        >
          <InputGroup>
            <TextInput
              id="ruleTagToExclude"
              aria-label="Rule tag to exclude"
              {...register("ruleTagToExclude", {
                minLength: {
                  value: 2,
                  message: "A rule tag must be at least 2 characters",
                },
                maxLength: {
                  value: 60,
                  message: "A rule tag cannot exceed 60 characters",
                },
              })}
              onChange={(value) => setRuleToExclude(value)}
              validated={getValidatedFromError(errors.ruleTagToExclude)}
              value={ruleToExclude}
            />
            <Button
              id="add-rule-tag"
              variant="control"
              isDisabled={!!errors.ruleTagToExclude}
              onClick={() => {
                setValue("excludedRulesTags", [
                  ...excludedRulesTags,
                  ruleToExclude,
                ]);
                setRuleToExclude("");
              }}
            >
              Add
            </Button>
          </InputGroup>
          <div className={spacing.ptMd}>
            {excludedRulesTags.map((pkg, index) => (
              <div key={index}>
                <InputGroup key={index}>
                  <Text className="package">{pkg}</Text>
                  <Button
                    isInline
                    id="remove-from-excluded-rules-tags"
                    variant="control"
                    icon={<DelIcon />}
                    onClick={() =>
                      setValue(
                        "excludedRulesTags",
                        excludedRulesTags.filter((p) => p !== pkg)
                      )
                    }
                  />
                </InputGroup>
              </div>
            ))}
          </div>
        </FormGroup>
      </Form>
    </>
  );
};
