export const categoryType = "type";
export const categoryCreatedBy = "createdBy";
export const categoryDefaultCredential = "";
export const categoryName = "name";
export const categoryOwner = "owner";
export const categoryRepositoryType = "repository";
export const categoryBinary = "binary";
export const categoryStakeholderGroups = "stakeholderGroups";
export const categoryBusinessService = "businessService";
export const categoryIdentities = "identities";
export const categoryProvider = "provider";
export const categoryColor = "color";
export const categoryEmail = "email";
export const categoryJobFunction = "jobFunction";
export const categoryDescription = "description";
export const categoryStakeholders = "stakeholders";
export const categoryFileName = "filename";
export const categoryArchetypes = "archetypes";
export const categoryId = "id";
export const categoryStatus = "state";
export const categoryKind = "kind";
export const categoryCreateUser = "createUser";
export const categoryApplication = "application";
export const categoryApplicationName = "application.name";
export const categoryBusinessServiceName = "businessService.name";
export const categoryTagId = "tag.id";
export const categoryRisk = "risk";
export const categoryTags = "tags";
export const categoryCategory = "category";
export const categorySource = "source";
export const categoryTarget = "target";
export const categoryApplicationId = "application.id";
export const categoryTagCategory = "tagCategory";
/**
 * Main filter dropdown is based on the HTML id attribute
 * ouiaId is passed (as of PF5) to the wrapping <li> element
 * which has no onClick handler
 */
export const filterCategory = (categoryKey: string) =>
  // this syntax works with dots in the categoryKey
  `[id="filter-category-${categoryKey}"]`;

export const filterToggle = (categoryKey: string) =>
  `[data-ouia-component-id="filter-for-${categoryKey}"]`;

export const filterToggleInput = (categoryKey: string) =>
  `[id="filter-for-${categoryKey}-input"]`;

export const filterToggleListbox = (categoryKey: string) =>
  `[id="filter-for-${categoryKey}-listbox"]`;

export const searchInput = (categoryKey: string) =>
  `[data-ouia-component-id="search-for-${categoryKey}-input"]`;

export const searchButton = (categoryKey: string) =>
  `[data-ouia-component-id="search-for-${categoryKey}-button"]`;
