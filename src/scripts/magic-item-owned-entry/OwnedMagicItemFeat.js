import { AbstractOwnedMagicItemEntry } from "./AbstractOwnedMagicItemEntry";

export class OwnedMagicItemFeat extends AbstractOwnedMagicItemEntry {
  async roll() {
    let consumption = this.item.consumption;

    if (!this.ownedItem) {
      let data = await this.item.data();

      data = mergeObject(data, {
        "system.uses": null,
      });

      const cls = CONFIG.Item.documentClass;
      this.ownedItem = new cls(data, { parent: this.magicItem.actor });
      this.ownedItem.prepareFinalAttributes();
    }

    let onUsage =
      this.item.effect === "e1"
        ? () => {
            this.consume(consumption);
          }
        : () => {
            ChatMessage.create({
              user: game.user._id,
              speaker: ChatMessage.getSpeaker({ actor: this.magicItem.actor }),
              content: this.magicItem.formatMessage(
                `<b>${this.name}</b>: ${game.i18n.localize("MAGICITEMS.SheetConsumptionDestroyMessage")}`
              ),
            });

            this.magicItem.destroyItem();
          };

    let proceed = async () => {
      let chatData = await this.ownedItem.use(
        {},
        {
          createMessage: false,
          configureDialog: false,
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
        onUsage();
        this.magicItem.update();
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
