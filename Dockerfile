# Builder image
FROM registry.access.redhat.com/ubi8/nodejs-16 as builder
COPY pkg/client/dist/ ./client/dist/
COPY pkg/server ./server/
COPY entrypoint.sh .
RUN cd ./server && npm install

# Runner image
FROM registry.access.redhat.com/ubi8/nodejs-16-minimal

# Add ps package to allow liveness probe for k8s cluster
# Add tar package to allow copying files with kubectl scp
USER 0
RUN microdnf -y install tar procps-ng && microdnf clean all

USER 1001

LABEL name="konveyor/tackle-ui" \
      description="Konveyor for Tackle - User Interface" \
      help="For more information visit https://konveyor.io" \
      license="Apache License 2.0" \
      maintainer="gdubreui@redhat.com,ibolton@redhat.com" \
      summary="Konveyor for Tackle - User Interface" \
      url="https://quay.io/gildub/tackle2-ui" \
      usage="podman run -p 80 -v konveyor/tackle2-ui:latest" \
      com.redhat.component="konveyor-tackle2-ui-container" \
      io.k8s.display-name="tackle2-ui" \
      io.k8s.description="Konveyor for Tackle - User Interface" \
      io.openshift.expose-services="80:http" \
      io.openshift.tags="operator,konveyor,ui,nodejs16" \
      io.openshift.min-cpu="100m" \
      io.openshift.min-memory="350Mi"

COPY --from=builder /opt/app-root/src /opt/app-root/src
COPY --from=builder /opt/app-root/src/entrypoint.sh /usr/bin/entrypoint.sh

ENV DEBUG=1

ENTRYPOINT ["/usr/bin/entrypoint.sh"]
