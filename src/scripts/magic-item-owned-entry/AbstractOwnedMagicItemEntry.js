import CONSTANTS from "../constants/constants";
import Logger from "../lib/Logger";
import { RetrieveHelpers } from "../lib/retrieve-helpers";

export class AbstractOwnedMagicItemEntry {
  constructor(magicItem, item) {
    this.magicItem = magicItem;
    this.item = item;
    this.uses = parseInt("uses" in this.item ? this.item.uses : this.magicItem.charges);

    // Patch retrocompatbility
    if (this.item.pack?.startsWith("magic-items")) {
      this.item.pack = this.item.pack.replace("magic-items-2.", `${CONSTANTS.MODULE_ID}.`);
    }
    // Generate Uuid runtime
    if (!this.item.uuid) {
      try {
        this.item.uuid = RetrieveHelpers.retrieveUuid({
          documentName: this.item.name,
          documentId: this.item.id,
          documentCollectionType: this.item.collectionType,
          documentPack: this.item.pack,
          ignoreError: true,
        });
      } catch (e) {
        Logger.error("Cannot retrieve uuid", false, e);
        this.item.uuid = "";
      }
    }
    this.item.removed = !RetrieveHelpers.stringIsUuid(this.item.uuid);
  }

  get uuid() {
    return this.item.uuid;
  }

  get id() {
    return this.item.id;
  }

  get name() {
    return this.item.name;
  }

  get img() {
    return this.item.img;
  }

  get uses() {
    return this.item.uses;
  }

  get destroyDC() {
    return this.item.destroyDC;
  }

  set uses(uses) {
    this.item.uses = uses;
  }

  isFull() {
    return this.uses === this.magicItem.charges;
  }

  hasCharges(consumption) {
    let uses = this.magicItem.chargesOnWholeItem ? this.magicItem.uses : this.uses;
    return uses - consumption >= 0;
  }

  async consume(consumption) {
    if (this.magicItem.chargesOnWholeItem) {
      await this.magicItem.consume(consumption);
    } else {
      this.uses = Math.max(this.uses - consumption, 0);
      if (await this.destroyed()) {
        this.magicItem.destroyItemEntry(this.item);
      } else {
        this.showLeftChargesMessage();
      }
    }
  }

