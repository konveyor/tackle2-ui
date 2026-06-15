import React, { useCallback, useMemo, useState } from "react";
import {
  Button,
  ButtonVariant,
  FormGroup,
  Switch,
  Text,
  TextArea,
  TextContent,
  TextInput,
  Title,
} from "@patternfly/react-core";
import { PlusCircleIcon, TrashIcon } from "@patternfly/react-icons";
import spacing from "@patternfly/react-styles/css/utilities/Spacing/spacing";

export interface PalletSource {
  name: string;
  type: "git" | "hub";
  url?: string;
  ref?: string;
  paths?: string[];
}

export interface PalletConfig {
  sources: PalletSource[];
  agents?: {
    auto_detect?: boolean;
  };
  hub?: {
    url?: string;
  };
}

interface PalletEditorProps {
  value: string;
  onChange: (yaml: string) => void;
}

const EMPTY_SOURCE: PalletSource = {
  name: "",
  type: "git",
  url: "",
  ref: "",
  paths: [],
};

const DEFAULT_PLACEHOLDER = `sources:
  - name: my-skills
    type: git
    url: https://github.com/org/skills
    paths:
      - skills/java-ee-to-quarkus

agents:
  auto_detect: true`;

/**
 * Parse pallet YAML into structured config.
 * Simple parser — handles the known pallet.yaml shape.
 */
function parsePalletYaml(yaml: string): PalletConfig | null {
  try {
    if (!yaml.trim()) return { sources: [], agents: { auto_detect: true } };

    const config: PalletConfig = { sources: [] };
    const lines = yaml.split("\n");
    let currentSource: PalletSource | null = null;
    let inSources = false;
    let inPaths = false;
    let inAgents = false;
    let inHub = false;

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;

      if (trimmed === "sources:") {
        inSources = true;
        inAgents = false;
        inHub = false;
        inPaths = false;
        continue;
      }
      if (trimmed === "agents:") {
        inAgents = true;
        inSources = false;
        inHub = false;
        inPaths = false;
        if (currentSource) {
          config.sources.push(currentSource);
          currentSource = null;
        }
        config.agents = {};
        continue;
      }
      if (trimmed === "hub:") {
        inHub = true;
        inSources = false;
        inAgents = false;
        inPaths = false;
        config.hub = {};
        continue;
      }

      if (inSources) {
        if (trimmed.startsWith("- name:")) {
          if (currentSource) config.sources.push(currentSource);
          currentSource = {
            ...EMPTY_SOURCE,
            name: trimmed.replace("- name:", "").trim(),
          };
          inPaths = false;
          continue;
        }
        if (currentSource) {
          if (trimmed.startsWith("type:")) {
            currentSource.type = trimmed.replace("type:", "").trim() as
              | "git"
              | "hub";
          } else if (trimmed.startsWith("url:")) {
            currentSource.url = trimmed.replace("url:", "").trim();
          } else if (trimmed.startsWith("ref:")) {
            currentSource.ref = trimmed.replace("ref:", "").trim();
          } else if (trimmed === "paths:") {
            inPaths = true;
            currentSource.paths = [];
          } else if (inPaths && trimmed.startsWith("- ")) {
            currentSource.paths = currentSource.paths || [];
            currentSource.paths.push(trimmed.replace("- ", "").trim());
          }
        }
      }

      if (inAgents) {
        if (trimmed.startsWith("auto_detect:")) {
          config.agents = config.agents || {};
          config.agents.auto_detect = trimmed.includes("true");
        }
      }

      if (inHub) {
        if (trimmed.startsWith("url:")) {
          config.hub = config.hub || {};
          config.hub.url = trimmed.replace("url:", "").trim();
        }
      }
    }

    if (currentSource) config.sources.push(currentSource);
    return config;
  } catch {
    return null;
  }
}

/**
 * Serialize structured config back to YAML.
 */
function serializePalletYaml(config: PalletConfig): string {
  const lines: string[] = [];

  if (config.hub?.url) {
    lines.push("hub:");
    lines.push(`  url: ${config.hub.url}`);
    lines.push("");
  }

  if (config.sources.length > 0) {
    lines.push("sources:");
    for (const source of config.sources) {
      if (!source.name) continue;
      lines.push(`  - name: ${source.name}`);
      lines.push(`    type: ${source.type || "git"}`);
      if (source.url) lines.push(`    url: ${source.url}`);
      if (source.ref) lines.push(`    ref: ${source.ref}`);
      if (source.paths && source.paths.length > 0) {
        lines.push("    paths:");
        for (const p of source.paths) {
          if (p.trim()) lines.push(`      - ${p}`);
        }
      }
      lines.push("");
    }
  }

  if (config.agents) {
    lines.push("agents:");
    if (config.agents.auto_detect !== undefined) {
      lines.push(`  auto_detect: ${config.agents.auto_detect}`);
    }
  }

  return lines.join("\n").trim() + "\n";
}

