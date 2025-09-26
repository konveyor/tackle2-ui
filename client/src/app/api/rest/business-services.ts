import axios from "axios";

import { BusinessService, New } from "../models";
import { hub } from "../rest";

const BUSINESS_SERVICES = hub`/businessservices`;

export const getBusinessServices = () =>
  axios
    .get<BusinessService[]>(BUSINESS_SERVICES)
    .then((response) => response.data);

export const getBusinessServiceById = (id: number | string) =>
  axios
    .get<BusinessService>(`${BUSINESS_SERVICES}/${id}`)
    .then((response) => response.data);

export const createBusinessService = (obj: New<BusinessService>) =>
  axios.post<BusinessService>(BUSINESS_SERVICES, obj);

export const updateBusinessService = (obj: BusinessService) =>
  axios.put<void>(`${BUSINESS_SERVICES}/${obj.id}`, obj);

export const deleteBusinessService = (id: number | string) =>
  axios.delete<void>(`${BUSINESS_SERVICES}/${id}`);
