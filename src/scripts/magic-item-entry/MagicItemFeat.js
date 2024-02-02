import { MAGICITEMS } from "../config";
import { MagicItemHelpers } from "../magic-item-helpers";
import { AbstractMagicItemEntry } from "./AbstractMagicItemEntry";

export class MagicItemFeat extends AbstractMagicItemEntry {
  constructor(data) {
    super(data);
    this.effect = this.effect ? this.effect : "e1";
  }

  consumptionLabel() {
    return this.effect === "e1"
      ? `${game.i18n.localize("MAGICITEMS.SheetConsumptionConsume")}: ${this.consumption}`
      : game.i18n.localize(`MAGICITEMS.SheetConsumptionDestroy`);
  }

  serializeData() {
    return {
      consumption: this.consumption,
      uuid: this.uuid,
      id: this.id,
      img: this.img,
      name: this.name,
      pack: this.pack,
      uses: this.uses,
      effect: this.effect,
    };
  }

  get effects() {
    return MagicItemHelpers.localized(MAGICITEMS.effects);
  }
}
