import { AxiosError, AxiosHeaders } from "axios";

import { isAgenticRbacError } from "./agentic";

const axiosError = (status: number, data: unknown) =>
  new AxiosError("Request failed", String(status), undefined, undefined, {
    status,
    statusText: "",
    headers: {},
    config: { headers: new AxiosHeaders() },
    data,
  });

const FORBIDDEN =
  'agents.konveyor.io is forbidden: User "system:serviceaccount:konveyor-tackle:tackle-hub" cannot list resource "agents" in API group "konveyor.io" in the namespace "konveyor-tackle"';

describe("isAgenticRbacError", () => {
  it("recognises the Hub's RBAC denial on a 500", () => {
    expect(isAgenticRbacError(axiosError(500, { error: FORBIDDEN }))).toBe(
      true
    );
  });

  it("recognises the denial on a 403 with a plain-text body", () => {
    expect(isAgenticRbacError(axiosError(403, FORBIDDEN))).toBe(true);
  });

  it("ignores other 500s", () => {
    expect(
      isAgenticRbacError(axiosError(500, { error: "storage is initializing" }))
    ).toBe(false);
  });

  it("ignores forbidden responses that are not about konveyor.io", () => {
    expect(isAgenticRbacError(axiosError(403, "forbidden"))).toBe(false);
  });

  it("ignores non-axios errors", () => {
    expect(isAgenticRbacError(new Error(FORBIDDEN))).toBe(false);
    expect(isAgenticRbacError(undefined)).toBe(false);
  });
});
