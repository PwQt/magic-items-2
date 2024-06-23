import { API, MIGRATION } from "./scripts/API/api.js";
import CONSTANTS from "./scripts/constants/constants.js";
import { MagicItemActor } from "./scripts/magicitemactor.js";
import { MagicItemSheet } from "./scripts/magicitemsheet.js";
import { MagicItemTab } from "./scripts/magicItemtab.js";
import { MagicItem } from "./scripts/magic-item/MagicItem.js";

// CONFIG.debug.hooks = true;

Handlebars.registerHelper("enabled", function (value, options) {
  return Boolean(value) ? "" : "disabled";
});

Handlebars.registerHelper("formatString", function (toFormat, variables = {}, localize = true) {
  return localize ? game.i18n.format(game.i18n.localize(toFormat), variables) : game.i18n.format(toFormat, variables);
});

Handlebars.registerHelper("object", function ({ object }) {
  return object;
});

Hooks.once("init", () => {
  game.settings.register(CONSTANTS.MODULE_ID, "identifiedOnly", {
    name: "MAGICITEMS.SettingIdentifiedOnly",
    hint: "MAGICITEMS.SettingIdentifiedOnlyHint",
    scope: "world",
    type: Boolean,
    default: true,
    config: true,
  });

  game.settings.register(CONSTANTS.MODULE_ID, "hideFromPlayers", {
    name: "MAGICITEMS.SettingHideFromPlayers",
    hint: "MAGICITEMS.SettingHideFromPlayersHint",
    scope: "world",
    type: Boolean,
    default: false,
    config: true,
  });

  game.settings.register(CONSTANTS.MODULE_ID, "debug", {
    name: "MAGICITEMS.SettingDebug",
    hint: "MAGICITEMS.SettingDebugHint",
    scope: "client",
    type: Boolean,
    default: false,
    config: true,
  });

  game.settings.register(CONSTANTS.MODULE_ID, "welcomeMessage", {
    name: "welcomeMessage",
    scope: "world",
    type: Boolean,
    default: true,
    config: false,
  });

  game.settings.register(CONSTANTS.MODULE_ID, "scaleSpellDamage", {
    name: "MAGICITEMS.SettingScaleSpellDamage",
    hint: "MAGICITEMS.SettingScaleSpellDamageHint",
    scope: "world",
    type: Boolean,
    default: false,
    config: true,
  });

  game.settings.register(CONSTANTS.MODULE_ID, "showLeftChargesChatMessage", {
    name: "MAGICITEMS.SettingShowLeftChargesInChat",
    hint: "MAGICITEMS.SettingShowLeftChargesInChatHint",
    scope: "world",
    type: Boolean,
    default: true,
    config: true,
  });

  if (typeof Babele !== "undefined") {
    Babele.get().register({
      module: CONSTANTS.MODULE_ID,
      lang: "it",
      dir: "lang/packs/it",
    });
  }
});

Hooks.once("setup", async () => {
  // Set API
  game.modules.get(CONSTANTS.MODULE_ID).api = API;
  window.MagicItems = game.modules.get(CONSTANTS.MODULE_ID).api;
  game.modules.get(CONSTANTS.MODULE_ID).migration = MIGRATION;
});

Hooks.once("ready", async () => {
  Array.from(game.actors)
    .filter((actor) => actor.permission >= 1)
    .forEach((actor) => {
      MagicItemActor.bind(actor);
    });

  if (game.user.isGM && !game.settings.get(CONSTANTS.MODULE_ID, "welcomeMessage")) {
    const message =
      "Hello everyone!<br><br>This is the first version of Magic Items module that has been transferred from Magic Items 2, therefore it requires a migration of items.<br><br>For manual information about migrations, please consult the latest release changelog.<br><br>Thank you for your continuing support, and I hope you will enjoy this module!<br><br>If you want, please go ahead and check out the discord community created for this module on Foundry Module listing or Github project.";
    const title = "Magic Items";
    // eslint-disable-next-line no-undef
    let d = new Dialog({
      title: title,
      content: `${message}<br><br>`,
      buttons: {
        use: {
          icon: '<i class="fas fa-check"></i>',
          label: "Do the automatic migration.",
          callback: () => {
            MIGRATION.migrateScopeMagicItem();
            game.settings.set(CONSTANTS.MODULE_ID, "welcomeMessage", true);
          },
        },
        closeAndChangeSetting: {
          icon: '<i class="fas fa-times"></i>',
          label: "I will do the migration on my own - do not show this window again.",
          callback: () => {
            game.settings.set(CONSTANTS.MODULE_ID, "welcomeMessage", true);
            d.close();
          },
        },
        close: {
          icon: '<i class="fas fa-times"></i>',
          label: game.i18n.localize("MAGICITEMS.SheetDialogClose"),
          callback: () => d.close(),
        },
      },
      default: "use",
    });
    d.render(true);
  }
});

