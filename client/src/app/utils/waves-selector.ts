import {
  AggregateTicketStatus,
  Application,
  MigrationWave,
  Ref,
  StakeholderWithRole,
  Ticket,
  TicketStatus,
  WaveWithStatus,
} from "@app/api/models";
import { ApplicationsQueryKey } from "@app/queries/applications";
import { StakeholdersQueryKey } from "@app/queries/stakeholders";
import { TicketsQueryKey } from "@app/queries/tickets";
import { useQueryClient } from "@tanstack/react-query";
import dayjs from "dayjs";

export const getWavesWithStatus = (waves: MigrationWave[]) => {
  const queryClient = useQueryClient();

  const tickets = queryClient.getQueryData<Ticket[]>([TicketsQueryKey]) || [];

  const stakeholders =
    queryClient.getQueryData<StakeholderWithRole[]>([StakeholdersQueryKey]) ||
    [];

  const applications =
    queryClient.getQueryData<Application[]>([ApplicationsQueryKey]) || [];

  const aggregateTicketStatus = (val: TicketStatus, startDate: string) => {
    const ticketStatusToAggregate: Map<TicketStatus, AggregateTicketStatus> =
      new Map([
        ["", "Not Started"],
        ["New", "Issues Created"],
        ["In Progress", "In Progress"],
        ["Done", "Completed"],
        ["Error", "Error"],
      ]);
    console.log("val", val);

    const status = ticketStatusToAggregate.get(val);

    console.log("status", status);

    if (status === "Issues Created") {
      const now = dayjs.utc();
      const start = dayjs.utc(startDate);
      var duration = now.diff(start);
      if (duration > 0) return "In Progress";
    }
    return status ? status : "Error";
  };

  const aggregatedTicketStatus = (
    wave: MigrationWave,
    tickets: Ticket[]
  ): AggregateTicketStatus => {
    const statuses = getTicketStatus(wave, tickets);
    if (statuses.length === 0) return "No Issues";

    const status = statuses.reduce(
      (acc, val) => (acc === val ? acc : "Error"),
      statuses[0]
    );
    return aggregateTicketStatus(status, wave.startDate);
  };
  const getTicketByApplication = (tickets: Ticket[], id: number = 0) =>
    tickets.find((ticket) => ticket.application?.id === id);

  const getTicketStatus = (
    wave: MigrationWave,
    tickets: Ticket[]
  ): TicketStatus[] =>
    wave.applications.map((application): TicketStatus => {
      const matchingTicket = getTicketByApplication(tickets, application.id);
      if (matchingTicket?.error) {
        return "Error";
      } else if (matchingTicket?.status) {
        return matchingTicket.status;
      } else return "";
    });

  const getApplicationsOwners = (id: number) => {
    const applicationOwnerIds = applications
      .filter((application) => application.migrationWave?.id === id)
      .map((application) => application.owner?.id);

    return stakeholders.filter((stakeholder) =>
      applicationOwnerIds.includes(stakeholder.id)
    );
  };

  const getApplicationsContributors = (id: number) => {
    const applicationContributorsIds = applications
      .filter((application) => application.migrationWave?.id === id)
      .map((application) =>
        application.contributors?.map((contributor) => contributor.id)
      )
      .flat();

    return stakeholders.filter((stakeholder) =>
      applicationContributorsIds.includes(stakeholder.id)
    );
  };

  const getStakeholdersByMigrationWave = (migrationWave: MigrationWave) => {
    const holderIds = migrationWave.stakeholders.map(
      (stakeholder) => stakeholder.id
    );
    return stakeholders.filter((stakeholder) =>
      holderIds.includes(stakeholder.id)
    );
  };

  const getStakeholderFromGroupsByMigrationWave = (
    migrationWave: MigrationWave
  ) => {
    const groupIds = migrationWave.stakeholderGroups.map(
      (stakeholderGroup) => stakeholderGroup.id
    );

    return stakeholders.filter((stakeholder) =>
      stakeholder.stakeholderGroups?.find((stakeholderGroup) =>
        groupIds.includes(stakeholderGroup.id)
      )
    );
  };

  const getAllStakeholders = (migrationWave: MigrationWave) => {
    const allStakeholders: StakeholderWithRole[] = getApplicationsOwners(
      migrationWave.id
    );

    getApplicationsContributors(migrationWave.id).forEach((stakeholder) => {
      if (!allStakeholders.includes(stakeholder))
        allStakeholders.push(stakeholder);
    });

    getStakeholdersByMigrationWave(migrationWave).forEach((stakeholder) => {
      if (!allStakeholders.includes(stakeholder))
        allStakeholders.push(stakeholder);
    });

    getStakeholderFromGroupsByMigrationWave(migrationWave).forEach(
      (stakeholder) => {
        if (!allStakeholders.includes(stakeholder))
          allStakeholders.push(stakeholder);
      }
    );

    return allStakeholders;
  };
  const getApplications = (refs: Ref[]) => {
    const ids = refs.map((ref) => ref.id);
    return applications.filter((application: any) =>
      ids.includes(application.id)
    );
  };
  const wavesWithStatus: WaveWithStatus[] = waves.map(
    (wave): WaveWithStatus => {
      return {
        ...wave,
        ticketStatus: getTicketStatus(wave, tickets),
        status: aggregatedTicketStatus(wave, tickets),
        fullApplications: getApplications(wave.applications),
        allStakeholders: getAllStakeholders(wave),
      };
    }
  );
  return wavesWithStatus;
};
