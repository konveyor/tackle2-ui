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
|         [Repository](#repository)         |        :x:         | :heavy_check_mark: |
|    [Target Platform](#target-platform)    |        :x:         | :heavy_check_mark: |
|          [Generator](#generator)          |        :x:         | :heavy_check_mark: |

### Application

`Application` entity changes:

- Associate to a single [Source Platform](#source-platform) for configuration discovery
- Add source platform defined "Source Platform Coordinates"
- Add [Discovery Manifest](#discovery-manifest) to hold discovered information
- Add a target Configuration/Asset [Repository](#repository) where generated assets will be stored

Application

- CRUD to add:
  - Source Platform
  - Source Platform Coordinates
  - (view only) Discovery Manifest
  - Configuration/Asset Repository
- Actions:
  - Retrieve Configurations
  - Generate Assets
- Bulk Actions:
  - Choose or remove the source platform for all selected applications
  - Retrieve Configurations for all selected applications
  - :thinking: Generate Assets for all selected applications
- Views:
  - **Table page** (Migration / Application inventory)
    - Application row:
      - Make sure the configuration discovery task is included in the task popover
      - :thinking: Status icon for "discovery manifest" (not ready, ready, discovered)
      - :thinking: Status icon for "assets generated" (not ready, ready, generated)
    - Application row kebab actions:
      - Retrieve Configurations
      - Generate Assets
    - Toolbar (kebab) actions:
      - Single application retrieve configurations
      - Single application generate assets
      - Multiselect/Bulk update source platform
      - Multiselect/Bulk retrieve configurations
      - Multiselect/Bulk generate assets
    - Selected application drawer:
      - Views of source platform fields
      - View of discovery manifest
  - **Edit modal**
    - Add fields for each CRUD item
    - :spiral_notepad: The discovery manifest will need special treatment as it'll probably be a
      document and not a simple text field
    - :thinking: Convert the modal to a page? The modal will need to be scrolled with the
      extra fields so moving to a page may help with layout

### Archetype

`Archetype` entity changes:

- Associate to zero-or-more [Target Platforms](#target-platform)
- :thinking: Add **target platform schema defined** information to be used as generator inputs
  for all applications attached to the archetype when generating assets?

Archetype

- CRUD to add:
  - Target platform
  - :question: Target platform schema defined fields
- Actions:
  - :thinking: Retrieve Configurations for all applications associated to the archetype
  - :thinking: Generate Assets for all applications associated to the archetype
- ~~Bulk Actions~~
- Views:
  - **Table page** (Migration / Archetypes)
    - Record kebab actions:
      - :thinking: Retrieve Configurations for X Applications
      - :thinking: Generate Assets for X Applications
    - ~~Toolbar (kebab) actions~~
    - Selected item drawer:
      - Target platform tab
  - **Edit modal**
    - Associate to zero-or-more target platforms
    - Option to create a new target platform on the page if needed
    - :thinking: Covert the edit modal to a page?

### Source Platform

`SourcePlatform` is a new entity:

- Each source platform represents the **discovery provider addon schema defined** platform
  coordinates for any available discovery provider addon (via hub rest endpoint)
- Associated to one-or-more [Application](#application)s for configuration discovery
- Base Data:
  - Name
  - Discovery Provider Platform Type (based on available discovery providers rest endpoint)
  - Credentials
  - Type dependent fields stored as a document defined by an
    [addition information schema](#additional-information-schemas) attached to the discovery
    provider

Source Platform

- CRUD:
  - Add a new page: Administration / Source Platforms
  - Page will be a general table view with add/edit modal
  - Table columns:
    - Name
    - Provider Type
    - Credentials Attached?
    - :thinking: Count of associated applications
- Actions:
  - Edit
  - Delete
- ~~Bulk Actions~~
- Views:
  - **Table page** (Administration / Source Platforms)
    - Record kebab actions:
      - Edit
      - Delete
    - Toolbar (kebab) actions:
      - Create
    - Selected item drawer:
      - Base information
      - View of the additional information document/fields
      - :question: View of the additional information schema
  - **Edit modal**
    - Name input
    - Provider Type dropdown
    - Credentials dropdown (include "None" as an option)
    - :thinking: Include a way to create the credentials if they don't already exist?
    - Expandable Section that is dynamic based on the provider type additional information schema

### Discovery Manifest

`DiscoveryManifest` is a new entity:

- Holds the platform and runtime information discovered for an application from a single
  source platform as a YAML document
- One-to-one mapping to an Application
- Contents are read-only
- Document format is constant across all provider types
  - :thinking: If YAML schema is available, it can be applied to the document viewer
- :question: Keep a history over multiple discovery task runs?
- :question: Could this just be a normal file attachment?

Discovery Manifest

- ~~CRUD to add~~
- ~~Actions~~
- ~~Bulk Actions~~
- Views:
  - Read-only for the user
  - Only accessible as part of an Application, therefore only viewable as part of the
    application views

### Repository

`Repository` is a new entity for a location in SCM:

- Type (git, svn)
- URL
- branch -- for git, this could be any commitish (branch, tag, commit id)
- path
- credentials (all repos need read permission, only some will need write/push permissions)

Repository

- CRUD to add:
  - :spiral_notepad: Current inline on a lot of forms, so would need to allow selection, add, edit inline with those forms
- Actions:
- Bulk Actions:
- Views:
  - **Table page** (Migration / Archetypes)
    - Record kebab actions:
    - Toolbar (kebab) actions:
    - Selected item drawer:
  - **Edit modal**

### Target Platform

`TargetPlatform` is a new entity:

- ...

Target Platform

- CRUD to add:
- Actions:
- Bulk Actions:
- Views:
  - **Table page** (Migration / Archetypes)
    - Record kebab actions:
    - Toolbar (kebab) actions:
    - Selected item drawer:
  - **Edit modal**

### Generator

`Generator` in a new entity:

- ...

Generator

- CRUD to add:
- Actions:
- Bulk Actions:
- Views:
  - **Table page** (Migration / Archetypes)
    - Record kebab actions:
    - Toolbar (kebab) actions:
    - Selected item drawer:
  - **Edit modal**

## Workflow Catalog

| Workflows                                                                   |
| :-------------------------------------------------------------------------- |
| Manage source platforms                                                     |
| Associate an application with a source platform                             |
| Retrieve configurations for an application from its source platform         |
| Discover and import a set of applications from a source platform            |
| Manage generator templates                                                  |
| Manage target platforms (as a collection of ordered generators)             |
| Associate an archetype with a set of target platforms                       |
| Generate assets for an applications + archetype + target platform selection |

...

## Additional information schemas

In a few places, the set of fields that are required will vary and depend on the selection
of an entity. Once the related entity is selected, the set of fields to capture can be defined
by an attached schema. An example of how this could work is how configuration fields are
configured for vscode extensions:

- [sample extension](https://github.com/microsoft/vscode-extension-samples/tree/main/configuration-sample)
- [configuration contribution point](https://code.visualstudio.com/api/references/contribution-points#contributes.configuration).

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
[
  "space": {
    "label": "Name of the space where the application is deployed",
    "required": true,
    "type": "text",
    "minLength": 3,
  }
  "application-name": {
    "label": "Deployed name of the application in the space",
    "required": true,
    "type": "text",
    "minLength": 3,
  }
]
```
