# Agentic run parameters and supervision

The agentic console builds its run forms from parameter declarations on
`Agent` and `AgentWorkflow` resources. Resource authors define the fields in
YAML; users supply their values in the UI when they create a run.

## Define Agent parameters

An Agent may declare string, number, and boolean parameters:

```yaml
apiVersion: konveyor.io/v1alpha1
kind: Agent
metadata:
  name: migration-agent
spec:
  image: quay.io/example/migration-agent:latest
  gateways:
    - ref: default
  prompt: |
    Migrate $(agent.component) in at most $(agent.max_turns) turns.
    Dry run: $(agent.dry_run)
  params:
    - name: component
      type: string
      description: Component to migrate
      required: true
    - name: max_turns
      type: number
      default: "25"
    - name: dry_run
      type: boolean
      default: "false"
```

When a user selects `migration-agent` in **Agent runs > Create run**, the UI
renders a required text field, a number input, and a checkbox. It validates the
values and sends them in `AgentRun.spec.params`.

## Define Workflow parameters

A workflow may declare its own parameters in addition to the parameters of its
stage Agents:

```yaml
apiVersion: konveyor.io/v1alpha1
kind: AgentWorkflow
metadata:
  name: migration-workflow
spec:
  guide: Migrate release $(workflow.release_name).
  params:
    - name: release_name
      type: string
      description: Release being prepared
      required: true
    - name: run_validation
      type: boolean
      default: "true"
  stages:
    - name: migrate
      agentRef: migration-agent
      instructions: Migrate $(agent.component) for $(workflow.release_name).
```

The workflow run form shows two sections:

- **Workflow parameters** contains declarations from the `AgentWorkflow`.
- **Stage Agent parameters** contains declarations from the referenced Agents
  and identifies the stages that use each value.

The controller filters Agent values per stage. A parameter does not need to be
declared by every stage Agent.

## Runtime delivery

The controller validates required values, applies defaults, coerces numbers and
booleans to their JSON types, and mounts the resolved result at
`/run/konveyor/params.json` in the Sandbox:

```json
{
  "workflow": {
    "release_name": "2026.09",
    "run_validation": true
  },
  "agent": {
    "component": "inventory",
    "max_turns": 25,
    "dry_run": false
  },
  "execution": {
    "mode": "auto"
  }
}
```

## Supervision mode

Direct Agent runs offer two supervision modes:

- **Automatic** approves tool calls without user interaction and is the
  controller default.
- **Approval required** pauses for a user decision before tool calls.

> **Warning:** after creating a run in Approval required mode, keep its details
> page open while the run is active. The page attaches the live viewer used to
> answer requests. If no viewer is attached, approval fails closed: the tool
> request is denied and the agent cannot continue that action.

Workflow stage supervision is defined by `spec.stages[].execution` on the
`AgentWorkflow`; `AgentWorkflowRun` does not have a top-level execution mode.

## Compatibility and troubleshooting

The controller CRDs, Hub, and UI must all support the same agentic API fields.
If a declaration is visible with `kubectl` but absent from the UI, inspect the
corresponding Hub `/hub/agentic` response. An older Hub may deserialize the
resource with an older API type and omit fields before the UI receives it.

The console also requires `AGENTIC_ENABLED=true` in the UI deployment.
