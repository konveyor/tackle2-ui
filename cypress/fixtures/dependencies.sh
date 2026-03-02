#!/bin/bash

set -e

# Script to seed dependencies data for filter_sorting_pagination.test.ts
# Creates applications with exact dependencies matching analysis.json

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

# Function to create bookserver manifest with dependencies (source_analysis_on_bookserverapp - 41 deps)
create_bookserver_manifest() {
  local file="$1"
  printf '\x1DBEGIN-MAIN\x1D\n' > "$file"
  cat >> "$file" << 'EOF'
---
commit: "bookserver123"
EOF
  printf '\x1DEND-MAIN\x1D\n\x1DBEGIN-INSIGHTS\x1D\n\x1DEND-INSIGHTS\x1D\n\x1DBEGIN-DEPS\x1D\n' >> "$file"
  cat >> "$file" << 'EOF'
---
name: ch.qos.logback.logback-classic
version: ""
sha: ""
indirect: false
provider: java
labels:
- open-source
---
name: ch.qos.logback.logback-core
version: ""
sha: ""
indirect: false
provider: java
labels:
- open-source
---
name: com.fasterxml.classmate
version: ""
sha: ""
indirect: false
provider: java
labels:
- open-source
---
name: com.fasterxml.jackson.core.jackson-annotations
version: ""
sha: ""
indirect: false
provider: java
labels:
- open-source
---
name: com.fasterxml.jackson.core.jackson-core
version: ""
sha: ""
indirect: false
provider: java
labels:
- open-source
---
name: com.fasterxml.jackson.core.jackson-databind
version: ""
sha: ""
indirect: false
provider: java
labels:
- open-source
---
name: com.fasterxml.jackson.dataformat.jackson-dataformat-xml
version: ""
sha: ""
indirect: false
provider: java
labels:
- open-source
---
name: com.fasterxml.jackson.datatype.jackson-datatype-jdk8
version: ""
sha: ""
indirect: false
provider: java
labels:
- open-source
---
name: com.fasterxml.jackson.datatype.jackson-datatype-jsr310
version: ""
sha: ""
indirect: false
provider: java
labels:
- open-source
---
name: com.fasterxml.jackson.module.jackson-module-jaxb-annotations
version: ""
sha: ""
indirect: false
provider: java
labels:
- open-source
---
name: com.fasterxml.jackson.module.jackson-module-parameter-names
version: ""
sha: ""
indirect: false
provider: java
labels:
- open-source
---
name: com.fasterxml.woodstox.woodstox-core
version: ""
sha: ""
indirect: false
provider: java
labels:
- open-source
---
name: javax.annotation.javax.annotation-api
version: ""
sha: ""
indirect: false
provider: java
labels:
- open-source
---
name: javax.validation.validation-api
version: ""
sha: ""
indirect: false
provider: java
labels:
- open-source
---
name: org.apache.logging.log4j.log4j-api
version: ""
sha: ""
indirect: false
provider: java
labels:
- open-source
---
name: org.apache.logging.log4j.log4j-to-slf4j
version: ""
sha: ""
indirect: false
provider: java
labels:
- open-source
---
name: org.apache.tomcat.embed.tomcat-embed-core
version: ""
sha: ""
indirect: false
provider: java
labels:
- open-source
---
name: org.apache.tomcat.embed.tomcat-embed-el
version: ""
sha: ""
indirect: false
provider: java
labels:
- open-source
---
name: org.apache.tomcat.embed.tomcat-embed-websocket
version: ""
sha: ""
indirect: false
provider: java
labels:
- open-source
---
name: org.codehaus.woodstox.stax2-api
version: ""
sha: ""
indirect: false
provider: java
labels:
- open-source
---
name: org.hibernate.validator.hibernate-validator
version: ""
sha: ""
indirect: false
provider: java
labels:
- open-source
---
name: org.jboss.logging.jboss-logging
version: ""
sha: ""
indirect: false
provider: java
labels:
- open-source
---
name: org.projectlombok.lombok
version: ""
sha: ""
indirect: false
provider: java
labels:
- open-source
---
name: org.slf4j.jul-to-slf4j
version: ""
sha: ""
indirect: false
provider: java
labels:
- open-source
---
name: org.slf4j.slf4j-api
version: ""
sha: ""
indirect: false
provider: java
labels:
- open-source
---
name: org.springframework.boot.spring-boot
version: ""
sha: ""
indirect: false
provider: java
labels:
- open-source
---
name: org.springframework.boot.spring-boot-autoconfigure
version: ""
sha: ""
indirect: false
provider: java
labels:
- open-source
---
name: org.springframework.boot.spring-boot-starter
version: ""
sha: ""
indirect: false
provider: java
labels:
- open-source
---
name: org.springframework.boot.spring-boot-starter-json
version: ""
sha: ""
indirect: false
provider: java
labels:
- open-source
---
name: org.springframework.boot.spring-boot-starter-logging
version: ""
sha: ""
indirect: false
provider: java
labels:
- open-source
---
name: org.springframework.boot.spring-boot-starter-tomcat
version: ""
sha: ""
indirect: false
provider: java
labels:
- open-source
---
name: org.springframework.boot.spring-boot-starter-web
version: ""
sha: ""
indirect: false
provider: java
labels:
- open-source
---
name: org.springframework.spring-aop
version: ""
sha: ""
indirect: false
provider: java
labels:
- open-source
---
name: org.springframework.spring-beans
version: ""
sha: ""
indirect: false
provider: java
labels:
- open-source
---
name: org.springframework.spring-context
version: ""
sha: ""
indirect: false
provider: java
labels:
- open-source
---
name: org.springframework.spring-core
version: ""
sha: ""
indirect: false
provider: java
labels:
- open-source
---
name: org.springframework.spring-expression
version: ""
sha: ""
indirect: false
provider: java
labels:
- open-source
---
name: org.springframework.spring-jcl
version: ""
sha: ""
indirect: false
provider: java
labels:
- open-source
---
name: org.springframework.spring-web
version: ""
sha: ""
indirect: false
provider: java
labels:
- open-source
---
name: org.springframework.spring-webmvc
version: ""
sha: ""
indirect: false
provider: java
labels:
- open-source
---
name: org.yaml.snakeyaml
version: ""
sha: ""
indirect: false
provider: java
labels:
- open-source
EOF
  printf '\x1DEND-DEPS\x1D\n' >> "$file"
}

