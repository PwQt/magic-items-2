import { warn } from "../lib/lib.js";
import { MagicItemTab } from "../magicItemtab.js";
import { MagicItemActor } from "../magicitemactor.js";
import { MagicItemSheet } from "../magicitemsheet.js";

/**
 * Create a new API class and export it as default
 */
const API = {
  actor: function (id) {
    return MagicItemActor.get(id);
  },

  roll: function (magicItemName, innerChildMagicItemName) {
    const speaker = ChatMessage.getSpeaker();
    let actor;
    if (speaker.token) {
      actor = game.actors.tokens[speaker.token];
    }
    if (!actor) {
      actor = game.actors.get(speaker.actor);
    }
    const magicItemActor = actor ? MagicItemActor.get(actor.id) : null;
    if (!magicItemActor) {
      warn(game.i18n.localize("MAGICITEMS.WarnNoActor"), true);
      return;
    }
    magicItemActor.rollByName(magicItemName, innerChildMagicItemName);
  },

  bindItemSheet: function (app, html, data) {
    MagicItemTab.bind(app, html, data);
  },

  bindCharacterSheet: function (app, html, data) {
    MagicItemSheet.bind(app, html, data);
  },
};

export default API;
