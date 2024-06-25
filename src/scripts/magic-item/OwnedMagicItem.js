import { MAGICITEMS } from "../config";
import CONSTANTS from "../constants/constants";
import Logger from "../lib/Logger";
import { MagicItemHelpers } from "../magic-item-helpers";
import { OwnedMagicItemFeat } from "../magic-item-owned-entry/OwnedMagicItemFeat";
import { OwnedMagicItemSpell } from "../magic-item-owned-entry/OwnedMagicItemSpell";
import { OwnedMagicItemTable } from "../magic-item-owned-entry/OwnedMagicItemTable";
import { MagicItem } from "./MagicItem";

export class OwnedMagicItem extends MagicItem {
  constructor(item, actor, magicItemActor, flagsData) {
    super(flagsData);
    this.uuid = item.uuid;
    this.id = item.id;
    this.item = item;
    this.actor = actor;
    this.name = item.name;
    this.img = item.img;
    this.pack = item.pack;
    this.isDestroyed = false;
    this.uses = parseInt("uses" in flagsData ? flagsData.uses : this.charges);

    this.rechargeableLabel = this.rechargeable
      ? `(${game.i18n.localize("MAGICITEMS.SheetRecharge")}: ${this.rechargeText} ${
          MagicItemHelpers.localized(MAGICITEMS.rechargeUnits)[this.rechargeUnit]
        } )`
      : game.i18n.localize("MAGICITEMS.SheetNoRecharge");

    this.magicItemActor = magicItemActor;

    this.ownedEntries = this.spells.map((item) => new OwnedMagicItemSpell(this, item));
    this.ownedEntries = this.ownedEntries.concat(this.feats.map((item) => new OwnedMagicItemFeat(this, item)));
    this.ownedEntries = this.ownedEntries.concat(this.tables.map((table) => new OwnedMagicItemTable(this, table)));

    this.instrument();
  }

  /**
   *
   */
  instrument() {
    this.item.roll = this.itemRoll(this.item.roll, this);
  }

  /**
   * Tests if the owned magic items can visualize his powers.
   */
  get visible() {
    let identifiedOnly = game.settings.get(CONSTANTS.MODULE_ID, "identifiedOnly");
    return this.item?.type === "feat" || !identifiedOnly || this.item.system.identified;
  }

  /**
   * Tests if the owned magic items is active.
   */
  get active() {
    let active = true;
    if (this.equipped) {
      active = active && this.item.system.equipped;
    }
    if (this.attuned) {
      let isAttuned =
        this.item.system.attunement === 2 ||
        this.item.system.attuned === true; /* this.item.system.attuned is a legacy property; can be undefined */
      active = active && isAttuned;
    }
    return active;
  }

  itemRoll(original, me) {
    return async function () {
      me.triggerTables();
      return await original.apply(me.item, arguments);
    };
  }

  isFull() {
    return this.uses === this.charges;
  }

  setUses(uses) {
    this.uses = uses;
  }

  async roll(itemId) {
    let ownedItem = this.ownedEntries.filter((entry) => entry.id === itemId)[0];
    await ownedItem.roll();
  }

  rollByName(itemName) {
    let found = this.ownedEntries.filter((entry) => entry.name === itemName);
    if (!found.length) {
      Logger.warn(game.i18n.localize("MAGICITEMS.WarnNoMagicItemSpell") + itemName, true);
      return;
    }
    found[0].roll();
  }

  async destroyItem() {
    await this.magicItemActor.destroyItem(this);
  }

  async consume(consumption) {
    this.uses = Math.max(this.uses - consumption, 0);
    if (await this.destroyed()) {
      if (this.destroyType === "dt1") {
        this.isDestroyed = true;
        await this.destroyItem();
      } else {
        this.toggleEnabled(false);
      }
    }
  }

