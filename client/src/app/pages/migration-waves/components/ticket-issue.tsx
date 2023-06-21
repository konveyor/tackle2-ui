import React from "react";
import { Text } from "@patternfly/react-core";

import { Ticket } from "@app/api/models";
import { useTrackerTypesByProjectId } from "@app/queries/trackers";

export interface ITicketIssueProps {
  ticket?: Ticket;
}

export const TicketIssue: React.FC<ITicketIssueProps> = ({ ticket }) => {
  const useTicketIssue = () => {
    const types = useTrackerTypesByProjectId(
      ticket?.tracker?.name,
      ticket?.parent
    );
    const type = types.find((kind) => kind.id === ticket?.kind);
    if (type) return type.name;
    return "";
  };

  const ticketIssue = useTicketIssue();

  return <Text>{ticketIssue}</Text>;
};