Hooks.once("createActor", (actor) => {
  if (actor.permission >= 2) {
    MagicItemActor.bind(actor);
  }
});

Hooks.once("createToken", (token) => {
  const actor = token.actor;
  if (actor.permission >= 2) {
    MagicItemActor.bind(actor);
  }
});

let tidyApi;
Hooks.once("tidy5e-sheet.ready", (api) => {
  tidyApi = api;

  // Register Tidy Item Sheet Tab
  const magicItemsTab = new api.models.HandlebarsTab({
    title: "Magic Item",
    tabId: "magicitems",
    path: "/modules/magicitems/templates/magic-item-tab.hbs",
    enabled: (data) => {
      return MagicItemTab.isAcceptedItemType(data.item) && MagicItemTab.isAllowedToShow();
    },
    getData(data) {
      const flagsData = foundry.utils.getProperty(data.item, `flags.${CONSTANTS.MODULE_ID}`);
      return new MagicItem(flagsData);
    },
    onRender(params) {
      const html = $(params.element);

      if (params.data.editable) {
        const flagsData = foundry.utils.getProperty(params.data.item, `flags.${CONSTANTS.MODULE_ID}`);
        const magicItem = new MagicItem(flagsData);
        MagicItemTab.activateTabContentsListeners({
          html: html,
          item: params.data.item,
          magicItem: magicItem,
        });
        params.element.querySelector(`.magicitems-content`).addEventListener("drop", (event) => {
          MagicItemTab.onDrop({ event, item: params.data.item, magicItem: magicItem });
        });
      } else {
        MagicItemTab.disableMagicItemTabInputs(html);
      }
    },
  });
  api.registerItemTab(magicItemsTab);

  // Register character and NPC spell tab custom content
  api.registerActorContent(
    new api.models.HandlebarsContent({
      path: `modules/${CONSTANTS.MODULE_ID}/templates/magic-item-spell-sheet.html`,
      injectParams: {
        position: "afterbegin",
        selector: `[data-tab-contents-for="${api.constants.TAB_ID_CHARACTER_SPELLBOOK}"] .scroll-container`,
      },
      enabled(data) {
        const magicItemActor = MagicItemActor.get(data.actor.id);
        if (!magicItemActor) {
          return false;
        }
        // Required for Tidy to have accurate item data
        magicItemActor.buildItems();
        return ["character", "npc"].includes(data.actor.type) && magicItemActor.hasItemsSpells();
      },
      getData(data) {
        return MagicItemActor.get(data.actor.id);
      },
    }),
  );

  // Register character and NPC feature tab custom content
  const npcAbilitiesTabContainerSelector = `[data-tidy-sheet-part="${api.constants.SHEET_PARTS.NPC_ABILITIES_CONTAINER}"]`;
  const characterFeaturesContainerSelector = `[data-tab-contents-for="${api.constants.TAB_ID_CHARACTER_FEATURES}"] [data-tidy-sheet-part="${api.constants.SHEET_PARTS.ITEMS_CONTAINER}"]`;
  const magicItemFeatureTargetSelector = [npcAbilitiesTabContainerSelector, characterFeaturesContainerSelector].join(
    ", ",
  );
  api.registerActorContent(
    new api.models.HandlebarsContent({
      path: `modules/${CONSTANTS.MODULE_ID}/templates/magic-item-feat-sheet.html`,
      injectParams: {
        position: "afterbegin",
        selector: magicItemFeatureTargetSelector,
      },
      enabled(data) {
        const magicItemActor = MagicItemActor.get(data.actor.id);
        if (!magicItemActor) {
          return false;
        }
        // Required for Tidy to have accurate item data
        magicItemActor.buildItems();
        return ["character", "npc"].includes(data.actor.type) && magicItemActor.hasItemsFeats();
      },
      getData(data) {
        return MagicItemActor.get(data.actor.id);
      },
    }),
  );
});

