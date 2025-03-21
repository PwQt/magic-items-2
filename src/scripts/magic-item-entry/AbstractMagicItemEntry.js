import CONSTANTS from "../constants/constants";
import Logger from "../lib/Logger";
import { RetrieveHelpers } from "../lib/retrieve-helpers";
import { MagicItemHelpers } from "../magic-item-helpers";

export class AbstractMagicItemEntry {
  constructor(data) {
    foundry.utils.mergeObject(this, data);
    // Patch retrocompatbility
    if (this.pack?.startsWith("magic-items")) {
      this.pack = this.pack.replace("magic-items-2.", `${CONSTANTS.MODULE_ID}.`);
    }
    // Generate Uuid runtime
    if (!this.uuid) {
      try {
        this.uuid = RetrieveHelpers.retrieveUuid({
          documentName: this.name,
          documentId: this.id,
          documentCollectionType: this.collectionType,
          documentPack: this.pack,
          ignoreError: true,
        });
      } catch (e) {
        Logger.error("Cannot retrieve uuid", false, e);
        this.uuid = "";
      }
    }
    this.removed = !RetrieveHelpers.stringIsUuid(this.uuid);
  }

  get displayName() {
    return MagicItemHelpers.getEntityNameCompendiumWithBabele(this.pack, this.name);
  }

  async renderSheet() {
    let entity = await MagicItemHelpers.fetchEntity(this);
    entity.ownership.default = CONST.DOCUMENT_OWNERSHIP_LEVELS.LIMITED;
    const sheet = entity.sheet;
    sheet.render(true);
  }

  async data() {
    return await MagicItemHelpers.fetchEntity(this);
  }
}
