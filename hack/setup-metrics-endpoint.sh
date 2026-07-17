#!/usr/bin/env bash
#
# Create a Service + Ingress to expose the tackle-hub metrics endpoint
# on /hub-metrics (rewritten to /metrics on the backend).
#
# Writes METRICS_URL to $GITHUB_ENV when running in GitHub Actions.
#
set -euo pipefail

NAMESPACE="konveyor-tackle"

kubectl wait --for=condition=ready pod \
  -n "$NAMESPACE" \
  -l app.kubernetes.io/name=tackle-hub \
  --timeout=600s

kubectl apply -f - <<'EOF'
apiVersion: v1
kind: Service
metadata:
  name: tackle-hub-metrics
  namespace: konveyor-tackle
  labels:
    app.kubernetes.io/name: tackle-hub
    app.kubernetes.io/component: hub
    app.kubernetes.io/part-of: tackle
spec:
  selector:
    app.kubernetes.io/name: tackle-hub
    app.kubernetes.io/component: hub
    app.kubernetes.io/part-of: tackle
  ports:
    - port: 2112
      targetPort: 2112
      protocol: TCP
      name: metrics
---
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: tackle-hub-metrics
  namespace: konveyor-tackle
  labels:
    app.kubernetes.io/name: tackle-hub-metrics
    app.kubernetes.io/component: ingress
    app.kubernetes.io/part-of: tackle
    app: tackle
  annotations:
    nginx.ingress.kubernetes.io/rewrite-target: /metrics
spec:
  rules:
    - http:
        paths:
          - path: /hub-metrics
            pathType: Exact
            backend:
              service:
                name: tackle-hub-metrics
                port:
                  number: 2112
EOF

kubectl wait \
  -n "$NAMESPACE" \
  ingress/tackle-hub-metrics \
  --timeout=300s \
  --for=jsonpath='{.status.loadBalancer.ingress[0]}'

MINIKUBE_IP=$(minikube ip)
METRICS_URL="https://${MINIKUBE_IP}/hub-metrics"
echo "Metrics ingress ready at: ${METRICS_URL}"

if [[ -n "${GITHUB_ENV:-}" ]]; then
  echo "METRICS_URL=${METRICS_URL}" >>"$GITHUB_ENV"
fi
