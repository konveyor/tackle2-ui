import React from "react";
import { Text, TextVariants } from "@patternfly/react-core";

import { Ticket } from "@app/api/models";
import { useTranslation } from "react-i18next";
import ExternalLink from "@app/components/ExternalLink";
import { useTrackerTypesByProjectId } from "@app/queries/trackers";

export interface ITicketIssueProps {
  ticket?: Ticket;
}

export const TicketIssue: React.FC<ITicketIssueProps> = ({ ticket }) => {
  const { t } = useTranslation();
  const ticketIssue = useTicketIssue(ticket);

  return (
    <Text component={TextVariants.p}>
      {ticket?.link ? (
        <ExternalLink href={ticket.link}>{ticketIssue}</ExternalLink>
      ) : (
        t("terms.unassigned")
      )}
    </Text>
  );
};

const useTicketIssue = (ticket?: Ticket) => {
  const types = useTrackerTypesByProjectId(
    ticket?.tracker?.name,
    ticket?.parent
  );
  const type = types.find((kind) => kind.id === ticket?.kind);

  return type ? type.name : "";
};
