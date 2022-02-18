import React from "react";
import { Router } from "react-router-dom";

import { createMemoryHistory } from "history";
import { renderHook } from "@testing-library/react-hooks";
import { useDecodedLocation } from "./useDecodedLocation";

describe("useDecodedLocation", () => {
  it("Decodes 'search' and converts queryParams to Object", () => {
    // Router
    const history = createMemoryHistory({
      initialEntries: [
        "/myurl?name=my%20application1&name=my%20application2&description=my%20description",
      ],
    });

    // Hook
    const { result } = renderHook(() => useDecodedLocation(), {
      wrapper: ({ children }) => <Router history={history}>{children}</Router>,
    });

    expect(result.current).toMatchObject({
      pathname: "/myurl",
      search: {
        name: ["my application1", "my application2"],
        description: ["my description"],
      },
    });
  });
});
