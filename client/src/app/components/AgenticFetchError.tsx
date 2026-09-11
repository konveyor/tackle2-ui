import * as React from "react";
import { AxiosError } from "axios";
import { useTranslation } from "react-i18next";
import {
  Button,
  EmptyState,
  EmptyStateBody,
  EmptyStateFooter,
  EmptyStateVariant,
} from "@patternfly/react-core";
import { ExclamationCircleIcon } from "@patternfly/react-icons";

import { isAgenticRbacError } from "@app/utils/agentic";
import { getAxiosErrorMessage } from "@app/utils/utils";

export interface AgenticFetchErrorProps {
  /** The error returned by a `useFetch*` agentic query hook. */
  error: unknown;
  /** Re-run the query. Polling pauses while a query is errored, so this is how the page recovers without a reload. */
  onRetry?: () => void;
}

const errorMessage = (error: unknown): string => {
  if (error instanceof AxiosError) return getAxiosErrorMessage(error);
  if (error instanceof Error) return error.message;
  return String(error);
};

/**
 * Error state for the agentic pages. Unlike the generic `StateError`, this
 * surfaces the Hub's actual response so a misconfigured cluster is diagnosable
 * from the browser, and names the fix when the failure is the Hub's own
 * ServiceAccount being denied by RBAC.
 */
export const AgenticFetchError: React.FC<AgenticFetchErrorProps> = ({
  error,
  onRetry,
}) => {
  const { t } = useTranslation();
  const rbac = isAgenticRbacError(error);
  const message = errorMessage(error);

  return (
    <EmptyState
      headingLevel="h2"
      icon={ExclamationCircleIcon}
      titleText={
        rbac ? t("agentic.fetchError.rbacTitle") : t("agentic.fetchError.title")
      }
      variant={EmptyStateVariant.sm}
      status="danger"
    >
      <EmptyStateBody>
        {rbac && <p>{t("agentic.fetchError.rbacHint")}</p>}
        <p>
          <strong>{t("agentic.fetchError.serverSaid")}</strong>{" "}
          <code>{message}</code>
        </p>
      </EmptyStateBody>
      {onRetry && (
        <EmptyStateFooter>
          <Button variant="link" onClick={onRetry}>
            {t("agentic.fetchError.retry")}
          </Button>
        </EmptyStateFooter>
      )}
    </EmptyState>
  );
};
