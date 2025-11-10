FROM registry.redhat.io/ubi9/nodejs-20:latest AS builder
COPY --chown=1001:0 . /workspace
WORKDIR /workspace

# Setup downstream branding (before https://github.com/konveyor/tackle2-ui/pull/1664)
ENV PROFILE=mta
ENV BRAND_TYPE=RedHat

# Setup the build to use downstream branding (after https://github.com/konveyor/tackle2-ui/pull/1664)
ENV BRANDING=hack/build/branding-mta

# Allow use of npm10 (see https://github.com/konveyor/tackle2-ui/pull/1781)
RUN sed -i 's/^    "npm": "^9.5.0"/    "npm": ">=9.5.0"/' package.json

# npm config fix is needed for npm9/nodejs18 auth issues during build
RUN npm config fix
RUN npm clean-install --ignore-scripts --no-audit --verbose && npm run build && npm run dist

FROM registry.redhat.io/ubi9/nodejs-20:latest
USER root
RUN dnf -y install procps-ng && dnf -y clean all
USER 1001

COPY --from=builder /workspace/dist /opt/app-root/dist/
COPY --from=builder /workspace/LICENSE /licenses/

WORKDIR /opt/app-root/dist
ENTRYPOINT ["./entrypoint.sh"]

LABEL \
        description="Migration Toolkit for Applications - UI" \
        io.k8s.description="Migration Toolkit for Applications - UI" \
        io.k8s.display-name="MTA - UI" \
        io.openshift.maintainer.project="MTA" \
        io.openshift.tags="migration,modernization,mta,tackle,konveyor" \
        summary="Migration Toolkit for Applications - UI"
