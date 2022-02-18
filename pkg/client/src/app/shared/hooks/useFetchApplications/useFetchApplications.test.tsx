import axios from "axios";
import MockAdapter from "axios-mock-adapter";
import { renderHook, act } from "@testing-library/react-hooks";
import { useFetchApplications } from "./useFetchApplications";
import { ApplicationPage } from "@app/api/models";
import { APPLICATIONS } from "@app/api/rest";

describe("useFetchApplications", () => {
  it("Fetch error due to no REST API found", async () => {
    // Mock REST API
    new MockAdapter(axios).onGet(APPLICATIONS).networkError();

    // Use hook
    const { result, waitForNextUpdate } = renderHook(() =>
      useFetchApplications()
    );

    const {
      applications: items,
      isFetching,
      fetchError,
      fetchApplications: fetchPage,
    } = result.current;

    expect(isFetching).toBe(false);
    expect(items).toBeUndefined();
    expect(fetchError).toBeUndefined();

    // Init fetch
    act(() => fetchPage({}, { page: 2, perPage: 50 }));
    expect(result.current.isFetching).toBe(true);

    // Fetch finished
    await waitForNextUpdate();
    expect(result.current.isFetching).toBe(false);
    expect(result.current.applications).toBeUndefined();
    expect(result.current.fetchError).not.toBeUndefined();
  });

  it("Fetch success", async () => {
    // Mock REST API
    const data: ApplicationPage = {
      _embedded: {
        application: [],
      },
      total_count: 0,
    };

    new MockAdapter(axios)
      .onGet(`${APPLICATIONS}?page=0&size=10`)
      .reply(200, data);

    // Use hook
    const { result, waitForNextUpdate } = renderHook(() =>
      useFetchApplications()
    );

    const {
      applications: items,
      isFetching,
      fetchError,
      fetchApplications: fetchPage,
    } = result.current;

    expect(isFetching).toBe(false);
    expect(items).toBeUndefined();
    expect(fetchError).toBeUndefined();

    // Init fetch
    act(() => fetchPage({}, { page: 1, perPage: 10 }));
    expect(result.current.isFetching).toBe(true);

    // Fetch finished
    await waitForNextUpdate();
    expect(result.current.isFetching).toBe(false);
    expect(result.current.applications).toMatchObject({
      data: [],
      meta: { count: 0 },
    });
    expect(result.current.fetchError).toBeUndefined();
  });

  it("Fetch all", async () => {
    // Mock REST API
    const data: ApplicationPage = {
      _embedded: {
        application: [],
      },
      total_count: 0,
    };

    new MockAdapter(axios)
      .onGet(`${APPLICATIONS}?page=0&size=1000&sort=name`)
      .reply(200, data);

    // Use hook
    const { result, waitForNextUpdate } = renderHook(() =>
      useFetchApplications()
    );

    const {
      applications: items,
      isFetching,
      fetchError,
      fetchAllApplications: fetchAll,
    } = result.current;

    expect(isFetching).toBe(false);
    expect(items).toBeUndefined();
    expect(fetchError).toBeUndefined();

    // Init fetch
    act(() => fetchAll());
    expect(result.current.isFetching).toBe(true);

    // Fetch finished
    await waitForNextUpdate();
    expect(result.current.isFetching).toBe(false);
    expect(result.current.applications).toMatchObject({
      data: [],
      meta: { count: 0 },
    });
    expect(result.current.fetchError).toBeUndefined();
  });
});
