import type { Identity } from "@app/api/models";

import { resolveSourceCredential } from "./useEffectiveSourceCredential";

const identity = (
  id: number,
  name: string,
  kind: Identity["kind"],
  isDefault = false
): Identity => ({ id, name, kind, default: isDefault });

const iansGit = identity(7, "ians-git", "source");
const defaultGit = identity(8, "org-default", "source", true);
const mavenSettings = identity(9, "maven-settings", "maven");

describe("resolveSourceCredential", () => {
  it("prefers the credential linked to the application under role=source", () => {
    const { resolved, candidates } = resolveSourceCredential(
      { identities: [{ id: 7, name: "ians-git", role: "source" }] },
      [iansGit, defaultGit]
    );
    expect(resolved).toEqual({
      id: 7,
      name: "ians-git",
      origin: "application",
    });
    expect(candidates).toHaveLength(0);
  });

  it("falls back to the default source credential when none is linked", () => {
    const { resolved } = resolveSourceCredential({ identities: [] }, [
      iansGit,
      defaultGit,
    ]);
    expect(resolved).toEqual({
      id: 8,
      name: "org-default",
      origin: "default",
    });
  });

  it("ignores a linked credential whose role is not source", () => {
    const { resolved, candidates } = resolveSourceCredential(
      { identities: [{ id: 9, name: "maven-settings", role: "maven" }] },
      [iansGit, mavenSettings]
    );
    expect(resolved).toBeUndefined();
    expect(candidates).toEqual([iansGit]);
  });

  it("ignores a default credential of another kind", () => {
    const { resolved, candidates } = resolveSourceCredential(
      { identities: [] },
      [identity(10, "default-maven", "maven", true)]
    );
    expect(resolved).toBeUndefined();
    expect(candidates).toHaveLength(0);
  });

  it("names the unattached source credentials — the reporter's case", () => {
    // ians-git exists, is not linked to the application, and is not the
    // default: the harness resolves nothing and the run pushes anonymously.
    const { resolved, candidates } = resolveSourceCredential(
      { identities: [] },
      [iansGit, mavenSettings]
    );
    expect(resolved).toBeUndefined();
    expect(candidates).toEqual([iansGit]);
  });

  it("reports nothing at all when the Hub holds no source credential", () => {
    const { resolved, candidates } = resolveSourceCredential({}, [
      mavenSettings,
    ]);
    expect(resolved).toBeUndefined();
    expect(candidates).toHaveLength(0);
  });
});
