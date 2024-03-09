import API from "./scripts/API/api.js";
import CONSTANTS from "./scripts/constants/constants.js";
import Logger from "./scripts/lib/Logger.js";
import { MagicItemActor } from "./scripts/magicitemactor.js";
import { MagicItemSheet } from "./scripts/magicitemsheet.js";
import { MagicItemTab } from "./scripts/magicItemtab.js";
import { MagicItem } from "./scripts/magic-item/MagicItem.js";

//CONFIG.debug.hooks = true;

Handlebars.registerHelper("enabled", function (value, options) {
  return Boolean(value) ? "" : "disabled";
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

  if (typeof Babele !== "undefined") {
    Babele.get().register({
      module: CONSTANTS.MODULE_ID,
      lang: "it",
      dir: "lang/packs/it",
    });
  }
});

Hooks.once("setup", () => {
  // Set API
  game.modules.get(CONSTANTS.MODULE_ID).api = API;
  window.MagicItems = game.modules.get(CONSTANTS.MODULE_ID).api;
});

Hooks.once("ready", () => {
  Array.from(game.actors)
    .filter((actor) => actor.permission >= 1)
    .forEach((actor) => {
      MagicItemActor.bind(actor);
    });
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
    tabId: "magic-items",
    path: "/modules/magic-items-2/templates/magic-item-tab.hbs",
    enabled: (data) => {
      return MagicItemTab.isAcceptedItemType(data.item) && MagicItemTab.isAllowedToShow();
    },
    getData(data) {
      return new MagicItem(data.item.flags.magicitems);
    },
    onRender(params) {
      const html = $(params.element);

      if (params.data.editable) {
        const magicItem = new MagicItem(params.data.item.flags.magicitems);
        MagicItemTab.activateTabContentsListeners({
          html: html,
          item: params.data.item,
          magicItem: magicItem,
        });
        params.element.querySelector(`.magic-items-content`).addEventListener("drop", (event) => {
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

Hooks.on(`createItem`, (item) => {
  if (item.actor) {
    const actor = item.actor;
    const miActor = MagicItemActor.get(actor.id);
    if (miActor && miActor.listening && miActor.actor.id === actor.id) {
      miActor.buildItems();
    }
  }
});

Hooks.on(`updateItem`, (item) => {
  if (item.actor) {
    const actor = item.actor;
    const miActor = MagicItemActor.get(actor.id);
    if (miActor && miActor.listening && miActor.actor.id === actor.id) {
      setTimeout(miActor.buildItems.bind(miActor), 500);
    }
  }
});

Hooks.on(`deleteItem`, (item) => {
  if (item.actor) {
    const actor = item.actor;
    const miActor = MagicItemActor.get(actor.id);
    if (miActor && miActor.listening && miActor.actor.id === actor.id) {
      miActor.buildItems();
    }
  }
});
