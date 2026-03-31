import {
  click,
  clickByText,
  clickJs,
  clickWithinByText,
  inputText,
  selectUserPerspective,
  submitForm,
  uploadFile,
} from "../../../../utils/utils";
import {
  CustomRuleType,
  Languages,
  RepositoryType,
  SEC,
  button,
  clearAllFilters,
  createNewButton,
  customMigrationTargets,
  deleteAction,
  editAction,
} from "../../../types/constants";
import { RulesManualFields, RulesRepositoryFields } from "../../../types/types";
import { submitButton } from "../../../views/common.view";
import { CustomMigrationTargetView } from "../../../views/custom-migration-target.view";
import { navMenu } from "../../../views/menu.view";

export class CustomMigrationTarget {
  name: string;
  description?: string;
  imagePath?: string;
  ruleTypeData: RulesRepositoryFields | RulesManualFields;
  language: Languages;
  sources?: string[];

  constructor(
    name: string,
    description: string,
    imagePath: string,
    ruleTypeData: RulesRepositoryFields | RulesManualFields,
    language = Languages.Java,
    sources?: string[]
  ) {
    this.name = name;
    this.description = description;
    this.imagePath = imagePath;
    this.ruleTypeData = ruleTypeData;
    this.language = language;
    this.sources = sources;
  }

  public static fullUrl = Cypress.config("baseUrl") + "/migration-targets";

  /**
   * Opens the custom migration target page if not already there
   * This method checks that the target cards are present before continuing,
   * this assumes the page is always filtered by Java targets, looking for one of the defaults
   * @param forceReload
   */
  public static open(forceReload = false) {
    cy.intercept("GET", "/hub/targets*").as("getTargets");

    const waitForTargets = () => {
      cy.get("h1").should("contain", customMigrationTargets);
      cy.wait("@getTargets", { timeout: 30 * SEC });
      cy.get(CustomMigrationTargetView.card, { timeout: 30 * SEC }).should(
        "contain",
        "Containerization"
      );
    };

    if (forceReload) {
      cy.visit(CustomMigrationTarget.fullUrl);
      waitForTargets();
      return;
    }

    cy.url().then(($url) => {
      if ($url !== CustomMigrationTarget.fullUrl) {
        selectUserPerspective("Migration");
        clickByText(navMenu, customMigrationTargets);
        waitForTargets();
      }
    });
  }

  public static openNewForm() {
    CustomMigrationTarget.open();
    clickByText(button, createNewButton);
  }

  public create() {
    CustomMigrationTarget.openNewForm();
    CustomMigrationTarget.fillForm(this);
    submitForm();
    cy.get(submitButton, { timeout: 5 * SEC }).should("not.exist");
  }

  public openEditDialog() {
    CustomMigrationTarget.open();
    this.expandActionsMenu();
    cy.contains(button, editAction).click();
  }

  public edit(updateValues: Partial<CustomMigrationTarget>) {
    this.openEditDialog();
    CustomMigrationTarget.fillForm(updateValues);
    clickJs(submitButton);
  }

  public delete() {
    this.expandActionsMenu();
    cy.contains(button, deleteAction).click();
  }

  public static fillName(name: string) {
    inputText(CustomMigrationTargetView.nameInput, name);
  }

  public static uploadImage(imagePath: string) {
    cy.get("div.pf-v6-c-file-upload__file-details")
      .next('input[type="file"]', { timeout: 2 * SEC })
      .selectFile(`fixtures/${imagePath}`, {
        timeout: 120 * SEC,
        force: true,
      });
  }

  private static fillForm(values: Partial<CustomMigrationTarget>) {
    if (values.name) {
      CustomMigrationTarget.fillName(values.name);
    }

    if (values.language) {
      click(CustomMigrationTargetView.formLanguageDropdown);
      clickWithinByText(
        CustomMigrationTargetView.formLanguageDropdownOptions,
        "li",
        values.language
      );
    }

    if (values.description) {
      inputText(CustomMigrationTargetView.descriptionInput, values.description);
    }

    if (values.imagePath) {
      CustomMigrationTarget.uploadImage(values.imagePath);
    }

    if (values.ruleTypeData) {
      if (values.ruleTypeData.type === CustomRuleType.Manual) {
        CustomMigrationTarget.fillManualForm(values.ruleTypeData);
      }

      if (values.ruleTypeData.type === CustomRuleType.Repository) {
        click(CustomMigrationTargetView.retrieveFromARepositoryRadio);
        CustomMigrationTarget.fillRepositoryForm(values.ruleTypeData);
      }
    }
  }

  public static selectLanguage(language: Languages) {
    CustomMigrationTarget.open();

    // Clear any pre-existing filters first
    cy.get("body").then(($body) => {
      if ($body.find(`button:contains("${clearAllFilters}")`).length > 0) {
        clickByText("button", clearAllFilters);
      }
    });

    // Open the language filter dropdown and select the desired language
    cy.get(CustomMigrationTargetView.filterLanguageDropdown).click();
    cy.get(".pf-v6-c-menu__list-item").contains(language).click();
    cy.get(CustomMigrationTargetView.filterLanguageDropdown).click();
  }

  public static uploadRules(rulePaths: string[]) {
    rulePaths.forEach((path) =>
      uploadFile(path, CustomMigrationTargetView.ruleInput)
    );
  }

  private static fillManualForm(values: Partial<RulesManualFields>) {
    if (values.rulesetPaths && values.rulesetPaths.length) {
      CustomMigrationTarget.uploadRules(values.rulesetPaths);
    }
  }

  public static fillRepositoryUrl(url: string) {
    inputText(CustomMigrationTargetView.repositoryUrl, url);
  }

  public static selectRepositoryType(repositoryType: RepositoryType) {
    click(CustomMigrationTargetView.repositoryTypeDropdown);
    clickByText(button, repositoryType);
  }

  private static fillRepositoryForm(values: Partial<RulesRepositoryFields>) {
    if (values.repositoryType) {
      CustomMigrationTarget.selectRepositoryType(RepositoryType.git);
    }

    if (values.repositoryUrl) {
      CustomMigrationTarget.fillRepositoryUrl(values.repositoryUrl);
    }

    if (values.branch) {
      inputText(CustomMigrationTargetView.branch, values.branch);
    }

    if (values.rootPath) {
      inputText(CustomMigrationTargetView.rootPath, values.rootPath);
    }

    if (values.credentials) {
      click(CustomMigrationTargetView.credentialsDropdown);
      clickByText(button, values.credentials.name);
    }
  }

  private expandActionsMenu() {
    CustomMigrationTarget.selectLanguage(this.language);
    cy.contains(this.name)
      .parents(CustomMigrationTargetView.card)
      .within(() => {
        cy.get(CustomMigrationTargetView.actionsButton).then(($btn) => {
          if ($btn.attr("aria-expanded") === "false") {
            cy.wrap($btn).click();
          }
        });
      });
  }

  validateSourceTechnology(sources: string[]): void {
    sources.forEach((source) => {
      cy.get("span.pf-v6-c-label__text").should("contain.text", source);
    });
  }
}
