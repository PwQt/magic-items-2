import { MAGICITEMS } from "../config";
import { MagiItemHelpers } from "../magic-item-helpers";
import { AbstractMagicItemEntry } from "./AbstractMagicItemEntry";

export class MagicItemTable extends AbstractMagicItemEntry {
  entityCls() {
    return CONFIG["RollTable"];
  }

  get usages() {
    return MagiItemHelpers.localized(MAGICITEMS.tableUsages);
  }

  async roll(actor) {
    let entity = await this.entity();
    let result = await entity.draw();
    if (result && result.results && result.results.length === 1 && result.results[0].collection) {
      const collectionId = result.results[0].documentCollection;
      const id = result.results[0].documentId;
      const pack = game.collections.get(collectionId) || game.packs.get(collectionId);

      const entity = pack.getDocument ? await pack.getDocument(id) : pack.get(id);
      if (entity) {
        let item = (await actor.createEmbeddedDocuments("Item", [entity]))[0];
        const chatData = await item.use({}, { createMessage: false });
        // Fix https://github.com/PwQt/magic-items-2/issues/22
        if (!game.modules.get("ready-set-roll-5e")?.active) {
          ChatMessage.create(
            mergeObject(chatData, {
              "flags.dnd5e.itemData": item,
            })
          );
        }
      }
    }
  }

  serializeData() {
    return {};
  }
}