# Function to create daytrader manifest with dependencies (source+dep_analysis_on_daytrader-app - 6 deps)
create_daytrader_manifest() {
  local file="$1"
  printf '\x1DBEGIN-MAIN\x1D\n' > "$file"
  cat >> "$file" << 'EOF'
---
commit: "daytrader456"
EOF
  printf '\x1DEND-MAIN\x1D\n\x1DBEGIN-INSIGHTS\x1D\n\x1DEND-INSIGHTS\x1D\n\x1DBEGIN-DEPS\x1D\n' >> "$file"
  cat >> "$file" << 'EOF'
---
name: javax.annotation.javax.annotation-api
version: ""
sha: ""
indirect: false
provider: java
labels:
---
name: javax.javaee-api
version: ""
sha: ""
indirect: false
provider: java
labels:
---
name: net.wasdev.wlp.sample.daytrader-ee7-ejb
version: ""
sha: ""
indirect: false
provider: java
labels:
---
name: net.wasdev.wlp.sample.daytrader-ee7-web
version: ""
sha: ""
indirect: false
provider: java
labels:
---
name: org.apache.derby.derby
version: ""
sha: ""
indirect: false
provider: java
labels:
---
name: taglibs.standard
version: ""
sha: ""
indirect: false
provider: java
labels:
EOF
  printf '\x1DEND-DEPS\x1D\n' >> "$file"
}

# Array to store application IDs
declare -a app_ids

# Create bookserver app with dependencies
app_name="DependenciesFilteringApp1"

app_response=$(curl -kSs -X POST \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"${app_name}\",\"description\":\"Bookserver app for dependencies filtering test\"}" \
  "${host}/applications")

app_id=$(echo $app_response | jq -r '.id')

if [[ -z "$app_id" || "$app_id" == "null" ]]; then
  echo "ERROR: Failed to create application $app_name"
  echo "Response: $app_response"
  exit 1
fi

app_ids+=($app_id)

manifest_file="/tmp/bookserver_deps_manifest.yaml"
create_bookserver_manifest "$manifest_file"

tmp="/tmp/analysis-response-bookserver-deps.json"
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
    ;;
  *)
    echo "ERROR: Analysis creation failed with code ${code}"
    cat ${tmp}
    exit 1
    ;;
esac

rm -f "$manifest_file" "${tmp}"

# Create daytrader app with dependencies
app_name="DependenciesFilteringApp2"

app_response=$(curl -kSs -X POST \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"${app_name}\",\"description\":\"Daytrader app for dependencies filtering test\"}" \
  "${host}/applications")

app_id=$(echo $app_response | jq -r '.id')

if [[ -z "$app_id" || "$app_id" == "null" ]]; then
  echo "ERROR: Failed to create application $app_name"
  echo "Response: $app_response"
  exit 1
fi

app_ids+=($app_id)

manifest_file="/tmp/daytrader_deps_manifest.yaml"
create_daytrader_manifest "$manifest_file"

tmp="/tmp/analysis-response-daytrader-deps.json"
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
    ;;
  *)
    echo "ERROR: Analysis creation failed with code ${code}"
    cat ${tmp}
    exit 1
    ;;
esac

rm -f "$manifest_file" "${tmp}"

echo "Dependencies seeding completed successfully!"
