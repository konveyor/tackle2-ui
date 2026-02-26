#!/bin/bash

set -e

# Script to seed issues data for filter_sorting_pagination.test.ts
# Creates applications with exact issues matching analysis.json

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

# Get existing tags
echo "Getting existing tags..."
tags_response=$(curl -kSs -X GET \
  -H "Authorization: Bearer ${TOKEN}" \
  "${host}/tags")

# Find "EJB XML" tag
tag1_id=$(echo $tags_response | jq -r '[.[] | select(.name=="EJB XML")] | first | .id // empty')
tag1_name="EJB XML"

if [[ -z "$tag1_id" || "$tag1_id" == "null" ]]; then
  echo "ERROR: Tag 'EJB XML' not found"
  exit 1
fi

# Find "Entity Bean" tag
tag2_id=$(echo $tags_response | jq -r '[.[] | select(.name=="Entity Bean")] | first | .id // empty')
tag2_name="Entity Bean"

if [[ -z "$tag2_id" || "$tag2_id" == "null" ]]; then
  echo "ERROR: Tag 'Entity Bean' not found"
  exit 1
fi

echo "Using existing tags:"
echo "  Tag 1: $tag1_name (ID: $tag1_id)"
echo "  Tag 2: $tag2_name (ID: $tag2_id)"

# Get or create stakeholders
echo ""
echo "Getting or creating stakeholders..."

# Check if stakeholders already exist
sh_list=$(curl -kSs -X GET \
  -H "Authorization: Bearer ${TOKEN}" \
  "${host}/stakeholders")
sh1_id=$(echo $sh_list | jq -r '.[] | select(.email=="stakeholder1@issues.test") | .id // empty')

if [[ -z "$sh1_id" || "$sh1_id" == "null" ]]; then
  echo "Creating stakeholder 1..."
  sh1_response=$(curl -kSs -X POST \
    -H "Authorization: Bearer ${TOKEN}" \
    -H "Content-Type: application/json" \
    -d '{"email":"stakeholder1@issues.test","name":"Issues Stakeholder 1"}' \
    "${host}/stakeholders")
  sh1_id=$(echo $sh1_response | jq -r '.id')

  if [[ -z "$sh1_id" || "$sh1_id" == "null" ]]; then
    echo "ERROR: Failed to create stakeholder 1"
    echo "Response: $sh1_response"
    exit 1
  fi
else
  echo "Using existing stakeholder 1"
fi

sh2_id=$(echo $sh_list | jq -r '.[] | select(.email=="stakeholder2@issues.test") | .id // empty')

if [[ -z "$sh2_id" || "$sh2_id" == "null" ]]; then
  echo "Creating stakeholder 2..."
  sh2_response=$(curl -kSs -X POST \
    -H "Authorization: Bearer ${TOKEN}" \
    -H "Content-Type: application/json" \
    -d '{"email":"stakeholder2@issues.test","name":"Issues Stakeholder 2"}' \
    "${host}/stakeholders")
  sh2_id=$(echo $sh2_response | jq -r '.id')

  if [[ -z "$sh2_id" || "$sh2_id" == "null" ]]; then
    echo "ERROR: Failed to create stakeholder 2"
    echo "Response: $sh2_response"
    exit 1
  fi
else
  echo "Using existing stakeholder 2"
fi

echo "Stakeholder 1 ID: $sh1_id"
echo "Stakeholder 2 ID: $sh2_id"

# Get or create stakeholder groups
echo ""
echo "Getting or creating stakeholder groups..."

# Check if stakeholder groups already exist
shg_list=$(curl -kSs -X GET \
  -H "Authorization: Bearer ${TOKEN}" \
  "${host}/stakeholdergroups")
shg1_id=$(echo $shg_list | jq -r '.[] | select(.name=="Issues StakeholderGroup 1") | .id // empty')

