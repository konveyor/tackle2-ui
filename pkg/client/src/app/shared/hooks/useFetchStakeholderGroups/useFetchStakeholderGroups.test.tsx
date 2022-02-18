import axios from "axios";
import MockAdapter from "axios-mock-adapter";
import { renderHook, act } from "@testing-library/react-hooks";
import { useFetchStakeholderGroups } from "./useFetchStakeholderGroups";
import { StakeholderGroupPage } from "@app/api/models";
import { STAKEHOLDER_GROUPS } from "@app/api/rest";

describe("useFetchStakeholderGroups", () => {
  it("Fetch error due to no REST API found", async () => {
    // Mock REST API
    new MockAdapter(axios).onGet(STAKEHOLDER_GROUPS).networkError();

    // Use hook
    const { result, waitForNextUpdate } = renderHook(() =>
      useFetchStakeholderGroups()
    );

    const {
      stakeholderGroups: stakeholders,
      isFetching,
      fetchError,
      fetchStakeholderGroups,
    } = result.current;

    expect(isFetching).toBe(false);
    expect(stakeholders).toBeUndefined();
    expect(fetchError).toBeUndefined();

    // Init fetch
    act(() => fetchStakeholderGroups({}, { page: 2, perPage: 50 }));
    expect(result.current.isFetching).toBe(true);

    // Fetch finished
    await waitForNextUpdate();
    expect(result.current.isFetching).toBe(false);
    expect(result.current.stakeholderGroups).toBeUndefined();
    expect(result.current.fetchError).not.toBeUndefined();
  });

  it("Fetch success", async () => {
    // Mock REST API
    const data: StakeholderGroupPage = {
      _embedded: {
        "stakeholder-group": [],
      },
      total_count: 0,
    };

    new MockAdapter(axios)
      .onGet(`${STAKEHOLDER_GROUPS}?page=0&size=10`)
      .reply(200, data);

    // Use hook
    const { result, waitForNextUpdate } = renderHook(() =>
      useFetchStakeholderGroups()
    );

    const {
      stakeholderGroups: stakeholders,
      isFetching,
      fetchError,
      fetchStakeholderGroups: fetchStakeholders,
    } = result.current;

    expect(isFetching).toBe(false);
    expect(stakeholders).toBeUndefined();
    expect(fetchError).toBeUndefined();

    // Init fetch
    act(() => fetchStakeholders({}, { page: 1, perPage: 10 }));
    expect(result.current.isFetching).toBe(true);

    // Fetch finished
    await waitForNextUpdate();
    expect(result.current.isFetching).toBe(false);
    expect(result.current.stakeholderGroups).toMatchObject({
      data: [],
      meta: { count: 0 },
    });
    expect(result.current.fetchError).toBeUndefined();
  });

  it("Fetch all", async () => {
    // Mock REST API
    const data: StakeholderGroupPage = {
      _embedded: {
        "stakeholder-group": [],
      },
      total_count: 0,
    };

    new MockAdapter(axios)
      .onGet(`${STAKEHOLDER_GROUPS}?page=0&size=1000&sort=name`)
      .reply(200, data);

    // Use hook
    const { result, waitForNextUpdate } = renderHook(() =>
      useFetchStakeholderGroups()
    );

    const {
      stakeholderGroups,
      isFetching,
      fetchError,
      fetchAllStakeholderGroups,
    } = result.current;

    expect(isFetching).toBe(false);
    expect(stakeholderGroups).toBeUndefined();
    expect(fetchError).toBeUndefined();

    // Init fetch
    act(() => fetchAllStakeholderGroups());
    expect(result.current.isFetching).toBe(true);

    // Fetch finished
    await waitForNextUpdate();
    expect(result.current.isFetching).toBe(false);
    expect(result.current.stakeholderGroups).toMatchObject({
      data: [],
      meta: { count: 0 },
    });
    expect(result.current.fetchError).toBeUndefined();
  });
});
