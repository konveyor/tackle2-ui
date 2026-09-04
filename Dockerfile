# NOTE: Since the `:latest` tag can have npm version changes, we are using
#       a specific version tag. Container build errors have come up locally
#       and via github action workflow when `:latest` is updated.
#
# Image info: https://catalog.redhat.com/en/software/containers/ubi10/nodejs-22/677d3d3e5fdd0fab2f7ad136
# Red Hat Container Catalog: https://catalog.redhat.com/en/search?searchType=containers
# Red Hat Hardened Images:   https://images.redhat.com
# Relevant PRs:
#   - https://github.com/konveyor/tackle2-ui/pull/1746
#   - https://github.com/konveyor/tackle2-ui/pull/1781

# Builder image
# ── Stage 1: Build the React client ──────────────────────────────────────────
FROM registry.access.redhat.com/ubi10/nodejs-22:1788329773 AS client-builder

USER 1001
COPY --chown=1001 . .

RUN \
  npm version && \
  npm config ls && \
  npm clean-install --verbose --ignore-scripts --no-audit && \
  npm run build && \
  npm run dist

# ── Stage 2: Compile the Go entrypoint binary ─────────────────────────────────
# Uses the Red Hat Hardened Images Go builder which includes the Go toolchain.
FROM registry.access.redhat.com/hi/go:latest-builder AS entrypoint-builder

COPY container/entrypoint/ /src/
WORKDIR /src
# CGO_ENABLED=0 produces a fully-static binary that runs in the distroless
# hi/caddy runtime image without any shared-library dependencies.
RUN CGO_ENABLED=0 go build -ldflags="-s -w" -o /entrypoint .

# ── Stage 3: Distroless Caddy runtime ────────────────────────────────────────
# hi/caddy:2.11 is a Red Hat Hardened Image — minimal, no shell, no package
# manager, near-zero CVE state.  See https://images.redhat.com for details.
FROM registry.access.redhat.com/hi/caddy:2.11

COPY --from=client-builder     /opt/app-root/src/dist /srv
COPY --from=entrypoint-builder /entrypoint            /usr/local/bin/entrypoint
COPY container/caddy/Caddyfile.prod                   /etc/caddy/Caddyfile
COPY container/caddy/proxy-routes.caddy               /etc/caddy/proxy-routes.caddy
COPY container/caddy/env.json.tmpl                    /etc/caddy/env.json.tmpl

LABEL name="konveyor/tackle2-ui" \
      description="Konveyor - User Interface" \
      summary="Konveyor UI provides the web-based frontend for managing application modernization workflows" \
      url="https://quay.io/konveyor/tackle2-ui" \
      help="For more information visit https://konveyor.io" \
      license="Apache-2.0" \
      maintainer="sdickers@redhat.com,rszwajko@redhat.com,ibolton@redhat.com" \
      usage="podman run -p 8080:8080 konveyor/tackle2-ui:latest" \
      com.redhat.component="konveyor-tackle2-ui-container" \
      io.k8s.display-name="tackle2-ui" \
      io.k8s.description="Konveyor - User Interface" \
      io.openshift.tags="operator,konveyor,ui,caddy" \
      org.opencontainers.image.title="tackle2-ui" \
      org.opencontainers.image.description="Konveyor - User Interface" \
      org.opencontainers.image.url="https://konveyor.io" \
      org.opencontainers.image.source="https://github.com/konveyor/tackle2-ui" \
      org.opencontainers.image.documentation="https://konveyor.io/docs" \
      org.opencontainers.image.licenses="Apache-2.0" \
      org.opencontainers.image.vendor="Konveyor"

ENTRYPOINT ["/usr/local/bin/entrypoint"]
