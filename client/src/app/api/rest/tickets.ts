import axios from "axios";

import { New, Ref, Ticket } from "../models";
import { hub } from "../rest";

const TICKETS = hub`/tickets`;

export const createTickets = (payload: New<Ticket>, applications: Ref[]) => {
  return Promise.all(
    applications.map((app) => {
      const appPayload: New<Ticket> = {
        ...payload,
        application: { id: app.id, name: app.name },
      };
      return axios.post(TICKETS, appPayload);
    })
  );
};

export const getTickets = (): Promise<Ticket[]> =>
  axios.get(TICKETS).then((response) => response.data);

export const deleteTicket = (id: number): Promise<Ticket> =>
  axios.delete(`${TICKETS}/${id}`);