  async destroyed() {
    let destroyed = this.uses === 0 && this.destroy;
    if (destroyed && this.destroyCheck === "d2") {
      let r = new Roll("1d20");
      await r.evaluate();
      destroyed = r.total === 1;
      await r.toMessage({
        flavor: `<b>${this.name}</b> ${game.i18n.localize("MAGICITEMS.MagicItemDestroyCheck")}
                        - ${
                          destroyed
                            ? game.i18n.localize("MAGICITEMS.MagicItemDestroyCheckFailure")
                            : game.i18n.localize("MAGICITEMS.MagicItemDestroyCheckSuccess")
                        }`,
        speaker: ChatMessage.getSpeaker({ actor: this.actor, token: this.actor.token }),
      });
    } else if (destroyed && this.destroyCheck === "d3") {
      let r = new Roll("1d20");
      await r.evaluate();
      destroyed = r.total <= this.destroyDC;
      await r.toMessage({
        flavor: `<b>${this.name}</b> ${game.i18n.localize("MAGICITEMS.MagicItemDestroyCheck")}
                        - ${
                          destroyed
                            ? game.i18n.localize("MAGICITEMS.MagicItemDestroyCheckFailure")
                            : game.i18n.localize("MAGICITEMS.MagicItemDestroyCheckSuccess")
                        }`,
        speaker: ChatMessage.getSpeaker({ actor: this.actor, token: this.actor.token }),
      });
    }
    if (destroyed) {
      ChatMessage.create({
        user: game.user._id,
        speaker: ChatMessage.getSpeaker({ actor: this.actor }),
        content: this.formatMessage(`<b>${this.name}</b> ${this.destroyFlavorText}`),
      });
    }
    return destroyed;
  }

  async onShortRest() {
    if (this.rechargeable && this.rechargeUnit === MAGICITEMS.SHORT_REST) {
      return await this.doRecharge();
    }
  }

  async onLongRest() {
    if (this.rechargeable && [MAGICITEMS.LONG_REST, MAGICITEMS.SHORT_REST].includes(this.rechargeUnit)) {
      return await this.doRecharge();
    }
  }

  async onNewDay() {
    if (this.rechargeable && [MAGICITEMS.DAILY, MAGICITEMS.DAWN, MAGICITEMS.SUNSET].includes(this.rechargeUnit)) {
      return await this.doRecharge();
    }
  }

  async doRecharge() {
    let amount = 0,
      updated = 0,
      msg = `<b>Magic Item:</b> ${this.rechargeableLabel}<br>`;

    let prefix = game.i18n.localize("MAGICITEMS.SheetRechargedBy");
    let postfix = game.i18n.localize("MAGICITEMS.SheetChargesLabel");
    if (this.rechargeType === MAGICITEMS.NUMERIC_RECHARGE) {
      amount = parseInt(this.recharge);
      msg += `<b>${prefix}</b>: ${this.recharge} ${postfix}`;
    }
    if (this.rechargeType === MAGICITEMS.FORMULA_RECHARGE) {
      let r = new Roll(this.recharge);
      await r.evaluate();
      amount = r.total;
      msg += `<b>${prefix}</b>: ${r.result} = ${r.total} ${postfix}`;
    }
    if (this.rechargeType === MAGICITEMS.FORMULA_FULL) {
      msg += `<b>${game.i18n.localize("MAGICITEMS.RechargeTypeFullText")}</b>`;
    }

    if (this.chargesOnWholeItem) {
      if (this.isFull()) {
        return;
      }

      if (this.rechargeType === MAGICITEMS.FORMULA_FULL) {
        updated = this.charges;
      } else {
        updated = Math.min(this.uses + amount, parseInt(this.charges));
      }

      this.setUses(updated);
    } else {
      if (this.ownedEntries.filter((entry) => !entry.isFull()).length === 0) {
        return;
      }

      this.ownedEntries.forEach((entry) => {
        if (this.rechargeType === MAGICITEMS.FORMULA_FULL) {
          entry.uses = this.charges;
        } else {
          entry.uses = Math.min(entry.uses + amount, parseInt(this.charges));
        }
      });
    }

    this.update();

    ChatMessage.create({
      speaker: { actor: this.actor },
      type: CONST.CHAT_MESSAGE_TYPES.OTHER,
      content: this.formatMessage(msg),
    });
  }

  entryBy(itemId) {
    return this.ownedEntries.filter((entry) => entry.id === itemId)[0];
  }

  ownedItemBy(itemId) {
    return this.entryBy(itemId).ownedItem;
  }

  triggerTables() {
    this.triggeredTables.forEach((table) => table.roll());
  }

  destroyItemEntry(entry) {
    if (this.hasSpell(entry.id)) {
      this.removeSpell(this.spells.findIndex((spell) => spell.id === entry.id));
    }
  }

  update() {
    this.magicItemActor.suspendListening();
    this.item
      .update({
        flags: {
          [CONSTANTS.MODULE_ID]: this.serializeData(),
        },
      })
      .then(() => {
        this.magicItemActor.resumeListening();
      });
  }

  formatMessage(msg) {
    return `
            <div class="dnd5e chat-card item-card">
                <header class="card-header flexrow">
                    <img src="${this.img}" title="Palla di Fuoco" width="36" height="36" />
                    <h3 class="item-name">${this.name}</h3>
                </header>

                <div class="card-content">${msg}</div>
            </div>`;
  }
}
