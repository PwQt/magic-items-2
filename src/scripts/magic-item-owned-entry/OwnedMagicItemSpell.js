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

    let applyActiveEffects = async (item) => {
      canvas.tokens.controlled?.forEach((token) => {
        if (!token) {
          Logger.warn("No token selected", true);
          return;
        }
        let actor = token.actor;
        item?.effects.toObject().forEach((effect) => {
          const existingEffect = actor?.effects.find((e) => e.origin === item.uuid);
          if (existingEffect) {
            return existingEffect.update({ disabled: !existingEffect.disabled });
          }
          effect = mergeObject(effect, {
            disabled: false,
            transfer: false,
            origin: item.uuid,
          });
          let ae = ActiveEffect.implementation.create(effect, { parent: actor });
          if (!ae) {
            Logger.warn("An error occured while adding active effect - please check console", true);
          }
        });
      });
    };

    let proceed = async () => {
      let spell = this.ownedItem;
      if (upcastLevel !== spell.system.level) {
        spell = spell.clone({ "system.level": upcastLevel }, { keepId: true });
        spell.prepareFinalAttributes();
      }

      if (spell.effects?.size > 0) {
        spell = spell.clone({ effects: {} }, { keepId: true });
        spell.prepareFinalAttributes();
      }

      let chatData = await spell.use(
        {},
        {
          configureDialog: false,
          createMessage: true,
          flags: {
            "dnd5e.itemData": this.ownedItem.toJSON(),
          },
        },
      );
      if (chatData) {
        this.consume(consumption);
        this.magicItem.update();
      }
      // if (this.ownedItem.effects?.size > 0) {
      //   this.activeEffectMessage(() => {
      //     this.applyActiveEffects(this.ownedItem);
      //   });
      // }
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
