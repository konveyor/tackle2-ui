import React from "react";
import { useTranslation } from "react-i18next";
import {
  Button,
  FormHelperText,
  Grid,
  GridItem,
  HelperText,
  HelperTextItem,
  TextInput,
} from "@patternfly/react-core";
import { MinusCircleIcon, PlusCircleIcon } from "@patternfly/react-icons";

import type { EnvNameProblem, EnvVar } from "@app/api/agentic/contract";
import { RUN_ENV, envNameProblem } from "@app/api/agentic/contract";

/**
 * One row of the environment editor. The id is local to the form and
 * never sent: two rows can legitimately be blank or hold the same name
 * while the user is typing, so rows cannot be keyed by name.
 */
export interface EnvRow {
  id: string;
  name: string;
  value: string;
}

let nextRowId = 0;
export const newEnvRow = (name = "", value = ""): EnvRow => ({
  id: `env-${(nextRowId += 1)}`,
  name,
  value,
});

/**
 * The rows a run's own `spec.env` should seed when a create form is
 * reopened from it ("Run again").
 *
 * Reserved names are dropped: the Hub re-injects them, so carrying them
 * over would show the user values they cannot change. Entries with no
 * plain `value` are dropped too — `HUB_TOKEN` arrives as a secret
 * reference, and a text input cannot represent one.
 */
export const envRowsFromRun = (env?: EnvVar[]): EnvRow[] =>
  (env ?? [])
    .filter((e) => !envNameProblem(e.name) && e.value !== undefined)
    .map((e) => newEnvRow(e.name, e.value ?? ""));

/** The rows as `spec.env`, dropping any the user left entirely blank. */
export const envRowsToSpec = (rows: EnvRow[]): EnvVar[] | undefined => {
  const env = rows
    .filter((r) => r.name.trim())
    .map((r) => ({ name: r.name.trim(), value: r.value }));
  return env.length > 0 ? env : undefined;
};

/** A row's problem, judged against the other rows. */
export const envRowProblem = (
  rows: EnvRow[],
  index: number
): EnvNameProblem | undefined => {
  const row = rows[index];
  // A wholly empty row is the one the form starts with: not an error
  // until the user commits to it by typing a value.
  if (!row.name.trim() && !row.value) return undefined;
  return envNameProblem(
    row.name,
    rows.filter((_, i) => i !== index).map((r) => r.name)
  );
};

/** True when any row would be rejected; the caller blocks submit on it. */
export const envRowsInvalid = (rows: EnvRow[]): boolean =>
  rows.some((_, i) => envRowProblem(rows, i) !== undefined);

const PROBLEM_KEY: Record<EnvNameProblem, string> = {
  required: "agentic.runEnv.nameRequired",
  format: "agentic.runEnv.nameFormat",
  reserved: "agentic.runEnv.nameReserved",
  duplicate: "agentic.runEnv.nameDuplicate",
};

/**
 * Repeatable name/value rows for a run's `spec.env`.
 *
 * Plain values only. `envFrom`, and a value drawn from a Secret, are a
 * different control and a different permission question; a credential
 * typed here would be stored in the run spec in clear, which the helper
 * text says and the reserved-name check cannot prevent.
 */
export const EnvVarFields: React.FC<{
  rows: EnvRow[];
  onChange: (rows: EnvRow[]) => void;
}> = ({ rows, onChange }) => {
  const { t } = useTranslation();

  const update = (index: number, patch: Partial<EnvRow>) =>
    onChange(rows.map((r, i) => (i === index ? { ...r, ...patch } : r)));

  return (
    <>
      {rows.map((row, index) => {
        const problem = envRowProblem(rows, index);
        return (
          <Grid hasGutter key={row.id}>
            <GridItem span={4}>
              <TextInput
                aria-label={t("agentic.runEnv.nameLabel")}
                placeholder={t("agentic.runEnv.namePlaceholder")}
                value={row.name}
                validated={problem ? "error" : "default"}
                onChange={(_e, v) => update(index, { name: v })}
              />
              {problem && (
                <FormHelperText>
                  <HelperText>
                    <HelperTextItem variant="error">
                      {t(PROBLEM_KEY[problem], {
                        names: [...Object.values(RUN_ENV)].join(", "),
                      })}
                    </HelperTextItem>
                  </HelperText>
                </FormHelperText>
              )}
            </GridItem>
            <GridItem span={7}>
              <TextInput
                aria-label={t("agentic.runEnv.valueLabel")}
                placeholder={t("agentic.runEnv.valuePlaceholder")}
                value={row.value}
                onChange={(_e, v) => update(index, { value: v })}
              />
            </GridItem>
            <GridItem span={1}>
              <Button
                variant="plain"
                aria-label={t("agentic.runEnv.remove", { name: row.name })}
                icon={<MinusCircleIcon />}
                onClick={() => onChange(rows.filter((_, i) => i !== index))}
              />
            </GridItem>
          </Grid>
        );
      })}
      <Button
        variant="link"
        isInline
        icon={<PlusCircleIcon />}
        onClick={() => onChange([...rows, newEnvRow()])}
      >
        {t("agentic.runEnv.add")}
      </Button>
      <FormHelperText>
        <HelperText>
          <HelperTextItem>{t("agentic.runEnv.helper")}</HelperTextItem>
        </HelperText>
      </FormHelperText>
    </>
  );
};
