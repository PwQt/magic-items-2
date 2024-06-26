import { AbstractOwnedMagicItemEntry } from "./AbstractOwnedMagicItemEntry";
import { MagicItemHelpers } from "../magic-item-helpers";

export class OwnedMagicItemFeat extends AbstractOwnedMagicItemEntry {
  async roll() {
    let consumption = this.item.consumption;

    if (!this.ownedItem) {
      let data = await this.item.data();

      data = mergeObject(data, {
        "system.uses": null,
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

    let onUsage =
      this.item.effect === "e1"
        ? async () => {
            await this.consume(consumption);
          }
        : async () => {
            ChatMessage.create({
              user: game.user._id,
              speaker: ChatMessage.getSpeaker({ actor: this.magicItem.actor }),
              content: this.magicItem.formatMessage(
                `<b>${this.name}</b>: ${game.i18n.localize("MAGICITEMS.SheetConsumptionDestroyMessage")}`,
              ),
            });

            await this.magicItem.destroyItem();
          };

    let proceed = async () => {
      let feat = this.ownedItem;
      if (feat.effects?.size > 0 && !MagicItemHelpers.isMidiItemEffectWorkflowOn()) {
        feat = feat.clone({ effects: {} }, { keepId: true });
        feat.prepareFinalAttributes();
      }
      let chatData = await feat.use(
        {},
        {
          createMessage: true,
          configureDialog: false,
          flags: {
            "dnd5e.itemData": this.ownedItem.toJSON(),
          },
        },
      );
      if (chatData) {
        await onUsage();
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

    if (this.item.effect === "e2" || this.hasCharges(consumption)) {
      await proceed();
    } else {
      this.showNoChargesMessage(() => {
        proceed();
      });
    }
  }
}