// Wire Tidy events and register iterated, data-dependent content
Hooks.on("tidy5e-sheet.renderActorSheet", (app, element, data) => {
  // Place wand for visible magic items
  const magicItemActor = MagicItemActor.get(data.actor.id);
  const html = $(element);
  if (!magicItemActor) {
    return;
  }

  magicItemActor.items
    .filter((item) => item.visible)
    .forEach((item) => {
      let itemEl = html.find(
        `[data-tidy-sheet-part="${tidyApi.constants.SHEET_PARTS.ITEM_TABLE_ROW}"][data-item-id="${item.id}"]`,
      );
      let itemNameContainer = itemEl.find(`[data-tidy-sheet-part=${tidyApi.constants.SHEET_PARTS.ITEM_NAME}]`);
      let iconHtml = tidyApi.useHandlebarsRendering(CONSTANTS.HTML.MAGIC_ITEM_ICON);
      itemNameContainer.append(iconHtml);
    });

  // Wire events for custom tidy actor sheet content
  MagicItemSheet.handleEvents(html, magicItemActor);
});

Hooks.on(`renderItemSheet5e`, (app, html, data) => {
  if (tidyApi?.isTidy5eItemSheet(app)) {
    return;
  }

  if (!MagicItemTab.isAllowedToShow()) {
    return;
  }

  MagicItemTab.bind(app, html, data);
});

Hooks.on(`renderActorSheet5eCharacter`, (app, html, data) => {
  if (tidyApi?.isTidy5eCharacterSheet(app)) {
    return;
  }
  MagicItemSheet.bind(app, html, data);
});

Hooks.on(`renderActorSheet5eNPC`, (app, html, data) => {
  if (tidyApi?.isTidy5eNpcSheet(app)) {
    return;
  }
  MagicItemSheet.bind(app, html, data);
});

Hooks.on("hotbarDrop", async (bar, data, slot) => {
  if (data.type !== "MagicItem") {
    return;
  }
  const command = `MagicItems.roll("${data.magicItemName}","${data.itemName}");`;
  let macro = game.macros.find((m) => m.name === data.name && m.command === command);
  if (!macro) {
    macro = await Macro.create(
      {
        name: data.name,
        type: "script",
        img: data.img,
        command: command,
        flags: { "dnd5e.itemMacro": true },
      },
      { displaySheet: false },
    );
  }
  game.user.assignHotbarMacro(macro, slot);

  return false;
});

Hooks.on("createItem", async (item, options, userId) => {
  if (item.actor) {
    const actor = item.actor;
    const miActor = MagicItemActor.get(actor.id);
    if (miActor && miActor.listening && miActor.actor.id === actor.id) {
      await API.updateFlagScopeMagicItem(item);
      miActor.buildItems();
    }
  }
});

Hooks.on("updateItem", (item, change, options, userId) => {
  if (item.actor) {
    const actor = item.actor;
    const miActor = MagicItemActor.get(actor.id);
    if (miActor && miActor.listening && miActor.actor.id === actor.id) {
      setTimeout(miActor.buildItems.bind(miActor), 500);
    }
  }
});

Hooks.on("deleteItem", (item, options, userId) => {
  if (item.actor) {
    const actor = item.actor;
    const miActor = MagicItemActor.get(actor.id);
    if (miActor && miActor.listening && miActor.actor.id === actor.id) {
      miActor.buildItems();
    }
  }
});

Hooks.on("preCreateItem", async (item, data, options, userId) => {
  const actorEntity = item.actor;
  if (!actorEntity) {
    return;
  }
  // Set up defaults flags
  const defaultReference =
    foundry.utils.getProperty(item, `flags.${CONSTANTS.MODULE_ID}.${CONSTANTS.FLAGS.DEFAULT}`) ||
    foundry.utils.getProperty(item, `flags.core.sourceId`);
  // const defaultItem = await RetrieveHelpers.getItemAsync(defaultReference);
  // const defaultDataFlags = foundry.utils.getProperty(defaultItem , `flags.${CONSTANTS.MODULE_ID}`);
  // defaultDataFlags.default = defaultItem.uuid;
  if (!defaultReference) {
    await item.update({
      flags: {
        [CONSTANTS.MODULE_ID]: {
          [CONSTANTS.FLAGS.DEFAULT]: defaultReference,
        },
      },
    });
  }
});

Hooks.on("preUpdateItem", async (item, changes, options, userId) => {
  const actorEntity = item.actor;
  if (!actorEntity) {
    return;
  }
});

Hooks.on("preDeleteItem", async (item, options, userId) => {
  const actorEntity = item.actor;
  if (!actorEntity) {
    return;
  }
});
