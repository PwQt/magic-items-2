import { MAGICITEMS } from "../config";
import Logger from "../lib/Logger";
import { MagicItemHelpers } from "../magic-item-helpers";
import { AbstractMagicItemEntry } from "./AbstractMagicItemEntry";

export class MagicItemTable extends AbstractMagicItemEntry {
  entityCls() {
    return CONFIG["RollTable"];
  }

  get usages() {
    return MagicItemHelpers.localized(MAGICITEMS.tableUsages);
  }

  async roll(actor) {
    let entity = await MagicItemHelpers.fetchEntity(this);
    let result = await entity.draw();
    if (result && result.results && result.results.length === 1 && result.results[0].collection) {
      const collectionId = result.results[0].documentCollection;
      const id = result.results[0].documentId;
      const pack = game.collections.get(collectionId) || game.packs.get(collectionId);
      if (!pack) {
        Logger.warn(`Cannot retrieve pack for if ${collectionId}`, true);
      } else {
        const entity = pack.getDocument ? await pack.getDocument(id) : pack.get(id);
        if (entity) {
          let item = (await actor.createEmbeddedDocuments("Item", [entity]))[0];
          const chatData = await item.use({}, { createMessage: false });

          if (!game.modules.get("ready-set-roll-5e")?.active) {
            ChatMessage.create(
              foundry.utils.mergeObject(chatData, {
                "flags.dnd5e.itemData": item,
              }),
            );
          }
        }
      }
    }
  }

  serializeData() {
    return {
      consumption: this.consumption,
      id: this.id,
      uuid: this.uuid,
      img: this.img,
      name: this.name,
      pack: this.pack,
    };
  }
}
