import { MagiItemHelpers } from "../magic-item-helpers";
import { MagicItemEntry } from "./AbstractMagicItemEntry";

export class MagicItemTable extends MagicItemEntry {
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
        ChatMessage.create(
          mergeObject(chatData, {
            "flags.dnd5e.itemData": item,
          })
        );
      }
    }
  }

  serializeData() {
    return {};
  }
}