if [[ -z "$shg1_id" || "$shg1_id" == "null" ]]; then
  echo "Creating stakeholder group 1..."
  shg1_response=$(curl -kSs -X POST \
    -H "Authorization: Bearer ${TOKEN}" \
    -H "Content-Type: application/json" \
    -d '{"name":"Issues StakeholderGroup 1","description":"Group 1"}' \
    "${host}/stakeholdergroups")
  shg1_id=$(echo $shg1_response | jq -r '.id')

  if [[ -z "$shg1_id" || "$shg1_id" == "null" ]]; then
    echo "ERROR: Failed to create stakeholder group 1"
    echo "Response: $shg1_response"
    exit 1
  fi
else
  echo "Using existing stakeholder group 1"
fi

shg2_id=$(echo $shg_list | jq -r '.[] | select(.name=="Issues StakeholderGroup 2") | .id // empty')

if [[ -z "$shg2_id" || "$shg2_id" == "null" ]]; then
  echo "Creating stakeholder group 2..."
  shg2_response=$(curl -kSs -X POST \
    -H "Authorization: Bearer ${TOKEN}" \
    -H "Content-Type: application/json" \
    -d '{"name":"Issues StakeholderGroup 2","description":"Group 2"}' \
    "${host}/stakeholdergroups")
  shg2_id=$(echo $shg2_response | jq -r '.id')

  if [[ -z "$shg2_id" || "$shg2_id" == "null" ]]; then
    echo "ERROR: Failed to create stakeholder group 2"
    echo "Response: $shg2_response"
    exit 1
  fi
else
  echo "Using existing stakeholder group 2"
fi

echo "Stakeholder Group 1 ID: $shg1_id"
echo "Stakeholder Group 2 ID: $shg2_id"

# Get or create business services
echo ""
echo "Getting or creating business services..."

# Check if BookServer Business Service already exists
bs_list=$(curl -kSs -X GET \
  -H "Authorization: Bearer ${TOKEN}" \
  "${host}/businessservices")
bs1_id=$(echo $bs_list | jq -r '.[] | select(.name=="BookServer Business Service") | .id // empty')

if [[ -z "$bs1_id" || "$bs1_id" == "null" ]]; then
  echo "Creating BookServer Business Service..."
  bs1_response=$(curl -kSs -X POST \
    -H "Authorization: Bearer ${TOKEN}" \
    -H "Content-Type: application/json" \
    -d '{"name":"BookServer Business Service","description":"Business service for bookserver apps"}' \
    "${host}/businessservices")
  bs1_id=$(echo $bs1_response | jq -r '.id')

  if [[ -z "$bs1_id" || "$bs1_id" == "null" ]]; then
    echo "ERROR: Failed to create business service 1"
    echo "Response: $bs1_response"
    exit 1
  fi
else
  echo "Using existing BookServer Business Service"
fi

# Check if Coolstore Business Service already exists
bs2_id=$(echo $bs_list | jq -r '.[] | select(.name=="Coolstore Business Service") | .id // empty')

if [[ -z "$bs2_id" || "$bs2_id" == "null" ]]; then
  echo "Creating Coolstore Business Service..."
  bs2_response=$(curl -kSs -X POST \
    -H "Authorization: Bearer ${TOKEN}" \
    -H "Content-Type: application/json" \
    -d '{"name":"Coolstore Business Service","description":"Business service for coolstore app"}' \
    "${host}/businessservices")
  bs2_id=$(echo $bs2_response | jq -r '.id')

  if [[ -z "$bs2_id" || "$bs2_id" == "null" ]]; then
    echo "ERROR: Failed to create business service 2"
    echo "Response: $bs2_response"
    exit 1
  fi
else
  echo "Using existing Coolstore Business Service"
fi

echo "Business Service 1 ID: $bs1_id"
echo "Business Service 2 ID: $bs2_id"

# Get or create archetype
echo ""
echo "Getting or creating archetype..."

# Check if archetype already exists
archetype_list=$(curl -kSs -X GET \
  -H "Authorization: Bearer ${TOKEN}" \
  "${host}/archetypes")
archetype_id=$(echo $archetype_list | jq -r '.[] | select(.name=="IssuesArchetype") | .id // empty')
archetype_name="IssuesArchetype"

