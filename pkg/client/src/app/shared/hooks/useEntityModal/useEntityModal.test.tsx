import { renderHook, act } from "@testing-library/react-hooks";
import { useEntityModal } from "./useEntityModal";

describe("useEntityModal", () => {
  it("onCreate", () => {
    const { result } = renderHook(() => useEntityModal());

    //
    const { create } = result.current;
    act(() => create());
    expect(result.current.isOpen).toEqual(true);
    expect(result.current.data).toBeUndefined();
  });

  it("onUpdate", () => {
    const ENTITY = "hello";

    const { result } = renderHook(() => useEntityModal<string>());

    //
    const { update } = result.current;
    act(() => update(ENTITY));

    expect(result.current.isOpen).toEqual(true);
    expect(result.current.data).toEqual(ENTITY);
  });

  it("Close after update", () => {
    const ENTITY = "hello";

    const { result } = renderHook(() => useEntityModal<string>());
    const { update, close } = result.current;

    // update
    act(() => update(ENTITY));

    expect(result.current.isOpen).toEqual(true);
    expect(result.current.data).toEqual(ENTITY);

    // close
    act(() => close());

    expect(result.current.isOpen).toEqual(false);
    expect(result.current.data).toBeUndefined();
  });
});
