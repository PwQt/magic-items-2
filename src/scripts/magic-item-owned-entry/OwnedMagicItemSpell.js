import Logger from "../lib/Logger";
import { MagicItemUpcastDialog } from "../magicitemupcastdialog";
import { AbstractOwnedMagicItemEntry } from "./AbstractOwnedMagicItemEntry";
import { MagicItemHelpers } from "../magic-item-helpers";
import { RetrieveHelpers } from "../lib/retrieve-helpers";

export class OwnedMagicItemSpell extends AbstractOwnedMagicItemEntry {
  async roll() {
    let upcastLevel = this.item.level;
    let consumption = this.item.consumption;

    if (!this.ownedItem) {
      let data = await this.item.data();

      if (typeof data.system.save.scaling === "undefined") {
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

      if (data.system.actionType === "rsak" || data.system.actionType === "msak") {
        let attackBonusValue = this.item.atkBonus.toString();
        if (!this.item.checkAtkBonus) {
          attackBonusValue = this.magicItem.actor?.system?.attributes?.prof?.toString();
        }
        if (data.system.attack.bonus) {
          data.system.attack.bonus += `+ ${attackBonusValue}`;
        } else {
          data.system.attack.bonus = attackBonusValue;
        }
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
      let itemUseConfiguration = {};

      if (
        MagicItemHelpers.canSummon() &&
        (spell.system.summons?.creatureTypes?.length > 1 || spell.system.summons?.profiles?.length > 1)
      ) {
        const sOptions = MagicItemHelpers.createSummoningOptions(spell);
        const summoningDialogResult = await this.askSummonningMessage(sOptions);
        if (summoningDialogResult) {
          foundry.utils.mergeObject(itemUseConfiguration, {
            createSummons: summoningDialogResult.createSummons?.value === "on",
            summonsProfile: summoningDialogResult.summonsProfile?.value,
            summonsOptions: {
              creatureType: summoningDialogResult.creatureType?.value,
              creatureSize: summoningDialogResult.creatureSize?.value,
            },
          });
        } else {
          Logger.info(`The summoning dialog has been dismissed, not using the item.`);
          return;
        }
      }

      if (spell.system.level === 0 && !MagicItemHelpers.isLevelScalingSettingOn()) {
        spell = spell.clone({ "system.scaling": "none" }, { keepId: true });
        clonedOwnedItem = clonedOwnedItem.clone({ "system.scaling": "none" }, { keepId: true });
        spell.prepareFinalAttributes();
      }

      if (upcastLevel !== spell.system.level) {
        foundry.utils.mergeObject(itemUseConfiguration, {
          slotLevel: upcastLevel,
        });
      }

      if (spell.effects?.size > 0 && !MagicItemHelpers.isMidiItemEffectWorkflowOn()) {
        spell = spell.clone({ effects: {} }, { keepId: true });
        spell.prepareFinalAttributes();
      }

      let chatData = await spell.use(itemUseConfiguration, {
        configureDialog: false,
        createMessage: true,
        flags: {
          "dnd5e.itemData": clonedOwnedItem,
        },
      });
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
      this.showNoChargesMessage(async () => {
        await proceed();
      });
    }
  }
}
