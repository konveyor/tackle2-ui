import React from "react";
import { Button, Text, TextVariants } from "@patternfly/react-core";

import { Ticket } from "@app/api/models";
import { useTranslation } from "react-i18next";
import { UnlinkIcon } from "@patternfly/react-icons";
import { useDeleteTicketMutation } from "@app/queries/migration-waves";

export interface ITicketIssueProps {
  ticket?: Ticket;
}

export const TicketIssue: React.FC<ITicketIssueProps> = ({ ticket }) => {
  const { t } = useTranslation();
  const { mutate: deleteTicket } = useDeleteTicketMutation();

  return (
    <>
      <Text
        component={TextVariants.p}
        className="pf-v5-u-color-200 pf-v5-u-font-weight-light"
      >
        {ticket ? (
          <a href={ticket.link} target="_">
            {ticket?.link}
          </a>
        ) : (
          t("terms.unassigned")
        )}
        {ticket?.id && (
          <Button
            variant="link"
            icon={<UnlinkIcon />}
            onClick={() => deleteTicket(ticket.id)}
          />
        )}
      </Text>
    </>
  );
};
