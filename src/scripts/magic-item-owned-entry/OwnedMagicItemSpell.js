import Logger from "../lib/Logger";
import { MagicItemUpcastDialog } from "../magicitemupcastdialog";
import { AbstractOwnedMagicItemEntry } from "./AbstractOwnedMagicItemEntry";

export class OwnedMagicItemSpell extends AbstractOwnedMagicItemEntry {
  async roll() {
    let upcastLevel = this.item.level;
    let consumption = this.item.consumption;

    if (!this.ownedItem) {
      let data = await this.item.data();

      if (typeof data.system.save.scaling === "undefined") {
        data = mergeObject(data, {
          "system.save.scaling": "spell",
        });
      }

      if (this.item.flatDc) {
        data = mergeObject(data, {
          "system.save.scaling": "flat",
          "system.save.dc": this.item.dc,
        });
      }

      data = mergeObject(data, {
        "system.preparation": { mode: "magicitems" },
      });

      data = mergeObject(data, {
        "flags.core": {
          sourceId: this.item.uuid,
        },
      });

      const cls = CONFIG.Item.documentClass;
      this.ownedItem = new cls(data, { parent: this.magicItem.actor });
      this.ownedItem.prepareFinalAttributes();
    }

    if (this.item.canUpcast()) {
      const spellFormData = await MagicItemUpcastDialog.create(this.magicItem, this.item);
      upcastLevel = parseInt(spellFormData.get("level"));
      consumption = parseInt(spellFormData.get("consumption"));
    }

    let applyActiveEffects = async (effects) => {
      let token = canvas.tokens.controlled[0];
      if (!token) {
        ui.notification.warn("No token selected");
        return;
      }
      let actor = token.actor;

      effects.toObject().forEach((effect) => {
        const existingEffect = actor?.effects.find((e) => e.origin === effect.uuid);
        if (existingEffect) {
          return existingEffect.update({ disabled: !existingEffect.disabled });
        }
        effect = mergeObject(effect, {
          disabled: false,
          transfer: false,
          origin: effect.uuid,
        });
        let ae = ActiveEffect.implementation.create(effect, { parent: actor });
        if (!ae) {
          ui.notification.warn("An error occured while adding active effect - please check console");
        }
      });
    };

    let proceed = async () => {
      Logger.logObject(this.ownedItem);
      let spell = this.ownedItem;
      if (upcastLevel !== spell.system.level) {
        spell = spell.clone({ "system.level": upcastLevel }, { keepId: true });
        spell.prepareFinalAttributes();
      }

      Logger.debug(`Start here!`);
      if (spell.effects?.size > 0) {
        Logger.debug(`I entered into effects!`);
        spell = spell.clone({ effects: {} }, { keepId: true });
        spell.prepareFinalAttributes();
      }

      let chatData = await spell.use(
        {},
        {
          configureDialog: false,
          createMessage: false,
        }
      );
      if (chatData) {
        Logger.debug(chatData);
        Logger.debug(spell);
        // Fix https://github.com/PwQt/magic-items-2/issues/22
        if (!game.modules.get("ready-set-roll-5e")?.active) {
          ChatMessage.create(
            mergeObject(chatData, {
              "flags.dnd5e.itemData": this.ownedItem.toJSON(),
            })
          );
        }
        this.consume(consumption);
        this.magicItem.update();
      }
      if (this.ownedItem.effects?.size > 0) {
        this.activeEffectMessage(() => {
          applyActiveEffects(this.ownedItem.effects);
        });
      }
    };

    if (this.hasCharges(consumption)) {
      await proceed();
    } else {
      this.showNoChargesMessage(() => {
        proceed();
      });
    }
  }
}
