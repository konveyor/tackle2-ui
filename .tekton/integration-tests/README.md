# Integration Test Pipeline

## Files

### pull-secrets.json

Contains registry credentials used during integration testing.

**Purpose:**

- `registry.stage.redhat.io` - ART FBC catalogs reference unreleased operator bundles that only exist in the stage registry
- `quay.io/openshift-cnv` - Access to CNV-related images
- `quay.io/openshift-virtualization/konflux-builds` - Access to Konflux build artifacts

**Security:** These credentials are for stage/test registries and are required for automated testing of pre-release builds.

### mta-fbc-deploy-pipeline.yaml

Tekton pipeline that:

1. Provisions an ephemeral Hypershift cluster via EaaS
2. Configures registry mirroring (registry.redhat.io → registry.stage.redhat.io)
3. Merges stage registry credentials into cluster's global pull secret
4. Verifies credentials propagation before Hypershift controllers revert changes
5. Deploys MTA operator from FBC catalog
6. Creates MTA instance for testing

**Note**: Hypershift clusters have managed pull secrets that controllers may revert. The pipeline attempts to update credentials and proceed quickly before any revert occurs.
