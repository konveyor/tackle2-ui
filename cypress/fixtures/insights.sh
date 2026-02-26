#!/bin/bash

set -e

# Script to seed insights data for filter.test.ts in insights folder
# Creates applications with exact insights matching analysis.json

rawHost="${HOST:-localhost:8080}"
if [[ "$rawHost" == *"/hub"* ]]; then
  host="$rawHost"
else
  host="${rawHost}/hub"
fi

if [[ ! "$host" =~ ^https?:// ]]; then
  host="https://${host}"
fi

auth_response=$(curl -kSs -w "\n%{http_code}" -d "{\"user\":\"${USERNAME}\",\"password\":\"${PASSWORD}\"}" \
  "${host}/auth/login")

http_code=$(echo "$auth_response" | tail -n1)
response_body=$(echo "$auth_response" | sed '$d')

if [[ "$http_code" != "200" && "$http_code" != "201" ]]; then
  echo "ERROR: Authentication failed with HTTP $http_code" >&2
  exit 1
fi

TOKEN=$(echo "$response_body" | jq -r ".token")

if [[ "$TOKEN" == "null" ]]; then
  echo "ERROR: Authentication response missing token field" >&2
  exit 1
fi

# If token is empty, verify auth is actually disabled by testing API access
if [[ -z "$TOKEN" ]]; then
  test_response=$(curl -kSs -w "\n%{http_code}" "${host}/applications")
  test_code=$(echo "$test_response" | tail -n1)

  if [[ "$test_code" == "401" || "$test_code" == "403" ]]; then
    echo "ERROR: Authentication required but token is empty" >&2
    echo "The server requires authentication but returned an empty token." >&2
    echo "Please check your credentials (USERNAME, PASSWORD) or server configuration." >&2
    exit 1
  fi
fi

export TOKEN

# Function to create bookserver manifest with insights (source_analysis_on_bookserverapp)
create_bookserver_manifest() {
  local file="$1"
  printf '\x1DBEGIN-MAIN\x1D\n' > "$file"
  cat >> "$file" << 'EOF'
---
commit: "1234"
EOF
  printf '\x1DEND-MAIN\x1D\n\x1DBEGIN-INSIGHTS\x1D\n' >> "$file"
  cat >> "$file" << 'EOF'
---
ruleset: technology-usage
rule: 3rd-party-spring-03001
name: Embedded framework - Spring Boot
description: Embedded framework - Spring Boot
category:
effort: 0
labels:
- discovery
- konveyor.io/include=always
- tag=Spring Boot Auto-configuration
incidents:
- file: /src/main/java/Application.java
  message: Embedded framework - Spring Boot
  line: 1
---
ruleset: discovery-rules
rule: discover-java-files
name: Java source files
description: Java source files
category:
effort: 0
labels:
- discovery
- konveyor.io/include=always
- konveyor.io/target=discovery
- tag=Java Source
incidents:
- file: /src/main/java/Application.java
  message: Java source files
  line: 1
---
ruleset: discovery-rules
rule: discover-maven-xml
name: Maven XML file
description: Maven XML file
category:
effort: 0
labels:
- discovery
- konveyor.io/include=always
- konveyor.io/target=discovery
- tag=Maven XML
incidents:
- file: /pom.xml
  message: Maven XML file
  line: 1
---
ruleset: technology-usage
rule: technology-usage-3rd-party-spring-03001-1
name: Spring Boot Auto-configuration
description: Spring Boot Auto-configuration
category:
effort: 0
labels:
- discovery
- konveyor.io/include=always
- tag=Configuration Management=Spring Boot Auto-configuration
incidents:
- file: /src/main/resources/application.properties
  message: Spring Boot Auto-configuration
  line: 1
---
ruleset: technology-usage
rule: technology-usage-3rd-party-spring-03001-2
name: Spring Boot Component Scan
description: Spring Boot Component Scan
category:
effort: 0
labels:
- discovery
- konveyor.io/include=always
- tag=Configuration Management=Spring Boot Component Scan
incidents:
- file: /src/main/java/Application.java
  message: Spring Boot Component Scan
  line: 5
---
ruleset: technology-usage
rule: technology-usage-3rd-party-spring-03001-0
name: Spring Boot Configuration
description: Spring Boot Configuration
category:
effort: 0
labels:
- discovery
- konveyor.io/include=always
- tag=Configuration Management=Spring Boot Configuration
incidents:
- file: /src/main/resources/application.properties
  message: Spring Boot Configuration
  line: 5
EOF
  printf '\x1DEND-INSIGHTS\x1D\n\x1DBEGIN-DEPS\x1D\n\x1DEND-DEPS\x1D\n' >> "$file"
}

# Function to create coolstore manifest with insights (source+dep_on_coolStore_app - 25 insights)
create_coolstore_manifest() {
  local file="$1"
  printf '\x1DBEGIN-MAIN\x1D\n' > "$file"
  cat >> "$file" << 'EOF'
---
commit: "5678"
EOF
  printf '\x1DEND-MAIN\x1D\n\x1DBEGIN-INSIGHTS\x1D\n' >> "$file"
  cat >> "$file" << 'EOF'
---
ruleset: technology-usage
rule: clustering-00000
name: Clustering Web Session
description: Clustering Web Session
category:
effort: 0
labels:
- discovery
- konveyor.io/include=always
- tag=Clustering Web Session
incidents:
- file: /src/main/java/SampleFile00000.java
  message: Clustering Web Session
  line: 1
---
ruleset: technology-usage
rule: technology-usage-clustering-01000
name: Clustering Web Session
description: Clustering Web Session
category:
effort: 0
labels:
- discovery
- konveyor.io/include=always
- tag=Clustering=Web Session
incidents:
- file: /src/main/java/SampleFile01000.java
  message: Clustering Web Session
  line: 1
---
ruleset: technology-usage
rule: javaee-technology-usage-00080
name: Common Annotations
description: Common Annotations
category:
effort: 0
labels:
- discovery
- konveyor.io/include=always
- tag=Common Annotations
incidents:
- file: /src/main/java/SampleFile00080.java
  message: Common Annotations
  line: 1
---
ruleset: technology-usage
rule: javaee-technology-usage-00180
name: Common Annotations
description: Common Annotations
category:
effort: 0
labels:
- discovery
- konveyor.io/include=always
- tag=Connect=Common Annotations
incidents:
- file: /src/main/java/SampleFile00180.java
  message: Common Annotations
  line: 1
---
ruleset: discovery-rules
rule: discover-license
name: Discover project license
description: Discover project license
category:
effort: 0
labels:
- discovery
- konveyor.io/include=always
- konveyor.io/target=discovery
- tag=License=Apache License 2.0
incidents:
- file: /src/main/java/SampleFile.java
  message: Discover project license
  line: 1
---
ruleset: discovery-rules
rule: windup-discover-ejb-configuration
name: EJB XML Configuration
description: EJB XML Configuration
category:
effort: 0
labels:
- discovery
- konveyor.io/include=always
- konveyor.io/target=discovery
- tag=EJB XML
incidents:
- file: /src/main/java/SampleFile.java
  message: EJB XML Configuration
  line: 1
---
ruleset: technology-usage
rule: embedded-framework-05900
name: Embedded framework - GIN
description: Embedded framework - GIN
category:
effort: 0
labels:
- discovery
- konveyor.io/include=always
- tag=Embedded framework - GIN
incidents:
- file: /src/main/java/SampleFile05900.java
  message: Embedded framework - GIN
  line: 1
---
ruleset: technology-usage
rule: logging-usage-00160
name: Embedded library - Logging Utils
description: Embedded library - Logging Utils
category:
effort: 0
labels:
- discovery
- konveyor.io/include=always
- tag=Embedded library - Logging Utils
incidents:
- file: /src/main/java/SampleFile00160.java
  message: Embedded library - Logging Utils
  line: 1
---
ruleset: technology-usage
rule: technology-usage-embedded-framework-05900
name: GIN
description: GIN
category:
effort: 0
labels:
- discovery
- konveyor.io/include=always
- tag=Embedded=GIN
incidents:
- file: /src/main/java/SampleFile05900.java
  message: GIN
  line: 1
---
ruleset: technology-usage
rule: technology-usage-connect-01000
name: Java Connect
description: Java Connect
category:
effort: 0
labels:
- discovery
- konveyor.io/include=always
- tag=Connect=RMI
incidents:
- file: /src/main/java/SampleFile01000.java
  message: Java Connect
  line: 1
---
ruleset: technology-usage
rule: javaee-technology-usage-00030
name: Java EE JSON-P
description: Java EE JSON-P
category:
effort: 0
labels:
- discovery
- konveyor.io/include=always
- tag=Java EE JSON-P
incidents:
- file: /src/main/java/SampleFile00030.java
  message: Java EE JSON-P
  line: 1
---
ruleset: technology-usage
rule: javaee-technology-usage-00031
name: Java EE JSON-P
description: Java EE JSON-P
category:
effort: 0
labels:
- discovery
- konveyor.io/include=always
- tag=Execute=Java EE JSON-P
incidents:
- file: /src/main/java/SampleFile00031.java
  message: Java EE JSON-P
  line: 1
---
ruleset: discovery-rules
rule: discover-java-files
name: Java source files
description: Java source files
category:
effort: 0
labels:
- discovery
- konveyor.io/include=always
- konveyor.io/target=discovery
- tag=Java Source
incidents:
- file: /src/main/java/SampleFile.java
  message: Java source files
  line: 1
---
ruleset: technology-usage
rule: javaee-technology-usage-00021
name: JavaEE
description: JavaEE
category:
effort: 0
labels:
- discovery
- konveyor.io/include=always
- tag=Execute=CDI
incidents:
- file: /src/main/java/SampleFile00021.java
  message: JavaEE
  line: 1
---
ruleset: technology-usage
rule: javaee-technology-usage-00020-javax
name: JavaEE javax
description: JavaEE javax
category:
effort: 0
labels:
- discovery
- konveyor.io/include=always
- tag=CDI
incidents:
- file: /src/main/java/SampleFile00020.java
  message: JavaEE javax
  line: 1
---
ruleset: technology-usage
rule: technology-usage-database-01100
name: JPA Entities
description: JPA Entities
category:
effort: 0
labels:
- discovery
- konveyor.io/include=always
- tag=Java EE=JPA entities
incidents:
- file: /src/main/java/SampleFile01100.java
  message: JPA Entities
  line: 1
---
ruleset: technology-usage
rule: technology-usage-database-01200
name: JPA Queries
description: JPA Queries
category:
effort: 0
labels:
- discovery
- konveyor.io/include=always
- tag=Java EE=JPA named queries
incidents:
- file: /src/main/java/SampleFile01200.java
  message: JPA Queries
  line: 1
---
ruleset: discovery-rules
rule: windup-discover-jpa-configuration
name: JPA XML Configuration
description: JPA XML Configuration
category:
effort: 0
labels:
- discovery
- konveyor.io/include=always
- konveyor.io/target=discovery
- tag=JPA XML
incidents:
- file: /src/main/java/SampleFile.java
  message: JPA XML Configuration
  line: 1
---
ruleset: technology-usage
rule: technology-usage-logging-000160
name: Logging Utils
description: Logging Utils
category:
effort: 0
labels:
- discovery
- konveyor.io/include=always
- tag=Embedded=Logging Utils
incidents:
- file: /src/main/java/SampleFile000160.java
  message: Logging Utils
  line: 1
---
ruleset: discovery-rules
rule: discover-maven-xml
name: Maven XML file
description: Maven XML file
category:
effort: 0
labels:
- discovery
- konveyor.io/include=always
- konveyor.io/target=discovery
- tag=Maven XML
incidents:
- file: /src/main/java/SampleFile.java
  message: Maven XML file
  line: 1
---
ruleset: technology-usage
rule: non-xml-technology-usage-02000
name: Non-XML EJB
description: Non-XML EJB
category:
effort: 0
labels:
- discovery
- konveyor.io/include=always
- tag=Bean=EJB XML
incidents:
- file: /src/main/java/SampleFile02000.java
  message: Non-XML EJB
  line: 1
---
ruleset: technology-usage
rule: non-xml-technology-usage-17000
name: Non-XML JPA
description: Non-XML JPA
category:
effort: 0
labels:
- discovery
- konveyor.io/include=always
- tag=Java EE=JPA XML
incidents:
- file: /src/main/java/SampleFile17000.java
  message: Non-XML JPA
  line: 1
---
ruleset: technology-usage
rule: technology-usage-database-01300
name: Persistence Units
description: Persistence Units
category:
effort: 0
labels:
- discovery
- konveyor.io/include=always
- tag=Java EE=Persistence units
incidents:
- file: /src/main/java/SampleFile01300.java
  message: Persistence Units
  line: 1
---
ruleset: discovery-rules
rule: windup-discover-spring-configuration
name: Spring XML Configuration
description: Spring XML Configuration
category:
effort: 0
labels:
- discovery
- konveyor.io/include=always
- konveyor.io/target=discovery
- tag=Spring XML
incidents:
- file: /src/main/java/SampleFile.java
  message: Spring XML Configuration
  line: 1
---
ruleset: discovery-rules
rule: windup-discover-web-configuration
name: Web XML Configuration
description: Web XML Configuration
category:
effort: 0
labels:
- discovery
- konveyor.io/include=always
- konveyor.io/target=discovery
- tag=Web XML
incidents:
- file: /src/main/java/SampleFile.java
  message: Web XML Configuration
  line: 1
EOF
  printf '\x1DEND-INSIGHTS\x1D\n\x1DBEGIN-DEPS\x1D\n\x1DEND-DEPS\x1D\n' >> "$file"
}

# Array to store application IDs
declare -a app_ids

# Create 2 bookserver apps with insights
for i in 0 1; do
  app_name="InsightsFilteringApp1_${i}"

  echo ""
  echo "Creating application: $app_name"

  app_response=$(curl -kSs -X POST \
    -H "Authorization: Bearer ${TOKEN}" \
    -H "Content-Type: application/json" \
    -d "{\"name\":\"${app_name}\",\"description\":\"Bookserver app for insights filtering test ${i}\"}" \
    "${host}/applications")

  app_id=$(echo $app_response | jq -r '.id')

  if [[ -z "$app_id" || "$app_id" == "null" ]]; then
    echo "ERROR: Failed to create application $app_name"
    echo "Response: $app_response"
    exit 1
  fi

  app_ids+=($app_id)
  echo "Created application: $app_name (ID: $app_id)"

  # Create manifest file
  manifest_file="/tmp/bookserver_insights_manifest_${i}.yaml"
  create_bookserver_manifest "$manifest_file"

  # Upload analysis manifest
  echo "Uploading analysis for $app_name..."
  tmp="/tmp/analysis-response-bookserver-${i}.json"
  code=$(curl -kSs -o ${tmp} -w "%{http_code}" \
    -H "Authorization: Bearer ${TOKEN}" \
    -F "file=@${manifest_file};type=application/x-yaml" \
    -H 'Accept:application/x-yaml' \
    "${host}/applications/${app_id}/analyses")

  if [ $? -ne 0 ]; then
    echo "ERROR: Failed to upload analysis for $app_name"
    exit 1
  fi

  case ${code} in
    201)
      echo "Analysis created for $app_name"
      ;;
    *)
      echo "ERROR: Analysis creation failed with code ${code}"
      cat ${tmp}
      exit 1
      ;;
  esac

  # Clean up manifest file
  rm -f "$manifest_file" "${tmp}"