if [[ -z "$archetype_id" || "$archetype_id" == "null" ]]; then
  echo "Creating archetype..."
  archetype_response=$(curl -kSs -X POST \
    -H "Authorization: Bearer ${TOKEN}" \
    -H "Content-Type: application/json" \
    -d "{\"name\":\"IssuesArchetype\",\"description\":\"Archetype for issues tests\",\"criteria\":[{\"id\":${tag1_id}}],\"tags\":[{\"id\":${tag2_id}}],\"stakeholders\":[{\"id\":${sh1_id}},{\"id\":${sh2_id}}],\"stakeholderGroups\":[{\"id\":${shg1_id}},{\"id\":${shg2_id}}]}" \
    "${host}/archetypes")
  archetype_id=$(echo $archetype_response | jq -r '.id')

  if [[ -z "$archetype_id" || "$archetype_id" == "null" ]]; then
    echo "ERROR: Failed to create archetype"
    echo "Response: $archetype_response"
    exit 1
  fi
else
  echo "Using existing archetype"
fi

echo "Archetype: $archetype_name (ID: $archetype_id)"

# Function to create bookserver manifest matching source_analysis_on_bookserverapp
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
ruleset: quarkus/springboot
rule: javaee-pom-to-quarkus-00060
name: Add Maven profile to run the Quarkus native build
description: Add Maven profile to run the Quarkus native build
category: mandatory
effort: 1
labels:
- konveyor.io/source=java-ee
- konveyor.io/target=quarkus
incidents:
- file: /pom.xml
  message: Add Maven profile to run the Quarkus native build
  line: 1
---
ruleset: quarkus/springboot
rule: javaee-pom-to-quarkus-00030
name: Adopt Maven Compiler plugin
description: Adopt Maven Compiler plugin
category: mandatory
effort: 1
labels:
- konveyor.io/source=java-ee
- konveyor.io/target=quarkus
incidents:
- file: /pom.xml
  message: Adopt Maven Compiler plugin
  line: 10
---
ruleset: quarkus/springboot
rule: javaee-pom-to-quarkus-00050
name: Adopt Maven Failsafe plugin
description: Adopt Maven Failsafe plugin
category: mandatory
effort: 1
labels:
- konveyor.io/source=java-ee
- konveyor.io/target=quarkus
incidents:
- file: /pom.xml
  message: Adopt Maven Failsafe plugin
  line: 20
---
ruleset: quarkus/springboot
rule: javaee-pom-to-quarkus-00040
name: Adopt Maven Surefire plugin
description: Adopt Maven Surefire plugin
category: mandatory
effort: 1
labels:
- konveyor.io/source=java-ee
- konveyor.io/target=quarkus
incidents:
- file: /pom.xml
  message: Adopt Maven Surefire plugin
  line: 30
---
ruleset: quarkus/springboot
rule: javaee-pom-to-quarkus-00010
name: Adopt Quarkus BOM
description: Adopt Quarkus BOM
category: mandatory
effort: 1
labels:
- konveyor.io/source=java-ee
- konveyor.io/target=quarkus
incidents:
- file: /pom.xml
  message: Adopt Quarkus BOM
  line: 40
---
ruleset: quarkus/springboot
rule: javaee-pom-to-quarkus-00020
name: Adopt Quarkus Maven plugin
description: Adopt Quarkus Maven plugin
category: mandatory
effort: 1
labels:
- konveyor.io/source=java-ee
- konveyor.io/target=quarkus
incidents:
- file: /pom.xml
  message: Adopt Quarkus Maven plugin
  line: 50
---
ruleset: cloud-readiness
rule: local-storage-00001
name: File system - Java IO
description: File system - Java IO
category: mandatory
effort: 1
labels:
- konveyor.io/source
- konveyor.io/target=cloud-readiness
- storage
incidents:
- file: /src/main/java/FileIO.java
  message: File system - Java IO
  line: 15
- file: /src/main/java/FileIO.java
  message: File system - Java IO
  line: 25
- file: /src/main/java/FileIO.java
  message: File system - Java IO
  line: 35
- file: /src/main/java/FileIO.java
  message: File system - Java IO
  line: 45
