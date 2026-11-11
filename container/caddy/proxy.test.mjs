import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { once } from "node:events";
import { chmod, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import path from "node:path";
import { after, before, test } from "node:test";
import { fileURLToPath } from "node:url";
import { runInNewContext } from "node:vm";

// Runs the real production routes/templates, without a Hub or a client build.
// Requires Linux host networking and Podman (or CONTAINER_ENGINE=docker).
const engine = process.env.CONTAINER_ENGINE || "podman";
const root = fileURLToPath(new URL("../../", import.meta.url));
const name = `tackle-ui-regression-${randomUUID()}`;
const payload =
  '" \\ ` ${window.injected=true} </script><script>window.injected=true</script>\n{{env "PRIVATE_TOKEN"}} $& $` $\' \u2028\u2029';
let directory;
let base;
let container;
let logs = "";
const upstream = createServer((request, response) => {
  response.setHeader("Content-Type", "application/json");
  if (request.url.includes("/unauthorized")) {
    response.writeHead(401).end('{"error":"expired"}');
  } else {
    response.end(
      JSON.stringify({ uri: request.url, headers: request.headers })
    );
  }
});

before(
  async () => {
    directory = await mkdtemp(path.join(tmpdir(), "tackle-ui-caddy-"));
    await chmod(directory, 0o755);
    await writeFile(
      path.join(directory, "index.html"),
      await readFile(path.join(root, "client/public/index.html.caddy.tmpl"))
    );
    upstream.listen(0, "127.0.0.1");
    await once(upstream, "listening");
    const target = `http://127.0.0.1:${upstream.address().port}`;
    const reservation = createServer();
    reservation.listen(0, "127.0.0.1");
    await once(reservation, "listening");
    const port = reservation.address().port;
    await new Promise((resolve) => reservation.close(resolve));
    base = `http://127.0.0.1:${port}`;
    const dockerfile = await readFile(path.join(root, "Dockerfile"), "utf8");
    const image = [...dockerfile.matchAll(/^FROM\s+(\S+)/gm)].at(-1)[1];
    container = spawn(engine, [
      "run",
      "--rm",
      "--name",
      name,
      "--network=host",
      "-v",
      `${path.join(root, "container/caddy")}:/etc/caddy:ro,z`,
      "-v",
      `${directory}:/srv:ro,z`,
      "-e",
      `PORT=${port}`,
      "-e",
      `TACKLE_HUB_URL=${target}`,
      "-e",
      `KAI_LLM_PROXY_URL=${target}`,
      "-e",
      `KEYCLOAK_SERVER_URL=${target}`,
      "-e",
      `OIDC_CLIENT_ID=${payload}`,
      "-e",
      "PRIVATE_TOKEN=must-not-be-exposed",
      image,
      "caddy",
      "run",
      "--config",
      "/etc/caddy/Caddyfile.prod",
    ]);
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(
        () => reject(new Error(logs || "Caddy startup timed out")),
        90_000
      );
      const failed = (error) => {
        clearTimeout(timeout);
        reject(error);
      };
      container.once("error", failed);
      container.once("exit", (code) =>
        failed(new Error(`Caddy exited ${code}: ${logs}`))
      );
      for (const stream of [container.stdout, container.stderr]) {
        stream.on("data", (data) => {
          logs += data.toString();
          if (logs.includes("serving initial configuration")) {
            clearTimeout(timeout);
            resolve();
          }
        });
      }
    });
  },
  { timeout: 120_000 }
);

after(async () => {
  if (container) {
    spawnSync(engine, ["stop", "--time", "1", name], { timeout: 15_000 });
    container.kill();
  }
  upstream.closeAllConnections();
  await new Promise((resolve) => upstream.close(resolve));
  if (directory) await rm(directory, { recursive: true, force: true });
});

test("API roots and escaped paths preserve URI/query semantics", async () => {
  for (const [input, expected] of [
    ["/hub", "/"],
    ["/hub/a%2Fb//c?name=a%20b&n=1", "/a%2Fb//c?name=a%20b&n=1"],
    ["/kai?x=1", "/services/kai?x=1"],
    ["/kai/a%2Fb?q=1", "/services/kai/a%2Fb?q=1"],
    ["/llm-proxy", "/"],
    ["/llm-proxy/a%2Fb?q=1", "/a%2Fb?q=1"],
    ["/oidc", "/oidc"],
    ["/auth/realm", "/auth/realm"],
  ]) {
    const response = await fetch(base + input, {
      headers: { Accept: "application/json" },
    });
    assert.equal(response.status, 200, input);
    assert.equal((await response.json()).uri, expected, input);
  }
});

test("only browser 401s redirect; JSON API 401s remain available for token refresh", async () => {
  for (const prefix of ["/hub", "/kai"]) {
    const api = await fetch(`${base}${prefix}/unauthorized`, {
      headers: { Accept: "application/json" },
      redirect: "manual",
    });
    assert.equal(api.status, 401);
    assert.deepEqual(await api.json(), { error: "expired" });
    const browser = await fetch(`${base}${prefix}/unauthorized`, {
      headers: { Accept: "text/html" },
      redirect: "manual",
    });
    assert.equal(browser.status, 302);
    assert.equal(browser.headers.get("location"), "/");
  }
});

test("OIDC receives ingress context, including quoted IPv6, without duplicating Forwarded", async () => {
  const response = await fetch(`${base}/oidc/headers`, {
    headers: {
      "X-Forwarded-For": "2001:db8::1, 10.0.0.1",
      "X-Forwarded-Host": "ui.example:8443",
      "X-Forwarded-Proto": "https",
    },
  });
  const { headers } = await response.json();
  assert.equal(
    headers.forwarded,
    'for="[2001:db8::1]";host="ui.example:8443";proto=https'
  );
  const preserved = await fetch(`${base}/hub/headers`, {
    headers: { Forwarded: headers.forwarded },
  });
  assert.equal((await preserved.json()).headers.forwarded, headers.forwarded);
});

test("runtime JSON cannot execute JavaScript or a second Caddy template, even with cache/range headers", async () => {
  const response = await fetch(`${base}/.env`, {
    headers: { Range: "bytes=0-1" },
  });
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("cache-control"), "no-store");
  const config = await response.json();
  assert.equal(config.OIDC_CLIENT_ID, payload);
  assert.equal(config.PRIVATE_TOKEN, undefined);
  for (const route of ["/", "/applications/123", "/hubris"]) {
    const html = await fetch(base + route, {
      headers: {
        "If-None-Match": "*",
        "If-Modified-Since": "Tue, 01 Jan 2030 00:00:00 GMT",
        Range: "bytes=0-1",
        "Accept-Encoding": "gzip, br",
      },
    });
    assert.equal(html.status, 200, route);
    assert.equal(html.headers.get("cache-control"), "no-store");
    const text = await html.text();
    const script = text.match(/window\._env\s*=([\s\S]*?);\s*<\/script>/);
    assert.ok(script, "runtime config must remain inside a single script");
    const context = { window: {} };
    runInNewContext(`window._env = ${script[1]}`, context, { timeout: 1000 });
    assert.deepEqual(JSON.parse(JSON.stringify(context.window._env)), config);
    assert.equal(context.window.injected, undefined);
    assert.ok(!text.includes("must-not-be-exposed"));
  }
});
