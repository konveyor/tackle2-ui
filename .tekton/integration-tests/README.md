# Integration Test Pipeline

## Overview

This directory contains a custom integration test pipeline for MTA FBC deployments. We use a custom pipeline instead of Konflux's built-in `deploy-fbc-operator` pipeline for the following reasons:

**Why custom pipeline:**

- **Hypershift-only limitation**: Konflux's EaaS (Environment as a Service) only supports ephemeral Hypershift clusters, not standalone OpenShift clusters
- **Production credentials required**: MTA operator deployment requires access to both production (`registry.redhat.io`) and stage (`registry.stage.redhat.io`) registries for pre-release testing
- **Namespace-level credentials**: Hypershift clusters have managed global pull secrets, requiring namespace-level secret management via service accounts

**What the custom pipeline provides:**

- Registry mirroring configuration at cluster creation time
- Namespace-level pull secret injection for both `openshift-marketplace` and operator namespaces
- Automated E2E test execution with Cypress
- Complete deployment verification

## Files

### Registry Credentials

**Credentials are stored in Konflux:**

- Secret name: `registry-pull-secrets`
- Namespace: `art-mta-tenant`
- Type: `kubernetes.io/dockerconfigjson`

**Required registries:**

- `registry.redhat.io` - Production registry (fallback when stage doesn't have specific bundle SHAs)
- `registry.stage.redhat.io` - ART stage registry for pre-release bundles
- `quay.io/openshift-cnv` - Access to CNV-related images
- `quay.io/openshift-virtualization/konflux-builds` - Access to Konflux build artifacts
- `quay.io/redhat-user-workloads/ocp-art-tenant/art-images-share` - ART image builds

**Why both production and stage credentials:**
FBC catalogs built by ART reference `registry.redhat.io` for bundle images. With imageContentSources mirroring to `registry.stage.redhat.io`, the cluster tries stage first, then falls back to production if the specific bundle SHA doesn't exist in stage.

### mta-fbc-e2e-pipeline.yaml

Tekton pipeline that:

1. **parse-metadata**: Extracts FBC image from Konflux snapshot
2. **provision-eaas-space**: Obtains EaaS credentials for cluster provisioning
3. **provision-cluster**: Provisions ephemeral Hypershift cluster with registry mirroring configured via `imageContentSources`
4. **deploy-operator**: Deploys MTA operator and runs E2E tests
   - Adds registry credentials to namespace-level service accounts:
     - Creates `registry-pull-secret` in `openshift-marketplace` namespace
     - Creates `registry-pull-secret` in `openshift-mta` namespace
     - Links secrets to default service accounts via imagePullSecrets
   - Creates CatalogSource from FBC image
   - Creates OperatorGroup and Subscription
   - Waits for operator CSV to succeed
   - Creates MTA Custom Resource (Tackle CR)
   - Waits for MTA UI deployment to be created
   - Waits for MTA UI pods to be ready
   - Retrieves MTA UI route and Keycloak admin password
   - Runs Cypress E2E tests tagged with `@ci`

**Pipeline configuration:**

- Namespace: `openshift-mta`
- Channel: `stable-v8.1`
- Cluster version: OpenShift 4.17.0
- Instance type: `m5.xlarge`

**Note**: Hypershift clusters have managed global pull secrets. This pipeline uses namespace-level pull secrets attached to service accounts instead of modifying the global pull secret.