---
ruleset: quarkus/springboot
rule: springboot-annotations-to-quarkus-00000
name: Remove the SpringBoot @SpringBootApplication annotation
description: Remove the SpringBoot @SpringBootApplication annotation
category: mandatory
effort: 1
labels:
- konveyor.io/source=springboot
- konveyor.io/target=quarkus
incidents:
- file: /src/main/java/Application.java
  message: Remove the SpringBoot @SpringBootApplication annotation
  line: 10
---
ruleset: quarkus/springboot
rule: springboot-plugins-to-quarkus-0000
name: Replace the spring-boot-maven-plugin dependency
description: Replace the spring-boot-maven-plugin dependency
category: mandatory
effort: 1
labels:
- konveyor.io/source=springboot
- konveyor.io/target=quarkus
incidents:
- file: /pom.xml
  message: Replace the spring-boot-maven-plugin dependency
  line: 60
EOF
  printf '\x1DEND-INSIGHTS\x1D\n\x1DBEGIN-DEPS\x1D\n\x1DEND-DEPS\x1D\n' >> "$file"
}

# Function to create coolstore manifest matching source+dep_on_coolStore_app
create_coolstore_manifest() {
  local file="$1"
  printf '\x1DBEGIN-MAIN\x1D\n' > "$file"
  cat >> "$file" << 'EOF'
---
commit: "1234"
EOF
  printf '\x1DEND-MAIN\x1D\n\x1DBEGIN-INSIGHTS\x1D\n' >> "$file"
  cat >> "$file" << 'EOF'
---
ruleset: quarkus/springboot
rule: jms-to-reactive-quarkus-00010
name: "@MessageDriven - EJBs are not supported"
description: "@MessageDriven - EJBs are not supported"
category: mandatory
effort: 3
labels:
- konveyor.io/source=java-ee
- konveyor.io/target=quarkus
incidents:
- file: /src/main/java/OrderService.java
  message: "@MessageDriven - EJBs are not supported"
  line: 20
---
ruleset: quarkus/springboot
rule: persistence-to-quarkus-00011
name: "@Produces cannot annotate an EntityManager"
description: "@Produces cannot annotate an EntityManager"
category: potential
effort: 1
labels:
- konveyor.io/source=jakarta-ee
- konveyor.io/target=quarkus
incidents:
- file: /src/main/java/EntityProducer.java
  message: "@Produces cannot annotate an EntityManager"
  line: 15
---
ruleset: quarkus/springboot
rule: ee-to-quarkus-00010
name: "@Stateful annotation must be replaced"
description: "@Stateful annotation must be replaced"
category: mandatory
effort: 3
labels:
- konveyor.io/source=jakarta-ee
- konveyor.io/target=quarkus
incidents:
- file: /src/main/java/ShoppingCart.java
  message: "@Stateful annotation must be replaced"
  line: 12
---
ruleset: quarkus/springboot
rule: ee-to-quarkus-00000
name: "@Stateless annotation must be replaced"
description: "@Stateless annotation must be replaced"
category: potential
effort: 1
labels:
- konveyor.io/source=jakarta-ee
- konveyor.io/target=quarkus
incidents:
- file: /src/main/java/CatalogService.java
  message: "@Stateless annotation must be replaced"
  line: 10
---
ruleset: quarkus/springboot
rule: cdi-to-quarkus-00030
name: "`beans.xml` descriptor content is ignored"
description: "`beans.xml` descriptor content is ignored"
category: potential
effort: 3
labels:
- konveyor.io/source=java-ee
- konveyor.io/target=quarkus
incidents:
- file: /src/main/webapp/WEB-INF/beans.xml
  message: "`beans.xml` descriptor content is ignored"
  line: 1
---
ruleset: quarkus/springboot
rule: javaee-pom-to-quarkus-00060
name: Add Maven profile to run the Quarkus native build
description: Add Maven profile to run the Quarkus native build
category: mandatory
effort: 1
labels:
- konveyor.io/source=java-ee
- konveyor.io/target=quarkus
incidents:
- file: /pom.xml
  message: Add Maven profile to run the Quarkus native build
  line: 1
---
ruleset: quarkus/springboot
rule: javaee-pom-to-quarkus-00030
name: Adopt Maven Compiler plugin
description: Adopt Maven Compiler plugin
category: mandatory
effort: 1
labels:
- konveyor.io/source=java-ee
- konveyor.io/target=quarkus
incidents:
- file: /pom.xml
  message: Adopt Maven Compiler plugin
  line: 10
---
ruleset: quarkus/springboot
rule: javaee-pom-to-quarkus-00050
name: Adopt Maven Failsafe plugin
description: Adopt Maven Failsafe plugin
category: mandatory
effort: 1
labels:
- konveyor.io/source=java-ee
- konveyor.io/target=quarkus
incidents:
- file: /pom.xml
  message: Adopt Maven Failsafe plugin
  line: 20
---
ruleset: quarkus/springboot
rule: javaee-pom-to-quarkus-00040
name: Adopt Maven Surefire plugin
description: Adopt Maven Surefire plugin
category: mandatory
effort: 1
labels:
- konveyor.io/source=java-ee
- konveyor.io/target=quarkus
incidents:
- file: /pom.xml
  message: Adopt Maven Surefire plugin
  line: 30
---
ruleset: quarkus/springboot
rule: javaee-pom-to-quarkus-00010
name: Adopt Quarkus BOM
description: Adopt Quarkus BOM
category: mandatory
effort: 1
labels:
- konveyor.io/source=java-ee
- konveyor.io/target=quarkus
incidents:
- file: /pom.xml
  message: Adopt Quarkus BOM
  line: 40
---
ruleset: quarkus/springboot
rule: javaee-pom-to-quarkus-00020
name: Adopt Quarkus Maven plugin
description: Adopt Quarkus Maven plugin
category: mandatory
effort: 1
labels:
- konveyor.io/source=java-ee
- konveyor.io/target=quarkus
incidents:
- file: /pom.xml
  message: Adopt Quarkus Maven plugin
  line: 50
---
ruleset: quarkus/springboot
rule: jms-to-reactive-quarkus-00020
name: Configure message listener method with @Incoming
description: Configure message listener method with @Incoming
category: mandatory
effort: 3
labels:
- konveyor.io/source=java-ee
- konveyor.io/target=quarkus
incidents:
- file: /src/main/java/OrderListener.java
  message: Configure message listener method with @Incoming
  line: 25
---
ruleset: quarkus/springboot
rule: session-00000
name: HTTP session replication (distributable web.xml)
description: HTTP session replication (distributable web.xml)
category: mandatory
effort: 3
labels:
- konveyor.io/source=java
- konveyor.io/target=cloud-readiness
incidents:
- file: /src/main/webapp/WEB-INF/web.xml
  message: HTTP session replication (distributable web.xml)
  line: 8
---
ruleset: quarkus/springboot
rule: hibernate-00005
name: Implicit name determination for sequences and tables associated with identifier generation has changed
description: Implicit name determination for sequences and tables associated with identifier generation has changed
category: potential
effort: 3
labels:
- konveyor.io/target=eap
incidents:
- file: /src/main/java/Product.java
  message: Implicit name determination for sequences and tables associated with identifier generation has changed
  line: 18
---
ruleset: quarkus/springboot
rule: jaxrs-to-quarkus-00020
name: JAX-RS activation is no longer necessary
description: JAX-RS activation is no longer necessary
category: optional
effort: 1
labels:
- konveyor.io/source=java-ee
- konveyor.io/target=quarkus
incidents:
- file: /src/main/java/RestApplication.java
  message: JAX-RS activation is no longer necessary
  line: 5
---
ruleset: quarkus/springboot
rule: jms-to-reactive-quarkus-00050
name: JMS is not supported in Quarkus
description: JMS is not supported in Quarkus
category: mandatory
effort: 5
labels:
- konveyor.io/source=java-ee
- konveyor.io/target=quarkus
incidents:
- file: /src/main/java/MessageProducer.java
  message: JMS is not supported in Quarkus
  line: 30
---
ruleset: quarkus/springboot
rule: jms-to-reactive-quarkus-00040
name: JMS' Topic must be replaced with an Emitter
description: JMS' Topic must be replaced with an Emitter
category: mandatory
effort: 3
labels:
- konveyor.io/source=java-ee
- konveyor.io/target=quarkus
incidents:
- file: /src/main/java/TopicPublisher.java
  message: JMS' Topic must be replaced with an Emitter
  line: 22
---
ruleset: quarkus/springboot
rule: persistence-to-quarkus-00000
name: Move persistence config to a properties file
description: Move persistence config to a properties file
category: optional
effort: 1
labels:
- konveyor.io/source=jakarta-ee
- konveyor.io/target=quarkus
incidents:
- file: /src/main/resources/META-INF/persistence.xml
  message: Move persistence config to a properties file
  line: 1
---
ruleset: quarkus/springboot
rule: cdi-to-quarkus-00040
name: "@Produces annotation no longer required"
description: "@Produces annotation no longer required"
category: potential
effort: 1
labels:
- konveyor.io/source=java-ee
- konveyor.io/target=quarkus
incidents:
- file: /src/main/java/Producers.java
  message: "@Produces annotation no longer required"
  line: 14
---
ruleset: quarkus/springboot
rule: remote-ejb-to-quarkus-00000
name: Remote EJBs are not supported in Quarkus
description: Remote EJBs are not supported in Quarkus
category: mandatory
effort: 1
labels:
- konveyor.io/source=jakarta-ee
- konveyor.io/target=quarkus
incidents:
- file: /src/main/java/RemoteService.java
  message: Remote EJBs are not supported in Quarkus
  line: 8
---
ruleset: quarkus/springboot
rule: javaee-pom-to-quarkus-00000
name: The expected project artifact's extension is `jar`
description: The expected project artifact's extension is `jar`
category: mandatory
effort: 1
labels:
- konveyor.io/source=java-ee
- konveyor.io/target=quarkus
incidents:
- file: /pom.xml
  message: The expected project artifact's extension is `jar`
  line: 5
EOF
  printf '\x1DEND-INSIGHTS\x1D\n\x1DBEGIN-DEPS\x1D\n\x1DEND-DEPS\x1D\n' >> "$file"
}

