# Integration Test Pipeline

## Overview

This directory contains a custom integration test pipeline for MTA FBC deployments. We use a custom pipeline instead of Konflux's built-in `deploy-fbc-operator` pipeline for the following reasons:

**Why custom pipeline:**

- **Hypershift-only limitation**: Konflux's EaaS (Environment as a Service) only supports ephemeral Hypershift clusters, not standalone OpenShift clusters
- **Pre-release testing**: MTA operator bundles are built and pushed to `registry.stage.redhat.io` before production release
- **Registry mirroring**: FBC catalogs reference `registry.redhat.io`, but we need to pull from `registry.stage.redhat.io` using imageContentSources

**What the custom pipeline provides:**

- Registry mirroring configuration at cluster creation time (`registry.redhat.io` → `registry.stage.redhat.io`)
- Automated operator deployment from FBC catalog
- MTA CR (Custom Resource) creation with optimized resource limits
- Automated E2E test execution with Cypress
- Complete deployment verification

## Registry Credentials

**Stage registry credentials are now built into EaaS Hypershift clusters:**

The EaaS team has added `registry.stage.redhat.io` credentials to the `hypershift` secret in the EaaS management cluster. This secret is used by the `hypershift-aws-cluster` ClusterTemplate to provision clusters with stage credentials in the global pull secret.

**How it works:**

1. EaaS provisions Hypershift clusters using the `hypershift-aws-cluster` ClusterTemplate
2. The template uses a Helm chart (`hypershift-aws-template`) that references a secret named `hypershift`
3. This secret contains a `pull-secret` file with both production and stage registry credentials
4. The pull secret is passed to the `hypershift` CLI during cluster creation via `--pull-secret /opt/hypershift/secret/pull-secret`
5. Hypershift creates the cluster's global pull secret from this file
6. All pods in the cluster inherit these credentials, including OLM bundle-unpacking pods

**Registry mirroring:**

The pipeline configures `imageContentSources` during cluster creation to mirror `registry.redhat.io` → `registry.stage.redhat.io`. When OLM tries to pull a bundle image like `registry.redhat.io/mta/mta-operator-bundle@sha256:...`, the cluster automatically redirects to `registry.stage.redhat.io` first, then falls back to production if not found.

**No manual credential patching required:**

Unlike the previous implementation, we no longer need to:

- Store registry credentials in Konflux secrets
- Patch the global pull secret (Hypershift reconciles it back anyway)
- Create namespace-level secrets for OLM
- Configure `CatalogSource.spec.secrets`

## Pipeline Steps

The `mta-fbc-e2e-pipeline.yaml` performs the following steps:

### 1. parse-metadata

Extracts the FBC (File-Based Catalog) image reference from the Konflux snapshot JSON.

**Output:** `component-container-image` - FBC image URL (e.g., `quay.io/redhat-user-workloads/ocp-art-tenant/art-fbc@sha256:...`)

### 2. provision-eaas-space

Creates an isolated namespace in the EaaS management cluster for ephemeral cluster resources.

**Inputs:** PipelineRun name/UID for ownership tracking  
**Output:** `secretRef` - Credentials to interact with EaaS

### 3. provision-cluster

Provisions an ephemeral Hypershift cluster on AWS.

**Configuration:**

- OpenShift version: 4.20
- Instance type: m5.xlarge
- **imageContentSources:** Mirrors `registry.redhat.io` → `registry.stage.redhat.io`

**How mirroring works:**
When OLM tries to pull `registry.redhat.io/mta/mta-operator-bundle@sha256:abc123`, the cluster automatically redirects to `registry.stage.redhat.io/mta/mta-operator-bundle@sha256:abc123` first. If the image doesn't exist in stage, it falls back to production.

**Output:** `clusterName`

### 4. deploy-operator

Installs the MTA operator and deploys the MTA application.

**Sub-steps:**

1. **get-kubeconfig**: Retrieves cluster credentials
2. **install-operator**: Main deployment logic
   - Creates `openshift-mta` namespace
   - Creates CatalogSource pointing to the FBC image
   - Waits for CatalogSource to be READY (5 min timeout)
   - Creates OperatorGroup in `openshift-mta` namespace
   - Creates Subscription to `mta-operator` (channel: `stable-v8.1`)
   - Waits for ClusterServiceVersion (CSV) to succeed (15 min timeout)
   - Waits for mta-operator deployment to be available (5 min timeout)
   - Creates Tackle CR with resource limits for analysis containers
   - Waits for mta-ui deployment to be created (10 min timeout)
   - Waits for mta-ui pods to be ready (15 min timeout)
   - Retrieves MTA UI route (public hostname)
   - Retrieves Keycloak admin password from `mta-keycloak-rhbk` secret

