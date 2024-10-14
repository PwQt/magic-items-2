import CONSTANTS from "../constants/constants.js";
import Logger from "../lib/Logger.js";
import { isEmptyObject } from "../lib/lib.js";
import { RetrieveHelpers } from "../lib/retrieve-helpers.js";
import { MagicItemHelpers } from "../magic-item-helpers.js";
import { MagicItemTab } from "../magicItemtab.js";
import { MagicItemActor } from "../magicitemactor.js";
import { MagicItemSheet } from "../magicitemsheet.js";

const MIGRATION = {
  /**
   * Utility method to migrate the scope flag from 'magic-items-2' to 'magicitems'
   * @returns {Promise<void>} No Response
   */
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

  /**
   * Utility method to migrate the scope flag from 'magic-items-2' to 'magicitems'
   * @param {object} mi The flags property to check
   * @returns {Promise<void>} No Response
   */
  async updateFlagScopeMagicItem(mi) {
    const miFlag = foundry.utils.getProperty(mi, `flags.magic-items-2`);
    const miFlagNewScope = foundry.utils.getProperty(mi, `flags.${CONSTANTS.MODULE_ID}`);
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
   * @returns {Promise<void>} No Response
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

export default MIGRATION;
