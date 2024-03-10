import Logger from "../lib/Logger";
import { MagicItemHelpers } from "../magic-item-helpers";

export class AbstractMagicItemEntry {
  constructor(data) {
    mergeObject(this, data);
  }

  get displayName() {
    return MagicItemHelpers.getEntityNameCompendiumWithBabele(this.pack, this.name);
  }

  async renderSheet() {
    this.entity().then((entity) => {
      entity.ownership.default = CONST.DOCUMENT_PERMISSION_LEVELS.LIMITED;
      const sheet = entity.sheet;
      sheet.render(true);
    });
  }

  entity() {
    return new Promise((resolve, reject) => {
      if (this.pack === "world") {
        let entity = this.entityCls().collection.instance.get(this.id);
        if (entity) {
          resolve(entity);
        } else {
          Logger.warn(game.i18n.localize("MAGICITEMS.WarnNoMagicItemSpell") + this.name, true);
          reject();
        }
      } else {
        const pack = game.packs.find((p) => p.collection === this.pack);
        if (!pack) {
          Logger.warn(`Cannot retrieve pack for if ${this.pack}`, true);
        } else {
          pack.getDocument(this.id)?.then((entity) => {
            if (entity) {
              resolve(entity);
            } else {
              Logger.warn(game.i18n.localize("MAGICITEMS.WarnNoMagicItemSpell") + this.name, true);
              reject();
            }
          });
        }
      }
    });
  }

  entityCls() {
    return CONFIG["Item"];
  }

  data() {
    return new Promise((resolve) => {
      this.entity().then((entity) => {
        resolve(entity.toJSON());
      });
    });
  }
}
