import CONSTANTS from "../constants/constants.js";
import Logger from "../lib/Logger.js";
import { isEmptyObject } from "../lib/lib.js";
import { RetrieveHelpers } from "../lib/retrieve-helpers.js";
import { MagicItemTab } from "../magicItemtab.js";
import { MagicItemActor } from "../magicitemactor.js";
import { MagicItemSheet } from "../magicitemsheet.js";

/**
 * Create a new API class and export it as default
 */
const API = {
  /**
   * Method for create and register a new MagicItemActor.
   * @param {string/Actor/UUID} actor The actor to use for retrieve the Actor
   * @returns {Actor}
   */
  actor: async function (actor) {
    const actorTmp = await RetrieveHelpers.getActorAsync(actor);
    return MagicItemActor.get(actorTmp.id);
  },

  /**
   * Method for roll and show a chat message on the chat console
   * @param {string} magicItemName The name of the magic item to use
   * @param {string} innerChildMagicItemName The name of the inner child "magic item" to use
   * @returns {void} Return no response
   */
  roll: function (magicItemName, innerChildMagicItemName) {
    const ChatMessage5e = CONFIG.ChatMessage.documentClass;
    const speaker = ChatMessage5e.getSpeaker();
    let actor;
    if (speaker.token) {
      actor = game.actors.tokens[speaker.token];
    }
    if (!actor) {
      actor = game.actors.get(speaker.actor);
    }
    const magicItemActor = actor ? MagicItemActor.get(actor.id) : null;
    if (!magicItemActor) {
      Logger.warn(game.i18n.localize("MAGICITEMS.WarnNoActor"), true);
      return;
    }
    magicItemActor.rollByName(magicItemName, innerChildMagicItemName);
  },

  /**
   * Method to bind magic item behavior to the item sheet
   * @param {*} app
   * @param {*} html
   * @param {*} data
   */
  bindItemSheet: function (app, html, data) {
    MagicItemTab.bind(app, html, data);
  },

  /**
   * Method to bind magic actor behavior to the item sheet
   * @param {*} app
   * @param {*} html
   * @param {*} data
   */
  bindCharacterSheet: function (app, html, data) {
    MagicItemSheet.bind(app, html, data);
  },

  async revertBackToMagicItems() {
    if (game.user.isGM) {
      for (const a of game.actors) {
        Logger.info(`Update flagsScope on actor ${a.name}...`);
        const magicitems = a.items.filter((i) => !!i.flags["magic-items-2"]);
        if (magicitems?.length > 0) {
          for (const mi of magicitems) {
            Logger.info(`Update flagsScope on actor ${a.name} for item ${mi.name}...`);
            await this.revertBackToMagicItemsItem(mi);
            Logger.info(`Updated flagsScope on actor ${a.name} for item ${mi.name}`);
          }
          Logger.info(`Updated flagsScope on actor ${a.name}`);
        }
      }
    }
  },

  async revertBackToMagicItemsItem(mi) {
    const miFlag = getProperty(mi, `flags.magic-items-2`);
    const miFlagNewScope = getProperty(mi, `flags.${CONSTANTS.MODULE_ID}`);
    if (!isEmptyObject(miFlag) && isEmptyObject(miFlagNewScope)) {
      Logger.info(`Update flagsScope item ${mi.name}...`);
      if (miFlag.spells?.length > 0) {
        Object.entries(miFlag.spells).forEach(([key, value]) => {
          if (!value.uuid && value.id) {
            value.uuid = `Item.${value.id}`;
          }
        });
      }
      await mi.update({
        flags: {
          [CONSTANTS.MODULE_ID]: miFlag,
        },
      });
      Logger.info(`Updated flagsScope item ${mi.name}`);
    }
  },
};

export default API;
