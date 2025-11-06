#!/bin/bash
#
# This script inspects running container images in the 'konveyor-tackle' namespace.
# It verifies if the running image's digest matches the remote repository's tag
# and displays the labels of the running image.
#
# Prerequisites: kubectl, jq, skopeo
set -eo pipefail

# Check for required tools
for tool in jq skopeo; do
  if ! command -v "$tool" >/dev/null 2>&1; then
    echo "Error: $tool is required but not found"
    exit 1
  fi
done

CMD="minikube kubectl --"
if ! command -v $CMD >/dev/null 2>&1; then
  CMD=kubectl
fi
if ! command -v $CMD >/dev/null 2>&1; then
  echo "Error: $CMD not found"
  exit 1
fi

# Set default namespace and label
NAMESPACE="${NAMESPACE:-konveyor-tackle}"
POD_LABEL="${POD_LABEL:-app=tackle}"

echo "🤔 Using \"$CMD\" to get pod information"
echo "🤔 Inspecting pods in the '$NAMESPACE' namespace with label '$POD_LABEL'"

# 1. Get all relevant pod information in a single, parsable block.
POD_INFO=$($CMD \
  get pods -n $NAMESPACE -l $POD_LABEL -o=json \
  | jq -c '
    .items[] |
    {
      name: .metadata.name,
      specImage: .spec.containers[0].image,
      image: .status.containerStatuses[0].image,
      imageID: .status.containerStatuses[0].imageID
    }
')

# Check if any pods were found
if [[ -z "$POD_INFO" ]]; then
  echo "No pods found with names starting with '$POD_LABEL' in the '$NAMESPACE' namespace."
  exit 1
fi

# 2. Loop through each JSON object (each pod).
echo "$POD_INFO" | while read -r pod_json; do
  # Parse details for the current pod
  POD_NAME=$(echo "$pod_json" | jq -r '.name')
  SPEC_IMAGE=$(echo "$pod_json" | jq -r '.specImage')
  IMAGE_TAG=$(echo "$pod_json" | jq -r '.image')
  IMAGE_ID=$(echo "$pod_json" | jq -r '.imageID')

  # The imageID is often formatted like "docker-pullable://<image>@<digest>".
  # We extract the running image's sha256 digest from this string.
  RUNNING_DIGEST=$(echo "$IMAGE_ID" | sed -n 's/.*@\(sha256:[a-f0-9]\{64\}\).*/\1/p')

  # Construct the full image name with the digest for precise inspection.
  # This avoids ambiguity if the tag has been updated in the repo.
  IMAGE_REPO=$(echo "$IMAGE_TAG" | cut -d':' -f1)
  IMAGE_WITH_DIGEST="$IMAGE_REPO@$RUNNING_DIGEST"

  echo "=================================================="
  echo "🔎 Processing Pod: $POD_NAME"
  echo "       Spec Image: $SPEC_IMAGE"
  echo "    Running Image: $IMAGE_TAG"
  # echo "                   $IMAGE_WITH_DIGEST"
  echo "   Running Digest: $RUNNING_DIGEST"
  echo ""

  # 1. If a pod is pending or has failed to start, its image fields may be null.
  #    When jq sees a null value, `jq -r` outputs the string "null".
  if [[ "$IMAGE_TAG" == "null" || "$IMAGE_ID" == "null" ]]; then
    echo "---"
    echo "🟡 Skipping Pod: $POD_NAME"
    echo "   Reason: Pod is not in a running state or image info is unavailable."
    echo "--------------------------------------------------"
    continue # Skip to the next pod in the loop
  fi

  ## 2. Verify the digest against the remote repository tag
  # Temporarily disable errexit to handle skopeo failures gracefully
  set +e
  REMOTE_DIGEST=$(skopeo inspect "docker://$IMAGE_TAG" --format '{{.Digest}}' 2>/dev/null)
  set -e

  if [[ "$RUNNING_DIGEST" == "$REMOTE_DIGEST" ]]; then
    echo "✅ Match: The running container's digest matches the remote digest for the tag."
  else
    echo "⚠️  Mismatch Warning:"
    echo "   - The running digest does not match the remote digest:"
    echo "       running digest: $RUNNING_DIGEST"
    echo "        remote digest: $REMOTE_DIGEST"
    echo "   - This means the '$IMAGE_TAG' tag in the repository has been updated since this container was started."
  fi
  echo ""

  ## 3. Show the container image labels
  echo "Fetching image labels..."
  # Use skopeo to inspect the manifest of the exact image digest and extract its labels.
  # We pipe the JSON output to jq for pretty-printing.
  # Temporarily disable errexit to handle skopeo failures gracefully
  set +e
  SKOPEO_OUTPUT=$(skopeo inspect "docker://$IMAGE_WITH_DIGEST" --format '{{json .Labels}}' 2>&1)
  SKOPEO_EXIT=$?
  set -e

  if [[ $SKOPEO_EXIT -eq 0 ]]; then
      echo "🏷️  Labels for $IMAGE_WITH_DIGEST:"
      echo "$SKOPEO_OUTPUT" | jq .
  else
      echo "⚠️  Unable to fetch labels for $IMAGE_WITH_DIGEST"

      # Provide specific guidance based on the error
      if echo "$SKOPEO_OUTPUT" | grep -qi "manifest unknown\|not found"; then
          echo "   Reason: Image digest not found in the remote repository."
          echo "   This may happen if:"
          echo "     - The image was pulled from a local/private registry not accessible remotely"
          echo "     - The image was built locally and never pushed"
          echo "     - The image has been deleted from the remote registry"
          echo "   Tip: Try inspecting with the tag instead: skopeo inspect docker://$IMAGE_TAG"
      elif echo "$SKOPEO_OUTPUT" | grep -qi "unauthorized\|authentication"; then
          echo "   Reason: Authentication required to access this image."
          echo "   Tip: You may need to login with: skopeo login <registry>"
      elif echo "$SKOPEO_OUTPUT" | grep -qi "connection\|network\|timeout"; then
          echo "   Reason: Network connectivity issue."
          echo "   Tip: Check your network connection and registry accessibility."
      else
          echo "   Error details: $SKOPEO_OUTPUT"
      fi
  fi
  echo "--------------------------------------------------"
  echo ""
done
