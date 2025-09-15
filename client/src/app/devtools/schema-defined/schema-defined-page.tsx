import React, { useCallback, useMemo, useState } from "react";
import ReactJsonView from "@microlink/react-json-view";
import { CodeEditor, Language } from "@patternfly/react-code-editor";
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  Dropdown,
  DropdownItem,
  DropdownList,
  EmptyState,
  EmptyStateBody,
  EmptyStateHeader,
  EmptyStateVariant,
  Flex,
  FlexItem,
  Grid,
  GridItem,
  MenuToggle,
  MenuToggleElement,
  PageSection,
  PageSectionVariants,
  Stack,
  StackItem,
  TextContent,
  Title,
} from "@patternfly/react-core";
import EllipsisVIcon from "@patternfly/react-icons/dist/esm/icons/ellipsis-v-icon";

import { JsonSchemaObject } from "@app/api/models";
import {
  SchemaDefinedField,
  jsonSchemaToYupSchema,
} from "@app/components/schema-defined-fields";
import "./schema-defined-page.css";

import { DocumentStatusAlert, SchemaStatusAlert } from "./StatusAlert";
import example0 from "./example0.json";
import example1 from "./example1.json";
import example2 from "./example2.json";
import example3 from "./example3.json";

export type StatusType = "y" | "n" | "?";

type ObjectWithOptionalNameOrTitle = {
  name?: string;
  title?: string;
  [key: string]: unknown; // Allow any additional properties
};

const EXAMPLES: ObjectWithOptionalNameOrTitle[] = [
  example0,
  example1,
  example2,
  example3,
];

const toString = (schema: string | object) => {
  return typeof schema === "string" ? schema : JSON.stringify(schema, null, 2);
};

const toObject = (schema: string | object) => {
  return typeof schema === "string" ? JSON.parse(schema) : schema;
};

export const SchemaDefinedPage: React.FC = () => {
  const [schemaCode, setSchemaCode] = useState<string>(toString(example1));
  const [parsedSchema, setParsedSchema] = useState<
    JsonSchemaObject | undefined
  >(example1 as JsonSchemaObject);

  const [currentDocument, setCurrentDocument] = useState<object | null>(null);

  // Handle changes to the schema editor
  const handleSchemaChange = useCallback((newSchemaCode: string | object) => {
    setSchemaCode(toString(newSchemaCode));

    try {
      const parsed = toObject(newSchemaCode) as JsonSchemaObject;
      setParsedSchema(parsed);
    } catch (error) {
      // Invalid JSON, keep the previous schema
      console.warn("Invalid JSON schema:", error);
    }
  }, []);

  // Handle changes to the document from SchemaDefinedField
  const handleDocumentChange = useCallback((newDocument: object) => {
    setCurrentDocument(newDocument);
  }, []);

  const schemaStatus: StatusType = useMemo(() => {
    if (schemaCode) {
      try {
        toObject(schemaCode);
        return "y";
      } catch (error) {
        return "n";
      }
    }
    return "?";
  }, [schemaCode]);

  const documentStatus: StatusType = useMemo(() => {
    if (parsedSchema) {
      const schema = jsonSchemaToYupSchema(parsedSchema);
      const isValid = schema.isValidSync(currentDocument);
      return isValid ? "y" : "n";
    }
    return "?";
  }, [parsedSchema, currentDocument]);

  const SchemaActions = () => {
    const [isOpen, setIsOpen] = useState(false);
    return (
      <Dropdown
        onSelect={() => setIsOpen(!isOpen)}
        toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
          <MenuToggle
            ref={toggleRef}
            isExpanded={isOpen}
            onClick={() => setIsOpen(!isOpen)}
            variant="plain"
          >
            <EllipsisVIcon aria-hidden="true" />
          </MenuToggle>
        )}
        isOpen={isOpen}
        onOpenChange={(isOpen: boolean) => setIsOpen(isOpen)}
      >
        <DropdownList>
          {EXAMPLES.map((example, index) => (
            <DropdownItem
              key={`example-${index}`}
              onClick={() => handleSchemaChange(example as object)}
            >
              Load Example {index} {example.name ? `- ${example.name}` : ""}
              {example.title ? `- ${example.title}` : ""}
            </DropdownItem>
          ))}
        </DropdownList>
      </Dropdown>
    );
  };

  return (
    <>
      <PageSection variant={PageSectionVariants.light}>
        <Flex>
          <FlexItem grow={{ default: "grow" }}>
            <TextContent>
              <Title headingLevel="h1">SchemaDefinedField Tester</Title>
            </TextContent>
          </FlexItem>
          <FlexItem align={{ default: "alignRight" }}>
            <SchemaStatusAlert status={schemaStatus} />
          </FlexItem>
          <FlexItem align={{ default: "alignRight" }}>
            <DocumentStatusAlert status={documentStatus} />
          </FlexItem>
          <FlexItem align={{ default: "alignRight" }}>
            <Button onClick={() => setCurrentDocument(null)}>
              Reset Document
            </Button>
          </FlexItem>
        </Flex>
      </PageSection>
      <PageSection>
        <Stack hasGutter>
          {/* Schema Editor & Schema Defined Field - Main Section */}
          <StackItem isFilled>
            <Grid hasGutter style={{ height: "100%" }}>
              <GridItem span={6}>
                <Card isFullHeight isCompact>
                  <CardHeader actions={{ actions: <SchemaActions /> }}>
                    <CardTitle>JSON Schema Editor</CardTitle>
                  </CardHeader>
                  <CardBody className="full-height-container">
                    <CodeEditor
                      id="schema-editor"
                      className="full-height"
                      isCopyEnabled
                      isDarkTheme
                      isLineNumbersVisible
                      isUploadEnabled
                      height="100%"
                      downloadFileName="schema.json"
                      language={Language.json}
                      code={schemaCode}
                      onCodeChange={handleSchemaChange}
                    />
                  </CardBody>
                </Card>
              </GridItem>

              <GridItem span={6}>
                <Card isFullHeight isCompact>
                  <CardTitle>Schema Defined Field</CardTitle>
                  <CardBody className="full-height-container">
                    <SchemaDefinedField
                      id="demo-schema-field"
                      jsonDocument={currentDocument ?? {}}
                      jsonSchema={parsedSchema}
                      onDocumentChanged={handleDocumentChange}
                    />
                  </CardBody>
                </Card>
              </GridItem>
            </Grid>
          </StackItem>

          {/* Document Viewer - Bottom Section */}
          <StackItem>
            <Grid hasGutter style={{ height: "100%" }}>
              <GridItem span={12}>
                <Card isFullHeight isCompact>
                  <CardHeader>
                    <CardTitle>Current Document</CardTitle>
                  </CardHeader>
                  <CardBody className="full-height-container">
                    {currentDocument === null ? (
                      <EmptyState variant={EmptyStateVariant.xs} isFullHeight>
                        <EmptyStateHeader
                          titleText="No Document"
                          headingLevel="h4"
                        />
                        <EmptyStateBody>
                          Current document is empty.
                        </EmptyStateBody>
                      </EmptyState>
                    ) : (
                      <ReactJsonView
                        src={currentDocument ?? {}}
                        name="Document"
                        enableClipboard={false}
                      />
                    )}
                  </CardBody>
                </Card>
              </GridItem>
            </Grid>
          </StackItem>
        </Stack>
      </PageSection>
    </>
  );
};

export default SchemaDefinedPage;
