import axios from "axios";
import MockAdapter from "axios-mock-adapter";
import { renderHook, act } from "@testing-library/react-hooks";
import { useFetchApplicationDependencies } from "./useFetchApplicationDependencies";
import { ApplicationDependencyPage } from "@app/api/models";
import { APPLICATION_DEPENDENCY } from "@app/api/rest";

describe("useFetchApplicationDependencies", () => {
  it("Fetch all", async () => {
    // Mock REST API
    const data: ApplicationDependencyPage = {
      _embedded: {
        "applications-dependency": [],
      },
      total_count: 0,
    };

    new MockAdapter(axios)
      .onGet(`${APPLICATION_DEPENDENCY}?page=0&size=1000&from.id=1`)
      .reply(200, data);

    // Use hook
    const { result, waitForNextUpdate } = renderHook(() =>
      useFetchApplicationDependencies()
    );

    const {
      applicationDependencies: items,
      isFetching,
      fetchError,
      fetchAllApplicationDependencies: fetchAll,
    } = result.current;

    expect(isFetching).toBe(false);
    expect(items).toBeUndefined();
    expect(fetchError).toBeUndefined();

    // Init fetch
    act(() => fetchAll({ from: ["1"] }));
    expect(result.current.isFetching).toBe(true);

    // Fetch finished
    await waitForNextUpdate();
    expect(result.current.isFetching).toBe(false);
    expect(result.current.applicationDependencies).toMatchObject({
      data: [],
      meta: { count: 0 },
    });
    expect(result.current.fetchError).toBeUndefined();
  });
});
