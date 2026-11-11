import {
  CLIENT_ENV_DEFAULTS,
  buildClientEnv,
  serializeClientEnv,
} from "./types";

describe("client environment configuration", () => {
  it("uses the same defaults for unset and empty values", () => {
    expect(buildClientEnv({ VERSION: "", AUTH_REQUIRED: "" })).toEqual(
      CLIENT_ENV_DEFAULTS
    );
  });

  it("preserves string overrides without exposing server-only configuration", () => {
    const input = {
      NODE_ENV: "development",
      AUTH_REQUIRED: "true",
      RWX_SUPPORTED: "false",
      MOCK: "on",
      DEVTOOLS: "on",
      OIDC_CLIENT_ID: "custom-client",
      TACKLE_HUB_URL: "http://private-hub:8080",
      PRIVATE_TOKEN: "secret",
    };
    expect(buildClientEnv(input)).toEqual({
      ...CLIENT_ENV_DEFAULTS,
      NODE_ENV: "development",
      AUTH_REQUIRED: "true",
      RWX_SUPPORTED: "false",
      MOCK: "on",
      DEVTOOLS: "on",
      OIDC_CLIENT_ID: "custom-client",
    });
  });

  it.each([
    "quotes: \" and ' and \\",
    "` ${window.alert('injected')}",
    "</script><script>window.alert('injected')</script>",
    "newlines:\n\r\t\u2028\u2029",
    '{{env "PRIVATE_TOKEN"}}',
    "replacement tokens: $& $` $' $$",
  ])(
    "round-trips an inline value without breaking out of its script: %s",
    (value) => {
      const config = buildClientEnv({ OIDC_CLIENT_ID: value });
      const serialized = serializeClientEnv(config);
      const container = document.createElement("div");
      container.innerHTML = `<script>window._env = ${serialized};</script>`;

      expect(JSON.parse(serialized)).toEqual(config);
      expect(container.children).toHaveLength(1);
      expect(container.firstElementChild?.textContent).toBe(
        `window._env = ${serialized};`
      );
      expect(serialized).not.toMatch(/[<>&\u2028\u2029]/);
    }
  );
});