done

# Create 1 coolstore app with insights
app_name="InsightsFilteringApp2_0"

echo ""
echo "Creating application: $app_name"

app_response=$(curl -kSs -X POST \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"${app_name}\",\"description\":\"Coolstore app for insights filtering test\"}" \
  "${host}/applications")

app_id=$(echo $app_response | jq -r '.id')

if [[ -z "$app_id" || "$app_id" == "null" ]]; then
  echo "ERROR: Failed to create application $app_name"
  echo "Response: $app_response"
  exit 1
fi

app_ids+=($app_id)
echo "Created application: $app_name (ID: $app_id)"

# Create manifest file
manifest_file="/tmp/coolstore_insights_manifest.yaml"
create_coolstore_manifest "$manifest_file"

# Upload analysis manifest
echo "Uploading analysis for $app_name..."
tmp="/tmp/analysis-response-coolstore.json"
code=$(curl -kSs -o ${tmp} -w "%{http_code}" \
  -H "Authorization: Bearer ${TOKEN}" \
  -F "file=@${manifest_file};type=application/x-yaml" \
  -H 'Accept:application/x-yaml' \
  "${host}/applications/${app_id}/analyses")

if [ $? -ne 0 ]; then
  echo "ERROR: Failed to upload analysis for $app_name"
  exit 1
fi

case ${code} in
  201)
    echo "Analysis created for $app_name"
    ;;
  *)
    echo "ERROR: Analysis creation failed with code ${code}"
    cat ${tmp}
    exit 1
    ;;
esac

# Clean up manifest file
rm -f "$manifest_file" "${tmp}"

echo ""
echo "================================================================"
echo "Insights seeding completed successfully!"
echo "================================================================"
echo "Created applications with IDs: ${app_ids[@]}"
echo ""
echo "Applications created:"
echo "  - InsightsFilteringApp1_0"
echo "  - InsightsFilteringApp1_1"
echo "  - InsightsFilteringApp2_0"
echo ""
