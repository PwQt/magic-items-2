import { MAGICITEMS } from "../config";
import Logger from "../lib/Logger";
import { RetrieveHelpers } from "../lib/retrieve-helpers";
import { MagicItemHelpers } from "../magic-item-helpers";
import { AbstractMagicItemEntry } from "./AbstractMagicItemEntry";

export class MagicItemFeat extends AbstractMagicItemEntry {
  constructor(data) {
    super(data);
    this.effect = this.effect ? this.effect : "e1";
    this.getData(data);
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
      featAction: this.featAction,
    };
  }

  get effects() {
    return MagicItemHelpers.localized(MAGICITEMS.effects);
  }

  /** @override */
  async getData(data) {
    const entity = await this.entity();
    this.featAction = entity?.labels?.activation;
    return data;
  }
}
