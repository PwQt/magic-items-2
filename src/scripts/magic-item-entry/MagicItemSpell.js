import { MagicItemEntry } from "./AbstractMagicItemEntry";

export class MagicItemSpell extends MagicItemEntry {
  constructor(data) {
    super(data);
    this.baseLevel = parseInt(this.baseLevel);
    this.level = parseInt(this.level);
    this.consumption = parseInt(this.consumption);
    this.upcast = this.upcast ? parseInt(this.upcast) : this.level;
    this.upcastCost = this.upcastCost ? parseInt(this.upcastCost) : 1;
    this.dc = this.flatDc && this.dc ? this.dc : "";
  }

  get levels() {
    let levels = {};
    for (let i = this.baseLevel; i <= 9; i++) {
      levels[i] = game.i18n.localize(`MAGICITEMS.SheetSpellLevel${i}`);
      if (i === 0) {
        break;
      }
    }
    return levels;
  }

  get upcasts() {
    let upcasts = {};
    for (let i = this.level; i <= 9; i++) {
      upcasts[i] = game.i18n.localize(`MAGICITEMS.SheetSpellUpcast${i}`);
      if (i === 0) {
        break;
      }
    }
    return upcasts;
  }

  get allowedLevels() {
    let levels = {};
    for (let i = this.level; i <= Math.min(this.upcast, 9); i++) {
      levels[i] = game.i18n.localize(`MAGICITEMS.SheetSpellLevel${i}`);
      if (i === 0) {
        break;
      }
    }
    return levels;
  }

  canUpcast() {
    return this.level < this.upcast;
  }

  canUpcastLabel() {
    return this.canUpcast()
      ? game.i18n.localize(`MAGICITEMS.SheetCanUpcastYes`)
      : game.i18n.localize(`MAGICITEMS.SheetCanUpcastNo`);
  }

  consumptionAt(level) {
    return this.consumption + this.upcastCost * (level - this.level);
  }

  serializeData() {
    return {
      baseLevel: this.baseLevel,
      consumption: this.consumption,
      id: this.id,
      img: this.img,
      level: this.level,
      name: this.name,
      pack: this.pack,
      upcast: this.upcast,
      upcastCost: this.upcastCost,
      flatDc: this.flatDc,
      dc: this.dc,
      uses: this.uses,
    };
  }
}
