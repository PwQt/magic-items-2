import { AbstractOwnedEntry } from "./AbstractOwnedMagicItemEntry";

export class OwnedMagicItemTable extends AbstractOwnedEntry {
  async roll() {
    let item = this.item;
    let consumption = item.consumption;
    if (this.hasCharges(consumption)) {
      await item.roll(this.magicItem.actor);
      this.consume(consumption);
    } else {
      this.showNoChargesMessage(() => {
        item.roll(this.magicItem.actor);
      });
    }
  }
}