# Array to store application IDs
declare -a app_ids

# Get or create 3 bookserver applications
echo ""
echo "Getting or creating bookserver applications..."

# Get existing applications
apps_list=$(curl -kSs -X GET \
  -H "Authorization: Bearer ${TOKEN}" \
  "${host}/applications")

for i in {0..2}; do
  app_name="IssuesFilteringApp1_${i}"

  # Check if application already exists
  app_id=$(echo $apps_list | jq -r ".[] | select(.name==\"${app_name}\") | .id // empty")

  if [[ -z "$app_id" || "$app_id" == "null" ]]; then
    echo "Creating application: ${app_name}..."
    app_response=$(curl -kSs -X POST \
      -H "Authorization: Bearer ${TOKEN}" \
      -H "Content-Type: application/json" \
      -d "{\"name\":\"${app_name}\",\"businessService\":{\"id\":${bs1_id}}}" \
      "${host}/applications")

    app_id=$(echo $app_response | jq -r '.id')

    if [[ -z "$app_id" || "$app_id" == "null" ]]; then
      echo "  ERROR: Failed to create application ${app_name}"
      echo "  Response: $app_response"
      exit 1
    fi

    echo "Created application: ${app_name} (ID: ${app_id})"

    # Create and upload manifest for bookserver app
    manifest_file="/tmp/manifest-bookserver-${i}.yaml"
    create_bookserver_manifest "$manifest_file"

    echo "  Uploading analysis for ${app_name}..."
    tmp="/tmp/analysis-response-${i}.json"
    code=$(curl -kSs -o ${tmp} -w "%{http_code}" \
      -H "Authorization: Bearer ${TOKEN}" \
      -F "file=@${manifest_file};type=application/x-yaml" \
      -H 'Accept:application/x-yaml' \
      "${host}/applications/${app_id}/analyses")

    if [ $? -ne 0 ]; then
      echo "  ERROR: Failed to upload analysis for ${app_name}"
      exit 1
    fi

    case ${code} in
      201)
        echo "  Analysis created for ${app_name}"
        ;;
      *)
        echo "  ERROR: Analysis creation failed with code ${code}"
        cat ${tmp}
        exit 1
        ;;
    esac

    rm -f "$manifest_file" "$tmp"
  else
    echo "Using existing application: ${app_name} (ID: ${app_id})"
  fi

  app_ids+=($app_id)
