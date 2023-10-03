export class MagicItemEntry {
  constructor(data) {
    mergeObject(this, data);
  }

  get displayName() {
    if (this.pack !== "world" && game.babele?.isTranslated(this.pack)) {
      return game.babele.translateField("name", this.pack, { name: this.name });
    } else {
      return this.name;
    }
  }

  renderSheet() {
    this.entity().then((entity) => {
      const sheet = entity.sheet;
      if (this.pack === "world") {
        sheet.options.compendium = this.pack;
      } else {
        sheet.options.editable = false;
      }
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
          ui.notifications.warn(game.i18n.localize("MAGICITEMS.WarnNoMagicItemSpell") + itemName);
          reject();
        }
      } else {
        const pack = game.packs.find((p) => p.collection === this.pack);
        pack.getDocument(this.id).then((entity) => {
          resolve(entity);
        });
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