export const PalletEditor: React.FC<PalletEditorProps> = ({
  value,
  onChange,
}) => {
  const [mode, setMode] = useState<"form" | "yaml">("form");

  const config = useMemo(() => parsePalletYaml(value), [value]);

  const updateConfig = useCallback(
    (updater: (draft: PalletConfig) => void) => {
      const current = parsePalletYaml(value) || {
        sources: [],
        agents: { auto_detect: true },
      };
      updater(current);
      onChange(serializePalletYaml(current));
    },
    [value, onChange]
  );

  const addSource = () => {
    updateConfig((draft) => {
      draft.sources.push({
        name: `source-${draft.sources.length + 1}`,
        type: "git",
        url: "",
        paths: [],
      });
    });
  };

  const removeSource = (index: number) => {
    updateConfig((draft) => {
      draft.sources.splice(index, 1);
    });
  };

  const updateSource = (
    index: number,
    field: keyof PalletSource,
    val: string | string[]
  ) => {
    updateConfig((draft) => {
      const source = draft.sources[index];
      if (!source) return;
      if (field === "paths") {
        source.paths = val as string[];
      } else {
        (source as unknown as Record<string, unknown>)[field] = val;
      }
    });
  };

  const toggleAutoDetect = (checked: boolean) => {
    updateConfig((draft) => {
      draft.agents = draft.agents || {};
      draft.agents.auto_detect = checked;
    });
  };

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 8,
        }}
      >
        <Title headingLevel="h4" size="md">
          Pallet Configuration
        </Title>
        <Switch
          id="pallet-mode-toggle"
          label="YAML"
          labelOff="Form"
          isChecked={mode === "yaml"}
          onChange={(_event, checked) => setMode(checked ? "yaml" : "form")}
          isReversed
        />
      </div>

      {mode === "yaml" ? (
        <FormGroup fieldId="pallet-yaml-raw">
          <TextArea
            id="pallet-yaml-raw"
            value={value}
            onChange={(_event, val) => onChange(val)}
            aria-label="Pallet YAML"
            rows={12}
            resizeOrientation="vertical"
            placeholder={DEFAULT_PLACEHOLDER}
            style={{ fontFamily: "monospace", fontSize: "0.85em" }}
          />
        </FormGroup>
      ) : (
        <div>
          {/* Sources */}
          <TextContent className={spacing.mbSm}>
            <Text component="small" style={{ fontWeight: 600 }}>
              Sources
            </Text>
          </TextContent>

          {(config?.sources || []).map((source, idx) => (
            <div
              key={idx}
              style={{
                border: "1px solid var(--pf-v5-global--BorderColor--100)",
                borderRadius: 4,
                padding: 12,
                marginBottom: 8,
                position: "relative",
              }}
            >
              <Button
                variant="plain"
                icon={<TrashIcon />}
                onClick={() => removeSource(idx)}
                isDanger
                style={{ position: "absolute", top: 4, right: 4 }}
                aria-label="Remove source"
              />

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 8,
                }}
              >
                <FormGroup label="Name" fieldId={`source-name-${idx}`}>
                  <TextInput
                    id={`source-name-${idx}`}
                    value={source.name}
                    onChange={(_event, val) => updateSource(idx, "name", val)}
                  />
                </FormGroup>
                <FormGroup label="Type" fieldId={`source-type-${idx}`}>
                  <TextInput
                    id={`source-type-${idx}`}
                    value={source.type}
                    onChange={(_event, val) => updateSource(idx, "type", val)}
                  />
                </FormGroup>
              </div>

              <FormGroup label="URL" fieldId={`source-url-${idx}`}>
                <TextInput
                  id={`source-url-${idx}`}
                  value={source.url || ""}
                  onChange={(_event, val) => updateSource(idx, "url", val)}
                  placeholder="https://github.com/org/skills"
                />
              </FormGroup>

              <FormGroup label="Ref (branch/tag)" fieldId={`source-ref-${idx}`}>
                <TextInput
                  id={`source-ref-${idx}`}
                  value={source.ref || ""}
                  onChange={(_event, val) => updateSource(idx, "ref", val)}
                  placeholder="main"
                />
              </FormGroup>

              <FormGroup
                label="Paths (one per line)"
                fieldId={`source-paths-${idx}`}
              >
                <TextArea
                  id={`source-paths-${idx}`}
                  value={(source.paths || []).join("\n")}
                  onChange={(_event, val) =>
                    updateSource(
                      idx,
                      "paths",
                      val.split("\n").filter((l) => l.trim())
                    )
                  }
                  rows={3}
                  placeholder={`skills/java-ee-to-quarkus\nagents`}
                  style={{ fontFamily: "monospace", fontSize: "0.85em" }}
                />
              </FormGroup>
            </div>
          ))}

          <Button
            variant={ButtonVariant.link}
            icon={<PlusCircleIcon />}
            onClick={addSource}
            style={{ marginBottom: 12 }}
          >
            Add Source
          </Button>

          {/* Agents */}
          <FormGroup fieldId="pallet-auto-detect" label="Agent Settings">
            <Switch
              id="pallet-auto-detect"
              label="Auto-detect agents"
              isChecked={config?.agents?.auto_detect ?? true}
              onChange={(_event, checked) => toggleAutoDetect(checked)}
            />
          </FormGroup>
        </div>
      )}
    </div>
  );
};

export default PalletEditor;
