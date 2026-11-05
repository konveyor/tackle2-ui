import { QueryClient } from "@tanstack/react-query";
import { rest } from "msw";

import { renderHook, waitFor } from "@app/test-config/test-utils";
import { server } from "@mocks/server";

import { useFetchQuestionnaireById } from "./questionnaires";

describe("Questionnaire detail query", () => {
  it("waits for an ID and stops fetching when it is removed", async () => {
    const request = jest.fn();
    server.use(
      rest.get("/hub/questionnaires/:id", (req, res, ctx) => {
        request(req.params.id);
        return res(ctx.json({ id: 42, name: "Assessment" }));
      })
    );
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const initialProps: { id: number | string | undefined } = { id: undefined };
    const { result, rerender } = renderHook(
      ({ id }: { id: number | string | undefined }) =>
        useFetchQuestionnaireById(id),
      { initialProps, queryClient }
    );

    expect(queryClient.isFetching()).toBe(0);
    expect(result.current.isFetching).toBe(false);
    expect(result.current.questionnaire).toBeUndefined();
    expect(request).not.toHaveBeenCalled();

    rerender({ id: "42" });
    expect(result.current.isFetching).toBe(true);
    await waitFor(() =>
      expect(result.current.questionnaire?.name).toBe("Assessment")
    );
    expect(result.current.isFetching).toBe(false);
    expect(request).toHaveBeenCalledWith("42");
    const requestCount = request.mock.calls.length;

    rerender({ id: undefined });
    await queryClient.invalidateQueries({ queryKey: ["questionnaireById"] });
    expect(queryClient.isFetching()).toBe(0);
    expect(result.current.isFetching).toBe(false);
    expect(result.current.questionnaire).toBeUndefined();
    expect(request).toHaveBeenCalledTimes(requestCount);
    queryClient.clear();
  });
});
