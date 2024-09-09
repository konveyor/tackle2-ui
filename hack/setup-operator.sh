#!/bin/bash
#
# Based on:
#   - https://github.com/konveyor/operator/blob/main/hack/install-konveyor.sh **latest
#   - https://github.com/konveyor/operator/blob/main/hack/install-tackle.sh
#   - https://konveyor.github.io/konveyor/installation/#installing-konveyor-operator
#   - https://github.com/konveyor/operator/blob/main/tackle-k8s.yaml
#
# By default, no authentication, and only use pre-built images
#
set -eo pipefail
# set -euxo pipefail

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

function retry_command() {
  local retries=$1
  local sleeptime=$2
  local cmd=${@:3}

  until [[ $retries -eq 0 ]] || ${cmd} &>/dev/null; do
    echo "command failed, try again in ${sleeptime}s [retries: $retries]"
    sleep $sleeptime
    ((retries--))
  done
  [[ $retries == 0 ]] && return 1 || return 0
}

# Inputs for setting up the operator
NAMESPACE="${NAMESPACE:-konveyor-tackle}"
OPERATOR_INDEX_IMAGE="${OPERATOR_INDEX_IMAGE:-quay.io/konveyor/tackle2-operator-index:latest}"

# Either pass in the full Tackle CR, or specify individual bits
TACKLE_CR="${TACKLE_CR:-}"

FEATURE_AUTH_REQUIRED="${FEATURE_AUTH_REQUIRED:-false}"
IMAGE_PULL_POLICY="${IMAGE_PULL_POLICY:-Always}"
UI_INGRESS_CLASS_NAME="${UI_INGRESS_CLASS_NAME:-nginx}"
UI_IMAGE="${UI_IMAGE:-quay.io/konveyor/tackle2-ui:latest}"
HUB_IMAGE="${HUB_IMAGE:-quay.io/konveyor/tackle2-hub:latest}"
HUB_BUCKET_VOLUME_SIZE="${HUB_BUCKET_VOLUME_SIZE:-100Gi}"
HUB_DATABASE_VOLUME_SIZE="${HUB_DATABASE_VOLUME_SIZE:-10Gi}"
ADDON_ANALYZER_IMAGE="${ADDON_ANALYZER_IMAGE:-quay.io/konveyor/tackle2-addon-analyzer:latest}"
ANALYZER_CONTAINER_REQUESTS_MEMORY="${ANALYZER_CONTAINER_REQUESTS_MEMORY:-0}"
ANALYZER_CONTAINER_REQUESTS_CPU="${ANALYZER_CONTAINER_REQUESTS_CPU:-0}"

install_operator() {
  echo "Installing the Konveyor Operator..."

  # Install the Konveyor Namespace, CatalogSource, OperatorGroup, and Subscription
  cat <<EOF | $KUBECTL apply -f -
---
apiVersion: v1
kind: Namespace
metadata:
  name: ${NAMESPACE}
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

  echo "Waiting for the Tackle CRD to exist"
  retry_command 10 10 \
    $KUBECTL get customresourcedefinitions.apiextensions.k8s.io tackles.tackle.konveyor.io

  if [[ $? -ne 0 ]]; then
    echo "Tackle CRD doesn't exist yet, cannot continue"
    exit 1
  fi

  echo "Waiting for the Tackle CRD to become established"
  $KUBECTL wait \
    --namespace ${NAMESPACE} \
    --timeout=120s \
    --for=condition=Established \
    customresourcedefinitions.apiextensions.k8s.io tackles.tackle.konveyor.io

  echo "Waiting for the Tackle Operator to become available"
  $KUBECTL rollout status \
    --namespace "${NAMESPACE}" \
    --timeout=600s \
    -w deployment/tackle-operator
}

install_konveyor() {
  echo "Installing the Konveyor CR..."

  echo "Make sure the Tackle Operator is available"
  $KUBECTL rollout status \
    --namespace "${NAMESPACE}" \
    --timeout=600s \
    -w deployment/tackle-operator

  echo "Create a Tackle CR"
  if [ -n "${TACKLE_CR}" ]; then
    echo "${TACKLE_CR}" | $KUBECTL apply --namespace "${NAMESPACE}" -f -
  else
    cat <<EOF | $KUBECTL apply --namespace "${NAMESPACE}" -f -
kind: Tackle
apiVersion: tackle.konveyor.io/v1alpha1
metadata:
  name: tackle
spec:
  image_pull_policy: ${IMAGE_PULL_POLICY}
  feature_auth_required: ${FEATURE_AUTH_REQUIRED}
  ui_ingress_class_name: ${UI_INGRESS_CLASS_NAME}
  ui_image_fqin: ${UI_IMAGE}
  hub_image_fqin: ${HUB_IMAGE}
  hub_bucket_volume_size: ${HUB_BUCKET_VOLUME_SIZE}
  hub_database_volume_size: ${HUB_DATABASE_VOLUME_SIZE}
  analyzer_fqin: ${ADDON_ANALYZER_IMAGE}
  analyzer_container_requests_memory: ${ANALYZER_CONTAINER_REQUESTS_MEMORY}
  analyzer_container_requests_cpu: ${ANALYZER_CONTAINER_REQUESTS_CPU}
EOF
  fi

  # Log Want to see in github logs what we just created
  echo "Created CR:"
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

$KUBECTL get customresourcedefinitions.apiextensions.k8s.io tackles.tackle.konveyor.io &>/dev/null || install_operator
install_konveyor
