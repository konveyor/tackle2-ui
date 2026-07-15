import axios from "axios";

import { New, Ref, Ticket } from "../models";
import { hub } from "../rest";

const TICKETS = hub`/tickets`;

export const getTickets = () =>
  axios.get<Ticket[]>(TICKETS).then((response) => response.data);

export const createTickets = (payload: New<Ticket>, applications: Ref[]) =>
  Promise.all(
    applications.map((app) => {
      const appPayload: New<Ticket> = {
        ...payload,
        application: { id: app.id, name: app.name },
      };
      return axios.post<Ticket>(TICKETS, appPayload).then((r) => r.data);
    })
  );

export const deleteTicket = (id: number) =>
  axios.delete<void>(`${TICKETS}/${id}`);
