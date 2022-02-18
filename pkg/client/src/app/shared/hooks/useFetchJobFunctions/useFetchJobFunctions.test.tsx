import axios from "axios";
import MockAdapter from "axios-mock-adapter";
import { renderHook, act } from "@testing-library/react-hooks";
import { useFetchJobFunctions } from "./useFetchJobFunctions";
import { JobFunctionPage } from "@app/api/models";
import { JOB_FUNCTIONS } from "@app/api/rest";

describe("useFetchJobFunctions", () => {
  it("Fetch all", async () => {
    // Mock REST API
    const data: JobFunctionPage = {
      _embedded: {
        "job-function": [],
      },
      total_count: 0,
    };

    new MockAdapter(axios)
      .onGet(`${JOB_FUNCTIONS}?page=0&size=1000&sort=role`)
      .reply(200, data);

    // Use hook
    const { result, waitForNextUpdate } = renderHook(() =>
      useFetchJobFunctions()
    );

    const {
      jobFunctions: items,
      isFetching,
      fetchError,
      fetchAllJobFunctions: fetchAll,
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
    expect(result.current.jobFunctions).toMatchObject({
      data: [],
      meta: { count: 0 },
    });
    expect(result.current.fetchError).toBeUndefined();
  });
});
