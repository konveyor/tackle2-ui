import axios from "axios";
import MockAdapter from "axios-mock-adapter";
import { renderHook, act } from "@testing-library/react-hooks";
import { useFetchStakeholders } from "./useFetchStakeholders";
import { StakeholderPage } from "@app/api/models";
import { STAKEHOLDERS } from "@app/api/rest";

describe("useFetchStakeholders", () => {
  it("Fetch error due to no REST API found", async () => {
    // Mock REST API
    new MockAdapter(axios).onGet(STAKEHOLDERS).networkError();

    // Use hook
    const { result, waitForNextUpdate } = renderHook(() =>
      useFetchStakeholders()
    );

    const { stakeholders, isFetching, fetchError, fetchStakeholders } =
      result.current;

    expect(isFetching).toBe(false);
    expect(stakeholders).toBeUndefined();
    expect(fetchError).toBeUndefined();

    // Init fetch
    act(() => fetchStakeholders({}, { page: 2, perPage: 50 }));
    expect(result.current.isFetching).toBe(true);

    // Fetch finished
    await waitForNextUpdate();
    expect(result.current.isFetching).toBe(false);
    expect(result.current.stakeholders).toBeUndefined();
    expect(result.current.fetchError).not.toBeUndefined();
  });

  it("Fetch success", async () => {
    // Mock REST API
    const data: StakeholderPage = {
      _embedded: {
        stakeholder: [],
      },
      total_count: 0,
    };

    new MockAdapter(axios)
      .onGet(`${STAKEHOLDERS}?page=0&size=10`)
      .reply(200, data);

    // Use hook
    const { result, waitForNextUpdate } = renderHook(() =>
      useFetchStakeholders()
    );

    const { stakeholders, isFetching, fetchError, fetchStakeholders } =
      result.current;

    expect(isFetching).toBe(false);
    expect(stakeholders).toBeUndefined();
    expect(fetchError).toBeUndefined();

    // Init fetch
    act(() => fetchStakeholders({}, { page: 1, perPage: 10 }));
    expect(result.current.isFetching).toBe(true);

    // Fetch finished
    await waitForNextUpdate();
    expect(result.current.isFetching).toBe(false);
    expect(result.current.stakeholders).toMatchObject({
      data: [],
      meta: { count: 0 },
    });
    expect(result.current.fetchError).toBeUndefined();
  });

  it("Fetch all", async () => {
    // Mock REST API
    const data: StakeholderPage = {
      _embedded: {
        stakeholder: [],
      },
      total_count: 0,
    };

    new MockAdapter(axios)
      .onGet(`${STAKEHOLDERS}?page=0&size=1000&sort=displayName`)
      .reply(200, data);

    // Use hook
    const { result, waitForNextUpdate } = renderHook(() =>
      useFetchStakeholders()
    );

    const { stakeholders, isFetching, fetchError, fetchAllStakeholders } =
      result.current;

    expect(isFetching).toBe(false);
    expect(stakeholders).toBeUndefined();
    expect(fetchError).toBeUndefined();

    // Init fetch
    act(() => fetchAllStakeholders());
    expect(result.current.isFetching).toBe(true);

    // Fetch finished
    await waitForNextUpdate();
    expect(result.current.isFetching).toBe(false);
    expect(result.current.stakeholders).toMatchObject({
      data: [],
      meta: { count: 0 },
    });
    expect(result.current.fetchError).toBeUndefined();
  });
});
