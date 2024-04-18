import { AbstractMagicItemEntry } from "./AbstractMagicItemEntry";
import { NumberUtils } from "../utils/number";
import Logger from "../lib/Logger";

export class MagicItemSpell extends AbstractMagicItemEntry {
  constructor(data) {
    super(data);
    this.baseLevel = NumberUtils.parseIntOrGetDefault(this.baseLevel, 0);
    this.level = NumberUtils.parseIntOrGetDefault(this.level, 0);
    this.consumption = NumberUtils.parseIntOrGetDefault(this.consumption, 0);
    this.upcast = this.upcast ? NumberUtils.parseIntOrGetDefault(this.upcast, 0) : this.level;
    this.upcastCost = this.upcastCost ? NumberUtils.parseIntOrGetDefault(this.upcastCost, 0) : 1;
    this.dc = this.flatDc && this.dc ? this.dc : "";
    this.componentsVSM = this.componentsVSM;
    this.componentsALL = this.componentsALL;
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
      uuid: this.uuid,
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
      componentsVSM: this.componentsVSM,
      componentsALL: this.componentsALL,
    };
  }
}
