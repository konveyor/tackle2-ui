import axios from "axios";
import { renderHook, act } from "@testing-library/react-hooks";
import MockAdapter from "axios-mock-adapter";

import { useFetchPagination } from "./useFetchPagination";

interface ResponseData {
  data: number[];
}

describe("useFetchPagination", () => {
  it("Fetch 3 pages with success", async () => {
    // Mock REST API
    const responseData: ResponseData = { data: [1, 2, 3, 4, 5] };
    new MockAdapter(axios).onGet("/myendpoint").reply(200, responseData);

    // Config hook
    const { result, waitForNextUpdate } = renderHook(() =>
      useFetchPagination<ResponseData, number>({
        requestFetch: () => {
          return axios.get("/myendpoint");
        },
        continueIf: (
          currentResponseData: ResponseData,
          currentPage: number,
          currentPageSize: number
        ) => {
          return currentPage < 3;
        },
        toArray: (currentResponseData: ResponseData) => {
          return currentResponseData.data;
        },
      })
    );

    const { data, isFetching, fetchError, requestFetch } = result.current;

    expect(isFetching).toBe(false);
    expect(data).toBeUndefined();
    expect(fetchError).toBeUndefined();

    // Init fetch
    act(() => requestFetch(1, 5));
    expect(result.current.isFetching).toBe(true);

    // Fetch finished
    await waitForNextUpdate();

    expect(result.current.data?.length).toBe(15);
    expect(result.current.data).toMatchObject([
      ...responseData.data,
      ...responseData.data,
      ...responseData.data,
    ]);
  });

  it("Fetch error due to no REST API found", async () => {
    // Mock REST API
    new MockAdapter(axios).onGet("/myendpoint").networkError();

    // Use hook
    const { result, waitForNextUpdate } = renderHook(() =>
      useFetchPagination<ResponseData, number>({
        requestFetch: () => {
          return axios.get("/myendpoint");
        },
        continueIf: (
          currentResponseData: ResponseData,
          currentPage: number,
          currentPageSize: number
        ) => {
          return currentPage < 3;
        },
        toArray: (currentResponseData: ResponseData) => {
          return currentResponseData.data;
        },
      })
    );

    const { data, isFetching, fetchError, requestFetch } = result.current;

    expect(isFetching).toBe(false);
    expect(data).toBeUndefined();
    expect(fetchError).toBeUndefined();

    // Init fetch
    act(() => requestFetch(1, 5));
    expect(result.current.isFetching).toBe(true);

    // Fetch finished
    await waitForNextUpdate();
    expect(result.current.isFetching).toBe(false);
    expect(result.current.data).toBeUndefined();
    expect(result.current.fetchError).not.toBeUndefined();
  });

  it("Initial value", async () => {
    // Use hook
    const { result } = renderHook(() =>
      useFetchPagination<ResponseData, number>({
        defaultIsFetching: true,
        requestFetch: () => {
          return axios.get("/myendpoint");
        },
        continueIf: (
          currentResponseData: ResponseData,
          currentPage: number,
          currentPageSize: number
        ) => {
          return currentPage < 3;
        },
        toArray: (currentResponseData: ResponseData) => {
          return currentResponseData.data;
        },
      })
    );

    const { data, isFetching, fetchError } = result.current;

    expect(isFetching).toBe(true);
    expect(data).toBeUndefined();
    expect(fetchError).toBeUndefined();
  });
});
