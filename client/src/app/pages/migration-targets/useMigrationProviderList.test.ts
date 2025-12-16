import {
  DEFAULT_PROVIDER,
  useMigrationProviderList,
} from "./useMigrationProviderList";

describe("useMigrationProviderList", () => {
  it("returns the expected provider list", () => {
    const providers = useMigrationProviderList();

    expect(providers).toEqual(["C#", "Golang", "Java", "Python", "TypeScript"]);
  });

  it("returns a sorted list alphabetically", () => {
    const providers = useMigrationProviderList();
    const sortedProviders = [...providers].sort();

    expect(providers).toEqual(sortedProviders);
  });

  it("contains no duplicate providers", () => {
    const providers = useMigrationProviderList();
    const uniqueProviders = [...new Set(providers)];

    expect(providers.length).toBe(uniqueProviders.length);
  });

  it("returns the same reference on multiple calls", () => {
    const firstCall = useMigrationProviderList();
    const secondCall = useMigrationProviderList();

    expect(firstCall).toBe(secondCall);
  });

  describe("DEFAULT_PROVIDER", () => {
    it("is set to Java", () => {
      expect(DEFAULT_PROVIDER).toBe("Java");
    });

    it("is included in the provider list", () => {
      const providers = useMigrationProviderList();

      expect(providers).toContain(DEFAULT_PROVIDER);
    });
  });
});
