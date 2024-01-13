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
      if (upcastLevel !== spell.system.level) {
        spell = spell.clone({ "system.level": upcastLevel }, { keepId: true });
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