**Outputs:**

- `deploymentStatus`: "SUCCESS" or "FAILED"
- `csvName`: Installed operator version
- `uiRoute`: MTA UI hostname
- `keycloakPassword`: Keycloak admin password

### 5. run-e2e-tests

Runs Cypress E2E login test against the deployed MTA instance.

**Steps:**

1. Clone tackle2-ui repository (branch: `ui_test_konflux_integration`)
2. Install Node.js dependencies and Cypress binary
3. Run login test (`e2e/tests/login.test.ts`)
   - Base URL: MTA UI route from deploy-operator step
   - User: admin/Dog8code
   - Keycloak admin password from deploy-operator step
4. Generate JUnit XML test reports

**Test coverage:**
Currently runs only the login test to validate:

- MTA UI is accessible
- Authentication flow works
- Basic deployment functionality

## Pipeline Configuration

- **Namespace:** `openshift-mta`
- **Operator channel:** `stable-v8.1`
- **Cluster version:** OpenShift 4.20
- **Instance type:** m5.xlarge
- **Registry mirroring:** `registry.redhat.io` → `registry.stage.redhat.io`
- **Total runtime:** ~20-30 minutes (cluster provisioning + operator deployment + tests)

---

## Troubleshooting History

This section documents issues encountered during development and their resolutions.

### Issue 1: OLM Bundle Pull Failures - "unauthorized: authentication required"

**Symptom:**  
OLM bundle-unpacking pods failed with:

```
Failed to pull image "registry.redhat.io/mta/mta-operator-bundle@sha256:...":
rpc error: code = Unknown desc = unable to retrieve auth token: invalid username/password: unauthorized
```

**Root cause:**  
OLM uses the cluster's global pull secret for bundle image pulls. Hypershift ephemeral clusters did not have `registry.stage.redhat.io` credentials in the global pull secret.

**Failed attempts:**

1. **CatalogSource.spec.secrets**: Added namespace-level secrets to CatalogSource
   - **Why it failed:** `CatalogSource.spec.secrets` only applies to the catalog image itself, not to bundle images that OLM unpacks

2. **Manual global pull secret patching**: Added credentials via `oc set data secret/pull-secret -n openshift-config`
   - **Why it failed:** Hypershift actively reconciles the global pull secret back to the default defined in the ClusterTemplate, reverting manual changes

3. **Namespace-level imagePullSecrets**: Created secrets in `openshift-marketplace` and linked to service accounts
   - **Why it failed:** OLM bundle-unpacking pods ignore namespace-level imagePullSecrets and only use the global pull secret

**Solution:**  
Worked with the EaaS team to add `registry.stage.redhat.io` credentials to the `hypershift` secret in the EaaS management cluster. This secret is used by the `hypershift-aws-cluster` ClusterTemplate to provision clusters with stage credentials built into the global pull secret.

**Location of fix:**

- Repository: `https://github.com/redhat-appstudio/infra-deployments`
- File: `components/cluster-as-a-service/base/secrets/hypershift.yaml` (or similar)
- Secret name: `hypershift`
- Key: `pull-secret` (JSON file with registry credentials)

**Verification:**  
After the fix, new Hypershift clusters have stage credentials in the global pull secret:

```bash
oc get secret pull-secret -n openshift-config -o jsonpath='{.data.\.dockerconfigjson}' | base64 -d | jq '.auths | keys[]'
# Output includes: registry.stage.redhat.io
```

OLM successfully pulls bundles from stage:

```
Successfully pulled image registry.redhat.io/mta/mta-operator-bundle@sha256:... in 1.504s
# (redirected to registry.stage.redhat.io via imageContentSources)
```

---

### Issue 2: Understanding ClusterTemplate and Hypershift Architecture

**Confusion:**  
Initial uncertainty about where to add stage credentials in the EaaS/Hypershift infrastructure.

**Key concepts clarified:**

1. **ClusterTemplate**: Kubernetes resource defining cluster provisioning parameters
   - Name: `hypershift-aws-cluster`
   - Location: EaaS management cluster
   - Defined in: `https://github.com/redhat-appstudio/infra-deployments`

2. **Helm chart**: Template references `https://konflux-ci.dev/cluster-template-charts` (version 0.1.9)
   - Chart: `hypershift-aws-template`
   - Repository: `https://github.com/konflux-ci/cluster-template-charts`

