import React from "react";
import { Text, TextVariants } from "@patternfly/react-core";

import { Ticket } from "@app/api/models";
import { useTranslation } from "react-i18next";
import ExternalLink from "@app/components/ExternalLink";

export interface ITicketIssueProps {
  ticket?: Ticket;
}

export const TicketIssue: React.FC<ITicketIssueProps> = ({ ticket }) => {
  const { t } = useTranslation();

  return (
    <>
      <Text component={TextVariants.p}>
        {ticket?.link ? (
          <ExternalLink href={ticket.link}>{ticket?.link}</ExternalLink>
        ) : (
          t("terms.unassigned")
        )}
      </Text>
    </>
  );
};
