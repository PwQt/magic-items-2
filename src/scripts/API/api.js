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

    let spells = foundry.utils.getProperty(itemD, `flags.${CONSTANTS.MODULE_ID}.${CONSTANTS.FLAGS.SPELLS}`) || [];
    if (spells.length === 0) {
      Logger.warn("magicItemAttack | Please put at least one spells on the item.", true);
      return false;
    }
    let attunement = itemD.system.attunement;
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
              await this.roll(itemD.name, spells[0].name);
            },
          },
        },
      }).render(true);
    }
  },

  /**
   * Setup Magic item like you normally would by creating a spell called with all the damage details in the spell as detailed on the weapon.
   * @param {Item/string/UUID} item
   * @returns {Promise<void>} No Response
   */
  async magicItemAttackFast(item) {
    let itemD = await RetrieveHelpers.getItemAsync(item);
    if (!itemD) {
      Logger.warn(`magicItemAttackFast | No item found with this reference '${item}'`, true, item);
      return false;
    }
    let spells = foundry.utils.getProperty(itemD, `flags.${CONSTANTS.MODULE_ID}.${CONSTANTS.FLAGS.SPELLS}`) || [];
    if (spells.length === 0) {
      Logger.warn("magicItemAttackFast | Please put at least one spells on the item.", true);
      return false;
    }
    await this.roll(itemD.name, spells[0].name);
  },

  /**
   * Setup Magic item like you normally would by creating a spell called with all the damage details in the spell as detailed on the weapon.
   * @param {Item|string|UUID} item
   * @returns {Promise<void>} No Response
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
    let spells = foundry.utils.getProperty(itemD, `flags.${CONSTANTS.MODULE_ID}.${CONSTANTS.FLAGS.SPELLS}`) || [];
    if (spells.length === 0) {
      Logger.warn("multipleSpellsTrinket | Please put at least one spells on the item.", true);
      return false;
    }
    let spell_items = Object.values(spells).sort((a, b) => (a.name < b.name ? -1 : 1));
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
   * @param {Item|string|UUID} item
   * @param {boolean} runAsItemMacro Run as a item macro with the command `game.dnd5e.rollItemMacro(itemName)`
   * @returns {Promise<void>} No Response
   */
  async magicItemMultipleSpellsWeapon(item, runAsItemMacro) {
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
    let spells = foundry.utils.getProperty(itemD, `flags.${CONSTANTS.MODULE_ID}.${CONSTANTS.FLAGS.SPELLS}`) || [];
    let spell_items = Object.values(spells).sort((a, b) => (a.name < b.name ? -1 : 1));
    for (let i = 0; i < spell_items.length; i++) {
      let item = spell_items[i];
      spellList += `<option value="${item.name}">${item.name}</option>`;
    }
    if (!runAsItemMacro) {
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

  /**
   * Method handling a short-rest action for magic items
   * @param {string/Actor/UUID} actor The actor to use for retrieve the Actor
   */
  async execActorShortRest(actor) {
    let actorTmp = await API.actor(actor);
    await actorTmp.actor.shortRest.apply(actorTmp.actor);
  },

  /**
   * Method handling a long-rest action for magic items
   * @param {string/Actor/UUID} actor The actor to use for retrieve the Actor
   */
  async execActorLongRest(actor) {
    let actorTmp = await API.actor(actor);
    await actorTmp.actor.longRest.apply(actorTmp.actor);
  },

  /**
   * Method handling a short-rest action for magic items
   * @param {string/Actor/UUID} actor The actor to use for retrieve the Actor
   * @param {Boolean} isNewDay Check whether it's a new day
   */
  async execActorShortRestUnderHood(actor, isNewDay) {
    let actorTmp = await API.actor(actor);
    actorTmp.items.forEach(async (item) => {
      await item.onShortRest();
      if (isNewDay) await item.onNewDay();
    });
  },

  /**
   * Method handling a long-rest action for magic items
   * @param {string/Actor/UUID} actor The actor to use for retrieve the Actor
   * @param {Boolean} isNewDay Check whether it's a new day
   */
  async execActorLongRestUnderHood(actor, isNewDay) {
    let actorTmp = await API.actor(actor);
    actorTmp.items.forEach(async (item) => {
      await item.onLongRest();
      if (isNewDay) await item.onNewDay();
    });
  },
};

export default API;
