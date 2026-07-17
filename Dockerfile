# NOTE: Since the `:latest` tag can have npm version changes, we are using
#       a specific version tag. Container build errors have come up locally
#       and via github action workflow when `:latest` is updated.
#
# Image info: https://catalog.redhat.com/en/software/containers/ubi10/nodejs-22/677d3d3e5fdd0fab2f7ad136
# Red Hat Container Catalog: https://catalog.redhat.com/en/search?searchType=containers
# Relevant PRs:
#   - https://github.com/konveyor/tackle2-ui/pull/1746
#   - https://github.com/konveyor/tackle2-ui/pull/1781

# Builder image
FROM registry.access.redhat.com/ubi10/nodejs-22:1783398850 AS builder

USER 1001
COPY --chown=1001 . .

RUN \
  npm version && \
  npm config ls && \
  npm clean-install --verbose --ignore-scripts --no-audit && \
  npm run build && \
  npm run dist

# Runner image
FROM registry.access.redhat.com/ubi10/nodejs-22-minimal:1783341337

# Add ps package to allow liveness probe for k8s cluster
# Add tar package to allow copying files with kubectl scp
# Setup a directory to store the CA certificates to be given to nodejs in entrypoint.sh
USER 0
RUN microdnf -y install tar procps-ng && \
    microdnf clean all && \
    mkdir -p /opt/app-root/ca-certs.d && \
    chown 1001:0 /opt/app-root/ca-certs.d && \
    chmod 775 /opt/app-root/ca-certs.d

USER 1001

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
      io.openshift.tags="operator,konveyor,ui,nodejs" \
      org.opencontainers.image.title="tackle2-ui" \
      org.opencontainers.image.description="Konveyor - User Interface" \
      org.opencontainers.image.url="https://konveyor.io" \
      org.opencontainers.image.source="https://github.com/konveyor/tackle2-ui" \
      org.opencontainers.image.documentation="https://konveyor.io/docs" \
      org.opencontainers.image.licenses="Apache-2.0" \
      org.opencontainers.image.vendor="Konveyor"

COPY --from=builder /opt/app-root/src/dist /opt/app-root/dist/

ENV DEBUG=1

WORKDIR /opt/app-root/dist
ENTRYPOINT ["./entrypoint.sh"]
