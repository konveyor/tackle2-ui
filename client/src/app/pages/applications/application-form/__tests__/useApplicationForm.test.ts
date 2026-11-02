import {
  IdentityRole,
  ManagedIdentityRole,
  RefWithRole,
} from "@app/api/models";

import {
  resolveSourceIdentity,
  withSourceIdentity,
} from "../useApplicationForm";

const ref = (
  id: number,
  name: string,
  role: IdentityRole
): RefWithRole<IdentityRole> => ({ id, name, role });

const sourceRef = (
  id: number,
  name: string
): RefWithRole<ManagedIdentityRole> => ({ id, name, role: "source" });

describe("resolveSourceIdentity", () => {
  const existing = ref(1, "old-pat", "source");

  // Identities load outside `isDataReady`, so the lookup can legitimately come up
  // empty while the request is in flight or after a 403.
  const emptyLookup = () => undefined;
  const lookup = (id: number | null) =>
    id === 2 ? sourceRef(2, "new-pat") : undefined;

  it("keeps the existing identity when the selection is unchanged", () => {
    expect(resolveSourceIdentity(1, existing, lookup)).toBe(existing);
  });

  it("keeps the existing identity even when the lookup cannot resolve it", () => {
    expect(resolveSourceIdentity(1, existing, emptyLookup)).toBe(existing);
  });

  it("resolves a changed selection through the lookup", () => {
    expect(resolveSourceIdentity(2, existing, lookup)).toEqual({
      id: 2,
      name: "new-pat",
      role: "source",
    });
  });

  it("treats a null selection as explicit removal", () => {
    expect(resolveSourceIdentity(null, existing, lookup)).toBeUndefined();
  });

  it("resolves a selection on an application that had none", () => {
    expect(resolveSourceIdentity(2, undefined, lookup)).toEqual({
      id: 2,
      name: "new-pat",
      role: "source",
    });
  });
});

describe("withSourceIdentity", () => {
  it("adds the source identity when the application has none", () => {
    expect(withSourceIdentity(undefined, sourceRef(1, "git-pat"))).toEqual([
      { id: 1, name: "git-pat", role: "source" },
    ]);
  });

  it("replaces an existing source identity", () => {
    const existing = [ref(1, "old-pat", "source")];

    expect(withSourceIdentity(existing, sourceRef(2, "new-pat"))).toEqual([
      { id: 2, name: "new-pat", role: "source" },
    ]);
  });

  it("retains identities in other roles", () => {
    const existing = [
      ref(1, "old-pat", "source"),
      ref(3, "nexus", "maven"),
      ref(4, "asset-pat", "asset"),
    ];

    expect(withSourceIdentity(existing, sourceRef(2, "new-pat"))).toEqual([
      { id: 3, name: "nexus", role: "maven" },
      { id: 4, name: "asset-pat", role: "asset" },
      { id: 2, name: "new-pat", role: "source" },
    ]);
  });

  it("clears the source identity but keeps the other roles", () => {
    const existing = [ref(1, "old-pat", "source"), ref(3, "nexus", "maven")];

    expect(withSourceIdentity(existing, undefined)).toEqual([
      { id: 3, name: "nexus", role: "maven" },
    ]);
  });

  it("returns undefined rather than an empty list when nothing is left", () => {
    const existing = [ref(1, "old-pat", "source")];

    expect(withSourceIdentity(existing, undefined)).toBeUndefined();
    expect(withSourceIdentity(undefined, undefined)).toBeUndefined();
  });
});
