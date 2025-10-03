# NOTE: Since the `:latest` tag can have npm version changes, we are using
#       a specific version tag. Container build errors have come up locally
#       and via github action workflow when `:latest` is updated.
#
# Image info: https://catalog.redhat.com/software/containers/ubi9/nodejs-20/64770ac7a835530172eee6a9
# Red Hat Container Catalog: https://catalog.redhat.com/en/search?searchType=containers
# Relevant PRs:
#   - https://github.com/konveyor/tackle2-ui/pull/1746
#   - https://github.com/konveyor/tackle2-ui/pull/1781

# Builder image
FROM registry.access.redhat.com/ubi9/nodejs-20:9.6-1758500456 as builder

USER 1001
COPY --chown=1001 . .

RUN \
  npm version && \
  npm config ls && \
  npm clean-install --verbose --ignore-scripts --no-audit && \
  npm run build && \
  npm run dist

# Runner image
FROM registry.access.redhat.com/ubi9/nodejs-20-minimal:9.6-1759119304

# Add ps package to allow liveness probe for k8s cluster
# Add tar package to allow copying files with kubectl scp
USER 0
RUN microdnf -y install tar procps-ng && microdnf clean all

USER 1001

LABEL name="konveyor/tackle2-ui" \
      description="Konveyor for Tackle - User Interface" \
      help="For more information visit https://konveyor.io" \
      license="Apache License 2.0" \
      maintainer="gdubreui@redhat.com,ibolton@redhat.com" \
      summary="Konveyor for Tackle - User Interface" \
      url="https://quay.io/konveyor/tackle2-ui" \
      usage="podman run -p 80 -v konveyor/tackle2-ui:latest" \
      com.redhat.component="konveyor-tackle2-ui-container" \
      io.k8s.display-name="tackle2-ui" \
      io.k8s.description="Konveyor for Tackle - User Interface" \
      io.openshift.expose-services="80:http" \
      io.openshift.tags="operator,konveyor,ui,nodejs18" \
      io.openshift.min-cpu="100m" \
      io.openshift.min-memory="350Mi"

COPY --from=builder /opt/app-root/src/dist /opt/app-root/dist/

ENV DEBUG=1

WORKDIR /opt/app-root/dist
ENTRYPOINT ["./entrypoint.sh"]