3. **Pull secret flow:**

   ```
   hypershift secret (in EaaS cluster)
   → Helm chart values.yaml (secret: hypershift)
   → create-cluster-job.yaml (--pull-secret /opt/hypershift/secret/pull-secret)
   → hypershift CLI
   → Global pull secret in provisioned cluster
   → Hypershift reconciliation maintains it
   ```

4. **Why tenant-level secrets don't work:**
   - Tenant namespace is in the provisioned cluster
   - Global pull secret is controlled by Hypershift in the management cluster
   - Hypershift reconciles the global secret back to the ClusterTemplate's default
   - Only way to change it: modify the `hypershift` secret in the EaaS management cluster

**Resolution:**  
Documented the exact location where EaaS team needed to add credentials (the `hypershift` secret, not tenant namespace secrets).

---

### Issue 3: Confusion About redhat-appstudio-staginguser-pull-secret

**Confusion:**  
Initial assumption that `redhat-appstudio-staginguser-pull-secret` contained stage registry credentials.

**Clarification:**

- `redhat-appstudio-staginguser-pull-secret`: Contains credentials for `quay.io/redhat-user-workloads` (Konflux build artifacts)
- `registry.stage.redhat.io`: Separate registry requiring different credentials (ART stage registry)

**Resolution:**  
Identified that stage registry credentials needed to be added separately to the `hypershift` secret, not related to the staging user pull secret.

---

### Issue 4: ImageContentSources vs. ImageDigestMirrorSet

**Confusion:**  
Checking for both `ImageContentSourcePolicy` and `ImageDigestMirrorSet` when verifying mirroring.

**Clarification:**

- **OpenShift 4.13+**: Uses `ImageDigestMirrorSet` (IDMS)
- **OpenShift 4.12 and earlier**: Uses `ImageContentSourcePolicy` (ICSP)
- **EaaS stepaction**: Creates IDMS automatically from the `imageContentSources` parameter

**Verification:**

```bash
oc get imagedigestmirrorset -o yaml | grep -A5 "mirrors:"
# Shows: registry.redhat.io → registry.stage.redhat.io
```

**Resolution:**  
Pipeline uses the `imageContentSources` parameter in the `eaas-create-ephemeral-cluster-hypershift-aws` stepaction, which handles the correct resource type automatically.

---

### Issue 5: Test Execution Branch Confusion

**Issue:**  
Tests were running from a custom branch (`ui_test_konflux_integration`) in a fork, not from the main repository.

**Current state:**

```bash
git clone --branch ui_test_konflux_integration https://github.com/sshveta/tackle2-ui.git
```

**TODO:**  
Update to use the main repository branch (either `main` or `release-0.9`) once integration work is merged upstream.

---

### Issue 6: Excessive Logging for Debugging

**Issue:**  
Pipeline included extensive logging for debugging OLM bundle pulls, credential verification, and cluster state inspection.

**What was removed after fix verification:**

- FBC catalog content extraction and inspection
- Global pull secret verification logs
- ImageContentSources verification
- Bundle pod service account inspection
- Detailed operator installation diagnostics
- Image source verification section
- Registry credential setup messaging

**Current state:**  
Pipeline now has minimal logging with only essential status updates:

- CatalogSource READY confirmation
- Operator installation progress (every 60 seconds)
- Operator installed confirmation with CSV name
- MTA UI deployment status

**Why cleaned up:**  
The infrastructure fix (stage credentials in Hypershift clusters) eliminated the need for extensive debugging. The pipeline now works reliably without manual intervention.

---

### Summary of Final Working Configuration

**Infrastructure (EaaS):**

- ✅ `registry.stage.redhat.io` credentials in `hypershift` secret
- ✅ ClusterTemplate provisions clusters with stage credentials in global pull secret
- ✅ Hypershift maintains the pull secret (no manual patching needed)

**Pipeline (mta-fbc-e2e-pipeline.yaml):**

- ✅ imageContentSources mirrors `registry.redhat.io` → `registry.stage.redhat.io`
- ✅ No credential patching steps needed
- ✅ No CatalogSource.spec.secrets configuration
- ✅ Minimal logging for production readiness
- ✅ 15-minute operator installation timeout
- ✅ Login test only for quick validation

**Result:**  
Pre-release MTA operator bundles from `registry.stage.redhat.io` can now be tested in Konflux ephemeral clusters without any manual credential configuration.
