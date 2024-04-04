#!/bin/bash
#
# Based on:
#   - https://github.com/konveyor/operator/blob/main/hack/install-konveyor.sh
#   - https://github.com/konveyor/operator/blob/main/hack/install-tackle.sh
#   - https://konveyor.github.io/konveyor/installation/#installing-konveyor-operator
#
# By default, no authentication, and only use pre-built images
#
set -e
set -oq pipefail

# use kubectl if available, else fall back to `minikube kubectl --`, else error
KUBECTL=kubectl
if ! command -v $KUBECTL >/dev/null 2>&1; then
  KUBECTL="minikube kubectl --"
  # kubectl_bin="${__bin_dir}/kubectl"
  # mkdir -p "${__bin_dir}"
  # curl -Lo "${kubectl_bin}" "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/${__os}/${__arch}/kubectl"
  # chmod +x "${kubectl_bin}"
fi
echo "kubectl command: ${KUBECTL}"

debug() {
  echo "Install Konveyor FAILED!!!"
  echo "What follows is some info that may be useful in debugging the failure"

  $KUBECTL get namespace "${NAMESPACE}" -o yaml || true
  $KUBECTL get --namespace "${NAMESPACE}" all || true
  $KUBECTL get --namespace "${NAMESPACE}" -o yaml \
    subscriptions.operators.coreos.com,catalogsources.operators.coreos.com,installplans.operators.coreos.com,clusterserviceversions.operators.coreos.com \
    || true
  $KUBECTL get --namespace "${NAMESPACE}" -o yaml tackles.tackle.konveyor.io/tackle || true

  for pod in $($KUBECTL get pods -n "${NAMESPACE}" -o jsonpath='{.items[*].metadata.name}'); do
    $KUBECTL --namespace "${NAMESPACE}" describe pod "${pod}" || true
  done
  exit 1
}
trap 'debug' ERR

# Inputs for setting up the operator
NAMESPACE="${NAMESPACE:-konveyor-tackle}"
OPERATOR_INDEX_IMAGE="${OPERATOR_INDEX_IMAGE:-quay.io/konveyor/tackle2-operator-index:latest}"

# Either pass in the full Tackle CR, or specify individual bits
TACKLE_CR="${TACKLE_CR:-}"

FEATURE_AUTH_REQUIRED="${FEATURE_AUTH_REQUIRED:-false}"
HUB_IMAGE="${HUB_IMAGE:-quay.io/konveyor/tackle2-hub:latest}"
UI_IMAGE="${UI_IMAGE:-quay.io/konveyor/tackle2-ui:latest}"
UI_INGRESS_CLASS_NAME="${UI_INGRESS_CLASS_NAME:-nginx}"
ADDON_ANALYZER_IMAGE="${ADDON_ANALYZER_IMAGE:-quay.io/konveyor/tackle2-addon-analyzer:latest}"
IMAGE_PULL_POLICY="${IMAGE_PULL_POLICY:-Always}"
ANALYZER_CONTAINER_REQUESTS_MEMORY="${ANALYZER_CONTAINER_REQUESTS_MEMORY:-0}"
ANALYZER_CONTAINER_REQUESTS_CPU="${ANALYZER_CONTAINER_REQUESTS_CPU:-0}"

install_operator() {
  # Create the Konveyor Namespace
  $KUBECTL auth can-i create namespace --all-namespaces
  $KUBECTL create namespace ${NAMESPACE} || true

  # Install the Konveyor CatalogSource, OperatorGroup, and Subscription
  cat <<EOF | $KUBECTL apply -f -
---
apiVersion: operators.coreos.com/v1alpha1
kind: CatalogSource
metadata:
  name: konveyor
  namespace: ${NAMESPACE}
spec:
  displayName: Konveyor Operator
  publisher: Konveyor
  sourceType: grpc
  image: ${OPERATOR_INDEX_IMAGE}
---
apiVersion: operators.coreos.com/v1
kind: OperatorGroup
metadata:
  name: konveyor
  namespace: ${NAMESPACE}
spec:
  targetNamespaces:
    - ${NAMESPACE}
---
apiVersion: operators.coreos.com/v1alpha1
kind: Subscription
metadata:
  name: konveyor-operator
  namespace: ${NAMESPACE}
spec:
  channel: development
  installPlanApproval: Automatic
  name: konveyor-operator
  source: konveyor
  sourceNamespace: ${NAMESPACE}
EOF

  # If on MacOS, need to install `brew install coreutils` to get `timeout`
  timeout 600s bash -c "until $KUBECTL get customresourcedefinitions.apiextensions.k8s.io tackles.tackle.konveyor.io; do sleep 30; done" \
  || $KUBECTL get subscription --namespace ${NAMESPACE} -o yaml konveyor-operator # Print subscription details when timed out

  # $KUBECTL wait \
  #   --namespace ${NAMESPACE} \
  #   --for=condition=established \
  #   customresourcedefinitions.apiextensions.k8s.io/tackles.tackle.konveyor.io
}

install_tackle() {
  echo "Waiting for the Tackle CRD to become available"
  $KUBECTL wait \
    --namespace "${NAMESPACE}" \
    --for=condition=established \
    customresourcedefinitions.apiextensions.k8s.io/tackles.tackle.konveyor.io

  echo "Waiting for the Tackle Operator to exist"
  timeout 2m bash -c "until $KUBECTL --namespace ${NAMESPACE} get deployment/tackle-operator; do sleep 10; done"

  echo "Waiting for the Tackle Operator to become available"
  $KUBECTL rollout status --namespace "${NAMESPACE}" -w deployment/tackle-operator --timeout=600s

  if [ -n "${TACKLE_CR}" ]; then
    echo "${TACKLE_CR}" | $KUBECTL apply --namespace "${NAMESPACE}" -f -
  else
    cat <<EOF | $KUBECTL apply --namespace "${NAMESPACE}" -f -
kind: Tackle
apiVersion: tackle.konveyor.io/v1alpha1
metadata:
  name: tackle
spec:
  feature_auth_required: ${FEATURE_AUTH_REQUIRED}
  hub_image_fqin: ${HUB_IMAGE}
  ui_image_fqin: ${UI_IMAGE}
  ui_ingress_class_name: ${UI_INGRESS_CLASS_NAME}
  analyzer_fqin: ${ADDON_ANALYZER_IMAGE}
  image_pull_policy: ${IMAGE_PULL_POLICY}
  analyzer_container_requests_memory: ${ANALYZER_CONTAINER_REQUESTS_MEMORY}
  analyzer_container_requests_cpu: ${ANALYZER_CONTAINER_REQUESTS_CPU}
EOF
  fi

  # Want to see in github logs what we just created
  $KUBECTL get --namespace "${NAMESPACE}" -o yaml tackles.tackle.konveyor.io/tackle

  # Wait for reconcile to finish
  $KUBECTL wait \
    --namespace "${NAMESPACE}" \
    --for=condition=Successful \
    --timeout=600s \
    tackles.tackle.konveyor.io/tackle

  # Now wait for all the tackle deployments
  $KUBECTL wait \
    --namespace "${NAMESPACE}" \
    --selector="app.kubernetes.io/part-of=tackle" \
    --for=condition=Available \
    --timeout=600s \
    deployments.apps
}

$KUBECTL get customresourcedefinitions.apiextensions.k8s.io tackles.tackle.konveyor.io || install_operator
install_tackle
