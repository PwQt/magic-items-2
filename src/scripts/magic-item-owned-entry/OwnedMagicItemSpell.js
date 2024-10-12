import Logger from "../lib/Logger";
import { MagicItemUpcastDialog } from "../magicitemupcastdialog";
import { AbstractOwnedMagicItemEntry } from "./AbstractOwnedMagicItemEntry";
import { MagicItemHelpers } from "../magic-item-helpers";

export class OwnedMagicItemSpell extends AbstractOwnedMagicItemEntry {
  async roll() {
    let upcastLevel = this.item.level;
    let consumption = this.item.consumption;

    if (!this.ownedItem) {
      let data = await this.item.data();

      if (typeof data.system.activities.includes(save.scaling) === "undefined") {
        data = foundry.utils.mergeObject(data, {
          "system.save.scaling": "spell",
        });
      }

      if (this.item.flatDc) {
        data = foundry.utils.mergeObject(data, {
          "system.save.scaling": "flat",
          "system.save.dc": this.item.dc,
        });
      }

      data = foundry.utils.mergeObject(data, {
        "system.preparation": { mode: "magicitems" },
      });

      data = foundry.utils.mergeObject(data, {
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

    let proceed = async () => {
      let spell = this.ownedItem;
      let clonedOwnedItem = this.ownedItem;
      let configSpellUpcast = spell.system.level;

      if (spell.system.level === 0 && !MagicItemHelpers.isLevelScalingSettingOn()) {
        spell = spell.clone({ "system.scaling": "none" }, { keepId: true });
        clonedOwnedItem = clonedOwnedItem.clone({ "system.scaling": "none" }, { keepId: true });
        spell.prepareFinalAttributes();
      }

      if (upcastLevel !== spell.system.level) {
        configSpellUpcast = upcastLevel;
      }

      if (spell.effects?.size > 0 && !MagicItemHelpers.isMidiItemEffectWorkflowOn()) {
        spell = spell.clone({ effects: {} }, { keepId: true });
        spell.prepareFinalAttributes();
      }

      let chatData = await spell.use(
        {
          slotLevel: configSpellUpcast,
        },
        {
          configureDialog: false,
          createMessage: true,
          flags: {
            "dnd5e.itemData": clonedOwnedItem.toJSON(),
          },
        },
      );
      if (chatData) {
        await this.consume(consumption);
        if (!this.magicItem.isDestroyed) {
          this.magicItem.update();
        }
      }
      if (this.ownedItem.effects?.size > 0 && !MagicItemHelpers.isMidiItemEffectWorkflowOn()) {
        this.activeEffectMessage(async () => {
          await this.applyActiveEffects(this.ownedItem);
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
