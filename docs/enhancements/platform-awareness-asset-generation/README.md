# Platform Awareness and Asset Generation

## Summary

This document catalogs and describes the designs, workflows and wireframes needed to implement the
[asset generation and platform awareness](https://github.com/konveyor/enhancements/tree/master/enhancements/assets-generation)
Konveyor enhancement. In summary, the enhancement adds application runtime configuration discovery
from a source platform, and from the discovered information, provides deployment asset generation
for a target platform.

The base use case is to pull an application from a CloudFoundry instance
and generate necessary assets to deploy it to an OpenShift cluster.

> [!NOTE]
> For any bulk actions, all information required for the action should be able to
> be tagged once to the core entity being acted upon.

## Entity Catalog

|                  Entity                   | Platform Awareness |  Asset Generation  |
| :---------------------------------------: | :----------------: | :----------------: |
|        [Application](#application)        | :heavy_check_mark: | :heavy_check_mark: |
|          [Archetype](#archetype)          |        :x:         | :heavy_check_mark: |
|    [Source Platform](#source-platform)    | :heavy_check_mark: |        :x:         |
| [Discovery Manifest](#discovery-manifest) | :heavy_check_mark: | :heavy_check_mark: |
|    [Target Platform](#target-platform)    |        :x:         | :heavy_check_mark: |
|          [Generator](#generator)          |        :x:         | :heavy_check_mark: |
|         [Repository](#repository)         |        :x:         | :heavy_check_mark: |

### Application

`Application` entity changes:

- Associate to a single [Source Platform](#source-platform) for configuration discovery
- Add "Source Platform Application Coordinates" for the source platform instance defined and
  verified using [schema defined fields](#schema-defined-fields) pulled from the source platform's
  kind
- Add [Discovery Manifest](#discovery-manifest) to hold platform discovered information
- Add a target asset [repository](#repository) where generated assets will be stored

Implementation Details:

- CRUD to add:
  - Source Platform
  - Source Platform Application Coordinates
    - [schema defined fields](#schema-defined-fields) to be presented and validated by a schema
      attached to the source platform
    - When changing the source platform, the coordinates will be invalid and the values removed
  - (view only) Discovery Manifest
  - Asset Repository
- Actions:
  - Retrieve Configurations
  - Generate Assets
- Bulk Actions:
  - Choose or remove the source platform for all selected applications
  - Retrieve Configurations for all selected applications
  - :thinking: Generate Assets for all selected applications
- Views:
  - **Table page** (Location: Migration / Application inventory)
    - Column changes:
      - Make sure the configuration discovery task is included in the task popover
      - :thinking: Status icon for "discovery manifest" (not ready, ready, discovered)
      - :thinking: Status icon for "assets generated" (not ready, ready, generated)
    - Record kebab actions:
      - Retrieve Configurations
      - Generate Assets
    - Toolbar (kebab) actions:
      - Single application retrieve configurations
      - Single application generate assets
      - Multiselect application update source platform
      - Multiselect application retrieve configurations
      - :question: Multiselect application generate assets (:warning: This workflow is complicated if user input is required)
    - Selected application drawer:
      - View of source platform and source platform coordinates
      - View of discovery manifest
  - **Edit modal**
    - Add fields for each CRUD item
    - :spiral*notepad: \_Source platform coordinates* will be [schema defined fields](#schema-defined-fields)
    - :spiral*notepad: \_Discovery manifest* will need special treatment as it'll probably be a
      json/yaml document or a dictionary/map
    - :thinking: Convert the modal to a page? The modal will need to be scrolled with the
      extra fields so moving to a page may help with layout

### Archetype

`Archetype` entity changes:

- Associate to zero-or-more [Target Platforms](#target-platform)
- :question: Will target platforms have [schema defined fields](#schema-defined-fields) for archetypes
  to be used as generator inputs for all applications attached to the archetype when generating assets?

Implementation Details:

- CRUD to add:
  - Target platform
  - :question: Target platform schema defined fields
- Actions:
  - :thinking: Retrieve Configurations for all applications associated to the archetype
  - :thinking: Generate Assets for all applications associated to the archetype
- ~~Bulk Actions~~
- Views:
  - **Table page** (Location: Migration / Archetypes)
    - New columns:
      - Count of Target Platforms
    - Record kebab actions:
      - :thinking: Retrieve Configurations for X Applications
      - :thinking: Generate Assets for X Applications
    - ~~Toolbar (kebab) actions~~
    - Selected item drawer:
      - View of the archetype's associated target platforms
  - **Edit modal**
    - Associate to zero-or-more target platforms
    - :thinking: Create a new target platform on the page?
    - :thinking: Covert the edit modal to a page?

### Source Platform

`SourcePlatform` is a new entity:

- Each source platform represents an instance of a platform type's platform coordinates
- Each source platform type maps to a **discovery provider addon** defined in the operator
  - The HUB rest endpoint takes care of collecting all of the necessary data and will provide
    the UI with a normalized set of source platform types
  - Each source platform backing discovery provider should also provide 2 sets of
    [schema defined fields](#schema-defined-fields):
    - **Platform coordinates schema** - Data to be stored with the source platform instance as the
      information needed to connect to the platform
    - **Application coordinates schema** - Data to be stored with an individual application as the
      information needed to connect to a specific application on its associated source platform
      instance
- Associated to one-or-more [Application](#application)s for configuration discovery
- Base Data:
  - Name
  - Source platform type (based on available discovery providers rest endpoint)
  - Platform coordinates from the platform type's platform coordinates schema
  - Platform connection credentials

Implementation Details:

- CRUD:
  - Add a new page: Administration / Source Platforms
  - Page will be a general table view with add/edit modal
  - When changing the source platform type, the platform coordinates will be invalid and the values removed
- Actions:
  - Edit
  - Delete
  - Discover applications (:warning: complex workflow but could pattern after the CSV import functionality)
- ~~Bulk Actions~~
- Views:
  - **Table page** (Location: Administration / Source Platforms)
    - Columns:
      - Name
      - Provider Type
      - Credentials Attached?
      - :thinking: Count of associated applications
    - Record kebab actions:
      - Edit
      - Delete
      - Discover applications
    - Toolbar (kebab) actions:
      - Create
    - Selected item drawer:
      - Base information
      - View of the platform coordinates
      - :question: View of the application coordinates schema
  - **Edit modal**
    - Name input
    - Provider Type dropdown
    - Credentials dropdown (include "None" as an option)
    - :thinking: Include a way to create the credentials if they don't already exist?
    - Expandable Section that is dynamic based on the provider type additional information schema

### Discovery Manifest

`DiscoveryManifest` is a new entity:

- Holds the platform and runtime information discovered for an application from a single
  source platform as a YAML document or key/value pair dictionary
  - Contents are read-only to the user
  - :thinking: If a YAML schema is available, it can be applied to the document viewer
  - :question: Document format is constant across all provider types
  - :question: Keep a history over multiple discovery task runs?
  - :question: Could this just be a normal file attachment?
- One-to-one mapping to an Application

Implementation Details:

- ~~CRUD to add~~
- ~~Actions~~
- ~~Bulk Actions~~
- Views:
  - Read-only for the user
  - Only accessible as part of an Application, therefore only viewable as part of the
    application views
  - :thinking: May be best to display in a modal accessed from the row actions or the detail drawer

### Generator

`Generator` is a new entity:

- A generator associates a **generator type** (i.e. templating engine) with a set of template files
- Initially the only generator type is Helm
- Keep a list of **variables** (key + value) in the generator to be passed to the generator task
- Allow definition of a set of **parameters** needed from other entities in the system when
  generating assets with this generator (could be as [schema defined fields](#schema-defined-fields))
- Base data:
  - Name
  - Icon
  - Generator Type (based on available generator providers rest endpoint?)
  - Description
  - Template [repository](#repository)
  - Variables (set of key/value pairs)
  - Parameter definitions

Implementation Details:

- CRUD to add:
  - Add a new page: Administration / Generators
  - Page will be a general table view with add/edit modal
- Actions:
- Bulk Actions:
- Views:
  - **Table page** (Location: Administration / Generators)
    - Columns:
      - Name
      - :question: Icon
      - Generator Type
      - Description
      - Template repository id (with link)
      - Variables count
      - :thinking: Parameter definition summary (number of fields with popover?)
    - Record kebab actions:
      - Edit
      - Delete
    - Toolbar (kebab) actions:
      - Bulk Delete
    - Selected item drawer:
      - Base information
  - **Edit modal**

### Target Platform

`TargetPlatform` is a new entity:

- ...

Implementation Details:

- CRUD to add:
- Actions:
- Bulk Actions:
- Views:
  - **Table page** (Location: Migration / Archetypes)
    - Record kebab actions:
    - Toolbar (kebab) actions:
    - Selected item drawer:
  - **Edit modal**

### Repository

> [!CAUTION]
> This entity as a first class entity is optional. It is a nice to have to be able to ref link
> an entity to as many repository definitions as needed and/or share repositories between entities
> as needed.

<details>
<summary>Adding this entity is optional as an implementation detail</summary>

`Repository` is a new entity:

- Describes a location in SCM
- Base data:
  - Name
  - Type (git, svn)
  - URL
  - branch -- for git, this could be any commitish (branch, tag, commit id)
  - path
  - credentials (all repos need read permission, only some will need write/push permissions)

Implementation Details:

- CRUD to add:
  - Add a new page: Migration / Repositories
  - Page will be a general table view with add/edit modal
  - :spiral_notepad: Current inline on a lot of forms, so would need to allow selection, add, edit
    inline with those forms
  - :warning: Administration / Repositories already exists as a way to configure how git, subversion
    and maven repositories are handled. That page's existence will need to be reconciled with the new
    repository instance pages.
- Actions:
  - Edit
  - Delete
  - :question: Test connection
- Bulk Actions:
  - Change the credentials for all selected repositories
- Views:
  - **Table page** (Location: Migration / Repositories)
    - Columns
      - Name
      - Type
      - URL
      - branch
      - path
      - credentials (exists icon and/or credential id)
    - Record kebab actions:
      - Edit
      - :question: Test connection
      - Delete
    - Toolbar (kebab) actions:
      - Bulk Delete
      - Change the credentials for all selected repositories
    - Selected item drawer:
      - Base information
      - :question: Test connection
  - **Edit modal** - Name input - Type select - URL input with validation

</details>

## Workflow Catalog

| Workflows                                                                                    |
| :------------------------------------------------------------------------------------------- |
| Manage source platforms                                                                      |
| Associate an application with a source platform                                              |
| Retrieve configurations for an application from its source platform (via coordinates schema) |
| Discover and import a set of applications from a source platform (via discovery schema)      |
| Manage generator templates                                                                   |
| Manage target platforms (as a collection of ordered generators)                              |
| Associate an archetype with a set of target platforms                                        |
| Generate assets for an applications + archetype + target platform selection                  |

...

## Schema defined fields

In a few places, the set of fields that are required for an entity will vary and depend on the
selection of a related entity. Once the related entity is selected, the set of fields to capture
can be defined by an attached schema. For example, an [Application](#application) will need to
capture and store a set of platform coordinates once a [Source Platform](#source-platform) has
been selected.

### Schema

An example of how schemas and UI handling could work is how configuration fields are
managed in vscode extensions. It uses [json-schema](https://json-schema.org/) at its core.

- [sample extension](https://github.com/microsoft/vscode-extension-samples/tree/main/configuration-sample)
- [configuration contribution point](https://code.visualstudio.com/api/references/contribution-points#contributes.configuration)

The schema definition does not need to be complicated, just basic variability is needed:

- field name
- field label
- field type (text input, static select list)
- required?
- validation to apply (basic things that yup can easily support)
  - min length
  - alpha only
  - numeric only
  - URL format
  - regex?

For example, an application's source platform may require a "space" and "application name" field
and they both need at least 3 characters. The schema could look like:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://konveyor.io/platform-application-coordinates.schema.json",
  "title": "Platform Application Coordinates",
  "description": "The information needed per application for this platform's configuration discovery",
  "type": "object",
  "required": ["space", "application-name"],
  "properties": {
    "space": {
      "description": "Name of the space where the application is deployed",
      "type": "string",
      "minLength": 3
    },
    "application-name": {
      "description": "Deployed name of the application in the space",
      "type": "string",
      "minLength": 3
    }
  }
}
```

### UI Render

For the UI, the schema defined fields can either drive a json editor with the a json-schema applied,
or drive a dynamic form built from the json-schema and rendered as Patternfly components.

- Document editor: Use the `@patternfly/react-code-editor` with the schema applied and only allow
  saving when the document is schema valid. Any kind of document complexity would be allowed.

- Dynamic form: Use a json-schema package to iterate over the fields and render `@patternfly/react-core`
  components with json-schema validations applied. Only a subset of json-schema would be able to
  be supported along the lines of when the vscode config editor handles. Complex objects would not
  be allowed.

### Storage

Storing the fields and values is dependent on how the REST model allows storage. Some options:

- Attaching a file that is the json or yaml version of the document
- Attaching the fields as key/value pairs (a dictionary, Map, Record<>, or similar) directly to
  the entity
