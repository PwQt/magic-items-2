import { MagicItemTab } from "../magicItemtab";
import { MagicItemActor } from "../magicitemactor";
import { MagicItemSheet } from "../magicitemsheet";

/**
 * Create a new API class and export it as default
 */
const API = {
  actor: function (id) {
    return MagicItemActor.get(id);
  },

  roll: function (magicItemName, itemName) {
    const speaker = ChatMessage.getSpeaker();
    let actor;
    if (speaker.token) actor = game.actors.tokens[speaker.token];
    if (!actor) actor = game.actors.get(speaker.actor);

    const magicItemActor = actor ? MagicItemActor.get(actor.id) : null;
    if (!magicItemActor) {
      return ui.notifications.warn(game.i18n.localize("MAGICITEMS.WarnNoActor"));
    }
    magicItemActor.rollByName(magicItemName, itemName);
  },

  bindItemSheet: function (app, html, data) {
    MagicItemTab.bind(app, html, data);
  },

  bindCharacterSheet: function (app, html, data) {
    MagicItemSheet.bind(app, html, data);
  },
};

export default API;