done

# Get or create 1 coolstore application
echo ""
echo "Getting or creating coolstore application..."
app_name="IssuesFilteringApp2_0"

# Check if application already exists
app_id=$(echo $apps_list | jq -r ".[] | select(.name==\"${app_name}\") | .id // empty")

if [[ -z "$app_id" || "$app_id" == "null" ]]; then
  echo "Creating application: ${app_name}..."
  app_response=$(curl -kSs -X POST \
    -H "Authorization: Bearer ${TOKEN}" \
    -H "Content-Type: application/json" \
    -d "{\"name\":\"${app_name}\",\"businessService\":{\"id\":${bs2_id}},\"tags\":[{\"id\":${tag1_id}},{\"id\":${tag2_id}}]}" \
    "${host}/applications")

  app_id=$(echo $app_response | jq -r '.id')

  if [[ -z "$app_id" || "$app_id" == "null" ]]; then
    echo "  ERROR: Failed to create application ${app_name}"
    echo "  Response: $app_response"
    exit 1
  fi

  echo "Created application: ${app_name} (ID: ${app_id})"

  # Create and upload manifest for coolstore app
  manifest_file="/tmp/manifest-coolstore.yaml"
  create_coolstore_manifest "$manifest_file"

  echo "  Uploading analysis for ${app_name}..."
  tmp="/tmp/analysis-response-coolstore.json"
  code=$(curl -kSs -o ${tmp} -w "%{http_code}" \
    -H "Authorization: Bearer ${TOKEN}" \
    -F "file=@${manifest_file};type=application/x-yaml" \
    -H 'Accept:application/x-yaml' \
    "${host}/applications/${app_id}/analyses")

  if [ $? -ne 0 ]; then
    echo "  ERROR: Failed to upload analysis for ${app_name}"
    exit 1
  fi

  case ${code} in
    201)
      echo "  Analysis created for ${app_name}"
      ;;
    *)
      echo "  ERROR: Analysis creation failed with code ${code}"
      cat ${tmp}
      exit 1
      ;;
  esac

  rm -f "$manifest_file" "$tmp"
