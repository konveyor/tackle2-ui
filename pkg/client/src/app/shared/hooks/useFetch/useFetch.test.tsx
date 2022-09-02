import axios from "axios";
import MockAdapter from "axios-mock-adapter";
import { renderHook, act } from "@testing-library/react-hooks";

import { useFetch } from "./useFetch";

describe("useFetch", () => {
  it("Initial value", async () => {
    // Use hook
    const { result, waitForNextUpdate } = renderHook(() =>
      useFetch<string>({
        defaultIsFetching: true,
        onFetch: () => axios.get("/myendpoint"),
      })
    );

    const { data, isFetching, fetchError, requestFetch } = result.current;

    expect(isFetching).toBe(true);
    expect(data).toBeUndefined();
    expect(fetchError).toBeUndefined();
  });

  it("Fetch error due to no REST API found", async () => {
    // Mock REST API
    new MockAdapter(axios).onGet("/myendpoint").networkError();

    // Use hook
    const { result, waitForNextUpdate } = renderHook(() =>
      useFetch<string>({
        onFetch: () => axios.get("/myendpoint"),
      })
    );

    const { data, isFetching, fetchError, requestFetch } = result.current;

    expect(isFetching).toBe(false);
    expect(data).toBeUndefined();
    expect(fetchError).toBeUndefined();

    // Init fetch
    act(() => requestFetch());
    expect(result.current.isFetching).toBe(true);

    // Fetch finished
    await waitForNextUpdate();
    expect(result.current.isFetching).toBe(false);
    expect(result.current.data).toBeUndefined();
    expect(result.current.fetchError).not.toBeUndefined();
  });

  it("Fetch success", async () => {
    // Mock REST API
    const responseData = "Hello world!";

    new MockAdapter(axios).onGet("/myendpoint").reply(200, responseData);

    // Use hook
    const { result, waitForNextUpdate } = renderHook(() =>
      useFetch<string>({
        onFetch: () => {
          return axios.get("/myendpoint");
        },
      })
    );

    const { data, isFetching, fetchError, requestFetch } = result.current;

    expect(isFetching).toBe(false);
    expect(data).toBeUndefined();
    expect(fetchError).toBeUndefined();

    // Init fetch
    act(() => requestFetch());
    expect(result.current.isFetching).toBe(true);

    // Fetch finished
    await waitForNextUpdate();
    expect(result.current.isFetching).toBe(false);
    expect(result.current.data).toBe(responseData);
    expect(result.current.fetchError).toBeUndefined();
  });
});
