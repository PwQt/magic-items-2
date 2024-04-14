import CONSTANTS from "../constants/constants.js";
import Logger from "../lib/Logger.js";
import { isEmptyObject } from "../lib/lib.js";
import { RetrieveHelpers } from "../lib/retrieve-helpers.js";
import { MagicItemHelpers } from "../magic-item-helpers.js";
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

  async migrateScopeMagicItem() {
    if (game.user.isGM) {
      for (const a of game.actors) {
        Logger.info(`Update flagsScope on actor ${a.name}...`);
        const magicitems = a.items.filter((i) => !!i.flags["magic-items-2"]);
        if (magicitems?.length > 0) {
          for (const mi of magicitems) {
            Logger.info(`Update flagsScope on actor ${a.name} for item ${mi.name}...`);
            await this.updateFlagScopeMagicItem(mi);
            Logger.info(`Updated flagsScope on actor ${a.name} for item ${mi.name}`);
          }
          Logger.info(`Updated flagsScope on actor ${a.name}`);
        }
      }
    }
  },

  async updateFlagScopeMagicItem(mi) {
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
      if (miFlag.feats?.length > 0) {
        Object.entries(miFlag.feats).forEach(([key, value]) => {
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

  /**
   * Method to migrate compendiumpack to use another flag
   * @param {string} compendiumName the name of the pack, gotten from the `game.packs` property
   */
  async updateScopePerCompendiumPack(compendiumName) {
    if (game.user.isGM) {
      const previousPackageName = "magic-items-2";
      if (game.packs.get(`${compendiumName}`) !== undefined) {
        await game.packs.get(`${compendiumName}`).updateAll((pack) => ({
          flags: {
            [CONSTANTS.MODULE_ID]: pack.flags[`${previousPackageName}`],
          },
        }));
        Logger.info(`Updated flagsScope for compendium ${compendiumName}`);
      } else {
        Logger.warn(`Pack ${compendiumName} has not been found - no migration applied`);
      }
    }
  },

  /**
   * Update all actor magicitems item flags
   */
  async updatMagicItemsOnAllActors() {
    if (game.user.isGM) {
      Logger.info(`Updating Magic Items information on all actors`);
      for (const actor of game.actors) {
        Logger.info(`Updating Magic Items on actor ${actor.name}`);
        const miFlag = actor.items.filter((i) => !!i.flags[CONSTANTS.MODULE_ID]);
        if (miFlag?.length > 0) {
          for (const item of miFlag) {
            await MagicItemHelpers.updateMagicItemFlagOnItem(item);
          }
        }
      }
    }
  },

  /**
   * Method that updates all compendium items with new Magic Item flags.
   * @param {*} compendiumName compendium name fetched from game.packs
   */
  async updateMagicItemsOnAllCompendiumItems(compendiumName) {
    if (game.user.isGM) {
      Logger.info(`Updating all items from compendium '${compendiumName}' with new flags`);
      const compendiumItems = await game.packs.get(compendiumName)?.getDocuments();
      if (!isEmptyObject(compendiumItems)) {
        const miFlag = compendiumItems.filter((i) => !!i.flags[CONSTANTS.MODULE_ID]);
        if (miFlag?.length > 0) {
          for (const item of miFlag) {
            Logger.debug(`${JSON.stringify(item)}`);
            Logger.info(`Updating components on item ${item.name}`);
            await MagicItemHelpers.updateMagicItemFlagOnItem(item);
          }
        }
      }
    }
  },
};

export default API;
