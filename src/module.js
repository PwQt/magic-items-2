import API from "./scripts/API/api.js";
import CONSTANTS from "./scripts/constants/constants.js";
import Logger from "./scripts/lib/Logger.js";
import { MagicItemActor } from "./scripts/magicitemactor.js";
import { MagicItemSheet } from "./scripts/magicitemsheet.js";
import { MagicItemTab } from "./scripts/magicItemtab.js";

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

Hooks.once('tidy5e-sheet.ready', (api) => {
  const myTab = new api.models.HandlebarsTab({
    title: 'Magic Items',
    tabId: 'magic-items',
    path: '/modules/magic-items-2/templates/magic-item-tab.hbs',
    enabled: (data) => { return ["weapon", "equipment", "consumable", "tool", "backpack", "feat"].includes(data.item.type) },
    onRender(params) {
      if (!game.user.isGM && game.settings.get(CONSTANTS.MODULE_ID, "hideFromPlayers")) {
        return;
      }
      var htmlArr = [];
      htmlArr.push($(params.element));
      MagicItemTab.bind(params.app, htmlArr, params.data);
    },
  });
  Logger.logObject(myTab);
  api.registerItemTab(myTab);
});


Hooks.on(`renderItemSheet5e`, (app, html, data) => {
  if (app.constructor.name !== "Tidy5eKgarItemSheet") {
    if (!game.user.isGM && game.settings.get(CONSTANTS.MODULE_ID, "hideFromPlayers")) {
      return;
    }
    MagicItemTab.bind(app, html, data);
  }
});

Hooks.on(`renderActorSheet5eCharacter`, (app, html, data) => {
  MagicItemSheet.bind(app, html, data);
});

Hooks.on(`renderActorSheet5eNPC`, (app, html, data) => {
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
      { displaySheet: false }
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