else
  echo "Using existing application: ${app_name} (ID: ${app_id})"
fi

app_ids+=($app_id)

echo ""
echo "===================================="
echo "Issues seeding completed successfully!"
echo "===================================="
echo ""
echo "Created resources:"
echo "  Tags (existing):"
echo "    - ${tag1_name} (ID: ${tag1_id})"
echo "    - ${tag2_name} (ID: ${tag2_id})"
echo "  Stakeholders (created):"
echo "    - Issues Stakeholder 1 (ID: ${sh1_id})"
echo "    - Issues Stakeholder 2 (ID: ${sh2_id})"
echo "  Stakeholder Groups (created):"
echo "    - Issues StakeholderGroup 1 (ID: ${shg1_id})"
echo "    - Issues StakeholderGroup 2 (ID: ${shg2_id})"
echo "  Business Services (created):"
echo "    - BookServer Business Service (ID: ${bs1_id})"
echo "    - Coolstore Business Service (ID: ${bs2_id})"
echo "  Archetype (created):"
echo "    - ${archetype_name} (ID: ${archetype_id})"
echo ""
echo "Created ${#app_ids[@]} applications with analysis:"
for id in "${app_ids[@]}"; do
  echo "  - Application ID: $id"
done
echo ""
echo "Application details:"
echo "  - IssuesFilteringApp1_0, 1_1, 1_2:"
echo "      9 issues (source_analysis_on_bookserverapp)"
echo "      Business service: BookServer Business Service"
echo "  - IssuesFilteringApp2_0:"
echo "      21 issues (source+dep_on_coolStore_app)"
echo "      Business service: Coolstore Business Service"
echo "      Tags: ${tag1_name}, ${tag2_name}"
echo "      Archetype: ${archetype_name} (via tag association)"
echo ""
echo "You can now run filter_sorting_pagination.test.ts"
