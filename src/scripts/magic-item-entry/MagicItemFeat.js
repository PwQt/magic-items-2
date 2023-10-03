import { MagiItemHelpers } from "../magic-item-helpers";
import { MagicItemEntry } from "./AbstractMagicItemEntry";

export class MagicItemFeat extends MagicItemEntry {
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
      id: this.id,
      img: this.img,
      name: this.name,
      pack: this.pack,
      uses: this.uses,
      effect: this.effect,
    };
  }

  get effects() {
    return MagiItemHelpers.localized(MAGICITEMS.effects);
  }
}
