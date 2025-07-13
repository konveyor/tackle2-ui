import path from "node:path";
import fs from "node:fs";
import { validateSettingsXml } from "./index";

function readFile(relativePath: string) {
  const filePath = path.resolve(__dirname, relativePath);
  const asString = fs.readFileSync(filePath, "utf8");
  return asString;
}

const testSettingsFile = `

<?xml version="1.0" encoding="UTF-8"?>
<settings xmlns="http://maven.apache.org/SETTINGS/1.2.0"
          xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
          xsi:schemaLocation="http://maven.apache.org/SETTINGS/1.2.0 http://maven.apache.org/xsd/settings-1.2.0.xsd">
  <profiles>
    <profile>
      <id>github</id>
    </profile>
  </profiles>
</settings>

`.trim();

describe("Test maven settings xml validation", () => {
  it("empty content is ok", async () => {
    expect(await validateSettingsXml(undefined)).toBe(false);
    expect(await validateSettingsXml("")).toBe(false);
  });

  it("random content is not valid xml", async () => {
    const content = "The quick brown fox jumps over the lazy dog";
    await expect(validateSettingsXml(content)).rejects.toThrow(
      /char 'T' is not expected/
    );
  });

  it("expect wrong xml content is not valid", async () => {
    const content = "<foo bar='zip'>zap</foo>";
    await expect(validateSettingsXml(content)).rejects.toThrow(
      /No settings tag found/
    );
  });

  it("identity-form test embedded settings file is valid", async () => {
    expect(await validateSettingsXml(testSettingsFile)).toBe(true);
  });

  it("Mock 1.0.0 settings file is valid", async () => {
    const content = readFile("./settings-1.0.0.xml");
    expect(await validateSettingsXml(content)).toBe(true);
  });

  it("Mock 1.2.0 settings file is valid", async () => {
    const content = readFile("./settings-1.2.0.xml");
    expect(await validateSettingsXml(content)).toBe(true);
  });
});
