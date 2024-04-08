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

  /**
   * Setup Magic item like you normally would by creating a spell called with all the damage details in the spell as detailed on the weapon.
   * Also checkes for Item Attunement and gives you a choice if you want to spend a charge or not.
   * @param {Item/string/UUID} item
   * @returns {void}
   */
  async magicItemAttack(item) {
    let itemD = await RetrieveHelpers.getItemAsync(item);
    if (!itemD) {
      Logger.warn(`magicItemAttack | No item found with this reference '${item}'`, true, item);
      return false;
    }
    if (game.user.targets.size !== 1) {
      Logger.warn("magicItemAttack | Please target only one token.", true);
      return false;
    }

    let magicD = foundry.utils.getProperty(itemD, `flags.${CONSTANTS.MODULE_ID}`);
    let attunement = itemD.data.attunement;
    let target = game.user.targets.first(); // await canvas.tokens.get(args[0].hitTargets[0]._id);
    if (target && attunement === 2) {
      new Dialog({
        title: `${itemD.name}`,
        content: `<p>Spend a charge?</p>`,
        buttons: {
          confirmed: {
            icon: "<i class='fas fa-bolt'></i>",
            label: "Yes",
            callback: async () => {
              await this.roll(itemD.name, magicD.spells[0].name);
            },
          },
        },
      }).render(true);
    }
  },

  /**
   * Setup Magic item like you normally would by creating a spell called with all the damage details in the spell as detailed on the weapon.
   * @param {Item/string/UUID} item
   * @returns {void}
   */
  async magicItemAttackFast(item) {
    let itemD = await RetrieveHelpers.getItemAsync(item);
    if (!itemD) {
      Logger.warn(`magicItemAttackFast | No item found with this reference '${item}'`, true, item);
      return false;
    }
    let magicD = foundry.utils.getProperty(itemD, `flags.${CONSTANTS.MODULE_ID}`);
    await this.roll(itemD.name, magicD.spells[0].name);
  },

  /**
   *
   * @param {Item/string/UUID} item
   * @returns {void}
   */
  async magicItemMultipleSpellsTrinket(item) {
    let itemD = await RetrieveHelpers.getItemAsync(item);
    if (!itemD) {
      Logger.warn(`multipleSpellsTrinket | No item found with this reference '${item}'`, true, item);
      return false;
    }
    if (game.user.targets.size !== 1) {
      Logger.warn("multipleSpellsTrinket | Please target only one token.", true);
      return false;
    }
    let spellList = "";
    let spell_items = Object.values(itemD.flags.magicitems.spells).sort((a, b) => (a.name < b.name ? -1 : 1));
    for (let i = 0; i < spell_items.length; i++) {
      let item = spell_items[i];
      spellList += `<option value="${item.name}">${item.name}</option>`;
    }

    const htmlContent = `<form>
            <p>Pick a spell to cast</p>
            <div class="form-group">
                <label for="weapons">Listed Spells</label>
                <select id="spells">${spellList}</select>
            </div>
        </form>`;

    new Dialog({
      title: `${itemD.name}`,
      content: htmlContent,
      buttons: {
        cast: {
          label: "Cast",
          callback: async (html) => {
            let get_spell = await html.find("#spells")[0].value;
            await this.roll(itemD.name, get_spell);
          },
        },
      },
    }).render(true);
  },

  /**
   * If there are multiple spells on said item, you can use this macro. Just enter the name of the item.
   * @param {Item/string/UUID} item
   * @param {boolean} runAsMacro Run as a item macro with the command `game.dnd5e.rollItemMacro(itemName)`
   * @returns {void}
   */
  async magicItemMultipleSpellsWeapon(item, runAsMacro) {
    let itemD = await RetrieveHelpers.getItemAsync(item);
    if (!itemD) {
      Logger.warn(`multipleSpellsWeapon | No item found with this reference '${item}'`, true, item);
      return false;
    }
    if (game.user.targets.size !== 1) {
      Logger.warn("multipleSpellsWeapon | Please target only one token.", true);
      return false;
    }
    let spellList = "";
    let spell_items = Object.values(itemD.data.flags.magicitems.spells).sort((a, b) => (a.name < b.name ? -1 : 1));
    for (let i = 0; i < spell_items.length; i++) {
      let item = spell_items[i];
      spellList += `<option value="${item.name}">${item.name}</option>`;
    }
    if (runAsMacro) {
      const htmlContent = `<form>
            <p>Pick a spell to cast</p>
            <div class="form-group">
                <label for="weapons">Listed Spells</label>
                <select id="spells">${spellList}</select>
            </div>
        </form>`;

      new Dialog({
        title: `${itemD.name}`,
        content: htmlContent,
        buttons: {
          cast: {
            label: "Cast",
            callback: async (html) => {
              let get_spell = await html.find("#spells")[0].value;
              await this.roll(itemD.name, get_spell);
            },
          },
        },
      }).render(true);
    } else {
      game.dnd5e.rollItemMacro(itemName);
    }
  },

  // =============================================
  // Migration Utilities
  // =============================================

  /**
   * Utility method to migrate the scope flag from 'magic-items-2' to 'magicitems'
   * @returns {void} No Response
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
   * @param {object} mi
   * @returns {void} No Response
   */
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
   * @returns {void} No Response
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
};

export default API;
