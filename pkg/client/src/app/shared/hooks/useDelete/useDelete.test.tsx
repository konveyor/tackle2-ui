import axios from "axios";
import MockAdapter from "axios-mock-adapter";
import { renderHook, act } from "@testing-library/react-hooks";

import { Application } from "@app/api/models";
import { deleteApplication, APPLICATIONS } from "@app/api/rest";

import { useDelete } from "./useDelete";

describe("useDelete", () => {
  it("Valid initial status", () => {
    // Use hook
    const { result } = renderHook(() =>
      useDelete<Application>({
        onDelete: jest.fn(),
      })
    );

    const { isDeleting, requestDelete } = result.current;

    expect(isDeleting).toBe(false);
    expect(requestDelete).toBeDefined();
  });

  it("Delete error", async () => {
    const app: Application = {
      id: 1,
      name: "any name",
    };
    const onSuccessMock = jest.fn();
    const onErrorMock = jest.fn();

    // Mock REST API
    new MockAdapter(axios).onDelete(`${APPLICATIONS}/${app.id}`).networkError();

    // Use hook
    const onDelete = (application: Application) => {
      return deleteApplication(application.id!);
    };

    const { result, waitForNextUpdate } = renderHook(() =>
      useDelete<Application>({ onDelete })
    );
    const { requestDelete } = result.current;

    // Init delete
    act(() => requestDelete(app, onSuccessMock, onErrorMock));
    expect(result.current.isDeleting).toBe(true);

    // Delete finished
    await waitForNextUpdate();
    expect(result.current.isDeleting).toBe(false);
    expect(onSuccessMock).toHaveBeenCalledTimes(0);
    expect(onErrorMock).toHaveBeenCalledTimes(1);
  });

  it("Delete success", async () => {
    const version: Application = {
      id: 1,
      name: "any name",
    };
    const onSuccessMock = jest.fn();
    const onErrorMock = jest.fn();

    // Mock REST API
    new MockAdapter(axios).onDelete(`${APPLICATIONS}/${version.id}`).reply(201);

    // Use hook
    const onDelete = (application: Application) => {
      return deleteApplication(application.id!);
    };

    const { result, waitForNextUpdate } = renderHook(() =>
      useDelete<Application>({ onDelete })
    );
    const { requestDelete: deleteBusinessService } = result.current;

    // Init delete
    act(() => deleteBusinessService(version, onSuccessMock, onErrorMock));
    expect(result.current.isDeleting).toBe(true);

    // Delete finished
    await waitForNextUpdate();
    expect(result.current.isDeleting).toBe(false);
    expect(onSuccessMock).toHaveBeenCalledTimes(1);
    expect(onErrorMock).toHaveBeenCalledTimes(0);
  });
});
