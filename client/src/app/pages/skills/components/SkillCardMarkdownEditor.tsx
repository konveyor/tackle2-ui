import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  Button,
  FormHelperText,
  HelperText,
  HelperTextItem,
  TextArea,
} from "@patternfly/react-core";
import { FileCodeIcon } from "@patternfly/react-icons";

import type { SkillFrontmatter, SkillValidationIssue } from "@app/utils/skills";
import { validateSkillMarkdown } from "@app/utils/skills";

/** What the editor shows under the textarea and what gates the form's submit. */
export interface SkillMarkdownIssues {
  frontmatter?: SkillFrontmatter;
  /** Block saving — the controller would mark the card InvalidSkillContent. */
  errors: SkillValidationIssue[];
  /** Shown, but saving is allowed. */
  warnings: SkillValidationIssue[];
}

const NO_ISSUES: SkillMarkdownIssues = { errors: [], warnings: [] };

/**
 * Live validation of an inline SKILL.md against the card it will be saved
 * as. Empty content yields no issues: the form treats that as "required",
 * not "invalid". Adds the one check the shared validator cannot do on its
 * own — a frontmatter name that differs from the card name is a warning,
 * because the agent sees the frontmatter name, not the card's.
 */
export function useSkillMarkdownIssues(
  markdown: string,
  cardName: string
): SkillMarkdownIssues {
  return useMemo(() => {
    if (markdown.trim() === "") return NO_ISSUES;
    const result = validateSkillMarkdown(markdown);
    const warnings = [...result.warnings];
    const frontmatterName = result.frontmatter?.name;
    const card = cardName.trim();
    if (frontmatterName && card && frontmatterName !== card) {
      warnings.push({
        code: "nameDiffersFromCard",
        params: { name: frontmatterName },
      });
    }
    return { frontmatter: result.frontmatter, errors: result.errors, warnings };
  }, [markdown, cardName]);
}

interface SkillCardMarkdownEditorProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  issues: SkillMarkdownIssues;
  /** Fills the (empty) editor with a starter SKILL.md. */
  onInsertTemplate: () => void;
  isDisabled?: boolean;
}

/**
 * The inline SKILL.md editor: a monospace textarea, a template button that is
 * only enabled while the editor is empty (so it can never overwrite content),
 * and the validator's findings rendered as error / warning helper items.
 */
export function SkillCardMarkdownEditor({
  id,
  value,
  onChange,
  issues,
  onInsertTemplate,
  isDisabled,
}: SkillCardMarkdownEditorProps) {
  const { t } = useTranslation();
  const isEmpty = value.trim() === "";
  const validated = isEmpty
    ? "default"
    : issues.errors.length > 0
      ? "error"
      : issues.warnings.length > 0
        ? "warning"
        : "success";

  return (
    <>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "baseline",
          gap: "0.5rem 1rem",
          marginBottom: "0.5rem",
        }}
      >
        <Button
          id={`${id}-insert-template`}
          variant="link"
          isInline
          icon={<FileCodeIcon />}
          isDisabled={isDisabled || !isEmpty}
          onClick={onInsertTemplate}
        >
          {t("agentic.skills.insertTemplate")}
        </Button>
        {!isEmpty && (
          <span className="pf-v6-u-font-size-sm pf-v6-u-color-200">
            {t("agentic.skills.insertTemplateBlocked")}
          </span>
        )}
      </div>
      <TextArea
        id={id}
        aria-label={t("agentic.skills.inlineContent")}
        value={value}
        onChange={(_e, v) => onChange(v)}
        rows={14}
        resizeOrientation="vertical"
        autoResize={false}
        validated={validated}
        isDisabled={isDisabled}
        spellCheck={false}
        placeholder={t("agentic.skills.inlinePlaceholder")}
        style={{ fontFamily: "var(--pf-t--global--font--family--mono)" }}
      />
      <FormHelperText>
        <HelperText>
          {issues.errors.map((issue) => (
            <HelperTextItem key={issue.code} variant="error">
              {t(`agentic.skills.validation.${issue.code}`, issue.params)}
            </HelperTextItem>
          ))}
          {issues.warnings.map((issue) => (
            <HelperTextItem key={issue.code} variant="warning">
              {t(`agentic.skills.validation.${issue.code}`, issue.params)}
            </HelperTextItem>
          ))}
          <HelperTextItem>{t("agentic.skills.inlineHelper")}</HelperTextItem>
        </HelperText>
      </FormHelperText>
    </>
  );
}