  async destroyed() {
    let destroyed = this.uses === 0 && this.magicItem.destroy;
    if (destroyed && this.magicItem.destroyCheck === "d2") {
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
        speaker: ChatMessage.getSpeaker({ actor: this.magicItem.actor, token: this.magicItem.actor.token }),
      });
    } else if (destroyed && this.magicItem.destroyCheck === "d3") {
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
        speaker: ChatMessage.getSpeaker({ actor: this.magicItem.actor }),
        content: this.magicItem.formatMessage(`<b>${this.name}</b> ${this.magicItem.destroyFlavorText}`),
      });
    }
    return destroyed;
  }

  async showNoChargesMessage(callback) {
    const message = game.i18n.localize("MAGICITEMS.SheetNoChargesMessage");
    const dialog = new foundry.applications.api.DialogV2({
      window: { title: game.i18n.localize("MAGICITEMS.SheetDialogTitle") },
      content: `<p>
                  <b>${this.magicItem.name}</b> - ${message} <b>${this.item.name}</b>
                </p>`,
      rejectClose: false,
      buttons: [
        {
          action: "use",
          icon: "fas fa-check",
          label: game.i18n.localize("MAGICITEMS.SheetDialogUseAnyway"),
          callback: (event, button, dialog) => callback(),
        },
        {
          action: "close",
          label: game.i18n.localize("MAGICITEMS.SheetDialogClose"),
          icon: "fas fa-times",
          default: true,
          callback: () => dialog.close(),
        },
      ],
    });
    dialog.render({ force: true });
  }

  activeEffectMessage(callback) {
    const message = game.i18n.localize("MAGICITEMS.ToggleActiveEffectDialogMessage");
    const title = game.i18n.localize("MAGICITEMS.ToggleActiveEffectDialogTitle");
    const dialog = new foundry.applications.api.DialogV2({
      window: { title: title },
      content: `<p>${message}</p>`,
      rejectClose: false,
      buttons: [
        {
          action: "use",
          icon: "fas fa-check",
          label: game.i18n.localize("MAGICITEMS.ToggleActiveEffectDialogYes"),
          callback: () => callback(),
          default: true,
        },
        {
          action: "close",
          icon: "fas fa-times",
          label: game.i18n.localize("MAGICITEMS.ToggleActiveEffectDialogNo"),
          callback: () => dialog.close(),
        },
      ],
    });
    dialog.render({ force: true });
  }

  async askSummonningMessage(summonOptions) {
    let html = await renderTemplate(
      `modules/${CONSTANTS.MODULE_ID}/templates/magic-item-summon-dialog.hbs`,
      summonOptions,
    );
    let dialog = await foundry.applications.api.DialogV2.prompt({
      window: {
        title: game.i18n.localize("MAGICITEMS.SummoningDialogTitle"),
      },
      content: html,
      modal: true,
      rejectClose: false,
      ok: {
        label: game.i18n.localize("MAGICITEMS.SummoningDialogButton"),
        icon: "fas fa-wand-magic-sparkles",
        callback: (event, button, dialog) => button.form.elements,
      },
    });
    return dialog;
  }

  computeSaveDC(item) {
    const data = this.magicItem.actor.system;
    data.attributes.spelldc = data.attributes.spellcasting ? data.abilities[data.attributes.spellcasting].dc : 10;

    const save = item.system.save;
    if (save?.ability) {
      if (save.scaling === "spell") save.dc = data.attributes.spelldc;
      else if (save.scaling !== "flat") save.dc = data.abilities[save.scaling]?.dc ?? 10;
      const ability = CONFIG.DND5E.abilities[save.ability];
      item.labels.save = game.i18n.format("DND5E.SaveDC", { dc: save.dc || "", ability });
    }
  }

  async applyActiveEffects(item) {
    canvas.tokens.controlled?.forEach((token) => {
      if (!token) {
        Logger.warn("No token selected", true);
        return;
      }
      let actor = token.actor;

      item?.effects.toObject()?.forEach(async (effect) => {
        if (!game.user.isGM && !actor?.isOwner) {
          return;
        }
        const existingEffect = actor?.effects?.find((e) => e.origin === item.uuid);
        if (existingEffect) {
          existingEffect.update({ disabled: !existingEffect.disabled });
          return;
        }
        effect = foundry.utils.mergeObject(effect, {
          disabled: false,
          transfer: false,
          origin: item.uuid,
        });
        const ae = await ActiveEffect.implementation.create(effect, { parent: actor });
        if (!ae) {
          Logger.warn(game.i18n.localize("MAGICITEMS.ToggleActiveEffectError"), true);
        }
      });
    });
  }

  showLeftChargesMessage() {
    if (game.settings.get(CONSTANTS.MODULE_ID, "showLeftChargesChatMessage")) {
      const charges = this.magicItem.chargesOnWholeItem ? this.magicItem.uses : this.uses;
      const maxCharges = parseInt("uses" in this.item ? this.item.uses : this.magicItem.charges);
      Logger.debug(`Charges: ${charges}, MaxCharges: ${maxCharges}`);
      if (charges !== 0) {
        ChatMessage.create({
          user: game.user_id,
          speaker: ChatMessage.getSpeaker({ actor: this.magicItem.actor, token: this.magicItem.actor.token }),
          content: game.i18n.format(game.i18n.localize("MAGICITEMS.ShowChargesMessage"), {
            name: this.magicItem.name,
            chargesLeft: charges,
            chargesMax: maxCharges,
          }),
        });
      }
    }
  }
}
