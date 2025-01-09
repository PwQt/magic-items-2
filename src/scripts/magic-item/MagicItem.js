import { MAGICITEMS } from "../config.js";
import { RetrieveHelpers } from "../lib/retrieve-helpers.js";
import { MagicItemFeat } from "../magic-item-entry/MagicItemFeat.js";
import { MagicItemSpell } from "../magic-item-entry/MagicItemSpell.js";
import { MagicItemTable } from "../magic-item-entry/MagicItemTable.js";
import { MagicItemHelpers } from "../magic-item-helpers.js";
import { NumberUtils } from "../utils/number.js";

export class MagicItem {
  constructor(flagsData) {
    const data = foundry.utils.mergeObject(this.defaultData(), flagsData || {}, { inplace: false });

    this.enabled = data.enabled;
    this.equipped = data.equipped;
    this.attuned = data.attuned;
    this.internal = data.internal;
    this.charges = NumberUtils.parseIntOrGetDefault(data.charges, 0);
    this.chargeType = data.chargeType;
    this.rechargeable = data.rechargeable;
    this.recharge = data.recharge;
    this.rechargeType = data.rechargeType;
    this.rechargeUnit = data.rechargeUnit;
    this.destroy = data.destroy;
    this.destroyCheck = data.destroyCheck;
    this.destroyType = data.destroyType;
    this.destroyFlavorText = data.destroyFlavorText;
    this.destroyDC = data.destroyDC;
    this.sorting = data.sorting;
    this.sortingModes = { l: "MAGICITEMS.SheetSortByLevel", a: "MAGICITEMS.SheetSortAlphabetically" };

    this.spells = Object.values(data.spells ? data.spells : {})
      .filter((spell) => spell !== "null")
      .map((spell) => {
        spell.collectionType = "Item";
        return new MagicItemSpell(spell);
      });

    this.feats = Object.values(data.feats ? data.feats : {})
      .filter((feat) => feat !== "null")
      .map((feat) => {
        feat.collectionType = "Item";
        return new MagicItemFeat(feat);
      });

    this.tables = Object.values(data.tables ? data.tables : {})
      .filter((table) => table !== "null")
      .map((table) => {
        table.collectionType = "RollTable";
        return new MagicItemTable(table);
      });

    this.spellsGarbage = [];
    this.featsGarbage = [];
    this.tablesGarbage = [];

    this.savedSpells = this.spells.length;
    this.savedFeats = this.feats.length;
    this.savedTables = this.tables.length;

    this.sort();

    if (!this.enabled) {
      this.clear();
    }
  }

  sort() {
    if (this.sorting === "a") {
      this.spells = this.spells.sort(MagicItemHelpers.sortByName);
    }
    if (this.sorting === "l") {
      this.spells = this.spells.sort(MagicItemHelpers.sortByLevel);
    }
  }

  get destroyTarget() {
    return this.chargeType === "c1"
      ? game.i18n.localize("MAGICITEMS.SheetObjectTarget")
      : game.i18n.localize("MAGICITEMS.SheetSpellTarget");
  }

  defaultData() {
    return {
      enabled: false,
      equipped: false,
      internal: false,
      attuned: false,
      charges: 0,
      chargeType: "c1",
      rechargeable: false,
      recharge: 0,
      rechargeType: "t1",
      rechargeUnit: "",
      destroy: false,
      destroyCheck: "d1",
      destroyType: "dt1",
      destroyDC: 0,
      destroyFlavorText: game.i18n.localize("MAGICITEMS.MagicItemDestroy"),
      sorting: "l",
      spells: {},
      feats: {},
      tables: {},
    };
  }

  serializeData() {
    return {
      enabled: this.enabled,
      charges: this.charges,
      chargeType: this.chargeType,
      internal: this.internal,
      rechargeable: this.rechargeable,
      recharge: this.recharge,
      rechargeType: this.rechargeType,
      rechargeUnit: this.rechargeUnit,
      destroy: this.destroy,
      destroyCheck: this.destroyCheck,
      destroyType: this.destroyType,
      destroyFlavorText: this.destroyFlavorText,
      destroyDC: this.destroyDC,
      sorting: this.sorting,
      spells: this.serializeEntries(this.spells, this.spellsGarbage),
      feats: this.serializeEntries(this.feats, this.featsGarbage),
      tables: this.serializeEntries(this.tables, this.tablesGarbage),
      uses: this.uses,
    };
  }

  serializeEntries(entries, trash) {
    let data = {};
    entries.forEach((entry, idx) => (data["" + idx] = entry.serializeData()));
    trash.forEach((index) => (data["-=" + index] = null));
    return data;
  }

  get chargeTypes() {
    return MagicItemHelpers.localized(MAGICITEMS.chargeTypes);
  }

  get destroyChecks() {
    return MagicItemHelpers.localized(MAGICITEMS.destroyChecks);
  }

  get destroyTypes() {
    return MagicItemHelpers.localized(MAGICITEMS.destroyTypes);
  }

  get rechargeUnits() {
    return MagicItemHelpers.localized(MAGICITEMS.rechargeUnits);
  }

  get rechargeTypes() {
    return MagicItemHelpers.localized(MAGICITEMS.rechargeTypes);
  }

  get rechargeText() {
    return this.rechargeType === "t3" ? game.i18n.localize("MAGICITEMS.RechargeTypeFull") : this.recharge;
  }

  get empty() {
    return this.spells.length === 0 && this.feats.length === 0 && this.tables.length === 0;
  }

  get chargesOnWholeItem() {
    return this.chargeType === MAGICITEMS.CHARGE_TYPE_WHOLE_ITEM;
  }

  get chargesPerSpell() {
    return this.chargeType === MAGICITEMS.CHARGE_TYPE_PER_SPELL;
  }

  toggleEnabled(enabled) {
    this.enabled = enabled;
    if (!enabled) {
      this.clear();
    }
  }

  toggleRechargeable(rechargeable) {
    this.rechargeable = rechargeable;
    if (!rechargeable) {
      this.recharge = 0;
      this.rechargeType = "t1";
      this.rechargeUnit = "";
    }
  }

  clear() {
    foundry.utils.mergeObject(this, this.defaultData());
    this.spells = [];
    this.feats = [];
    this.tables = [];
    this.cleanup();
  }

  support(type) {
    return ["Item", "RollTable"].includes(type);
  }

  get items() {
    return this.spells.concat(this.feats).concat(this.tables);
  }

  addSpell(data) {
    data.collectionType = "Item";
    this.spells.push(new MagicItemSpell(data));
    this.cleanup();
  }

  removeSpell(idx) {
    this.spells.splice(idx, 1);
    this.cleanup();
  }

  get hasSpells() {
    return this.spells.length > 0 || this.hasTableAsSpells;
  }

  hasSpell(spellId) {
    return this.spells.filter((spell) => spell.id === spellId).length === 1;
  }

  addFeat(data) {
    data.collectionType = "Item";
    this.feats.push(new MagicItemFeat(data));
    this.cleanup();
  }

  removeFeat(idx) {
    this.feats.splice(idx, 1);
    this.cleanup();
  }

  get hasFeats() {
    return this.feats.length > 0 || this.hasTableAsFeats;
  }

  hasFeat(featId) {
    return this.feats.filter((feat) => feat.id === featId).length === 1;
  }

  addTable(data) {
    data.collectionType = "RollTable";
    this.tables.push(new MagicItemTable(data));
    this.cleanup();
  }

  removeTable(idx) {
    this.tables.splice(idx, 1);
    this.cleanup();
  }

  get hasTableAsSpells() {
    return this.tableAsSpells.length === 1;
  }

  get hasTableAsFeats() {
    return this.tableAsFeats.length === 1;
  }

  hasTable(tableId) {
    return this.tables.filter((table) => table.id === tableId).length === 1;
  }

  tablesByUsage(usage) {
    return this.tables.filter((table) => table.usage === usage);
  }

  get tableAsSpells() {
    return this.tablesByUsage(MAGICITEMS.TABLE_USAGE_AS_SPELL);
  }

  get tableAsFeats() {
    return this.tablesByUsage(MAGICITEMS.TABLE_USAGE_AS_FEAT);
  }

  get triggeredTables() {
    return this.tablesByUsage(MAGICITEMS.TABLE_USAGE_TRIGGER);
  }

  compatible(entity) {
    return (["spell", "feat"].includes(entity.type) || entity.documentName === "RollTable") && !this.hasItem(entity.id);
  }

  addEntity(entity, pack) {
    let name = MagicItemHelpers.getEntityNameWithBabele(entity);
    if (entity.type === "spell") {
      this.addSpell({
        uuid: entity.uuid,
        id: entity.id,
        name: name,
        img: entity.img,
        pack: pack,
        baseLevel: entity.system.level,
        level: entity.system.level,
        consumption: entity.system.level,
        upcast: entity.system.level,
        upcastCost: 1,
        componentsVSM: entity?.labels?.components?.vsm,
        componentsALL: entity?.labels?.components?.all,
      });
      return true;
    }
    if (entity.type === "feat") {
      this.addFeat({
        uuid: entity.uuid,
        id: entity.id,
        name: name,
        img: entity.img,
        pack: pack,
        effect: "e1",
        consumption: 1,
        featAction: entity?.labels?.activation,
      });
      return true;
    }
    if (entity.documentName === "RollTable") {
      this.addTable({
        uuid: entity.uuid,
        id: entity.id,
        name: name,
        img: entity.img,
        pack: pack,
        consumption: 1,
      });
      return true;
    }
    return false;
  }

  hasItem(itemId) {
    return this.hasSpell(itemId) || this.hasFeat(itemId) || this.hasTable(itemId);
  }

  findByUuid(itemUuid) {
    return this.items.filter((item) => item.uuid === itemUuid)[0];
  }

  findById(itemId) {
    return this.items.filter((item) => item.id === itemId)[0];
  }

  get sheetEditable() {
    return $(this.actor.sheet.form).hasClass("editable");
  }

  async renderSheet(itemId) {
    let item = this.findByUuid(itemId);
    if (!item) {
      item = this.findById(itemId);
    }

    await item.renderSheet();
  }

  cleanup() {
    this.spellsGarbage = [];
    this.featsGarbage = [];
    this.tablesGarbage = [];
    if (this.savedSpells > this.spells.length) {
      for (let i = this.spells.length; i < this.savedSpells; i++) {
        this.spellsGarbage.push(i);
      }
    }
    if (this.savedFeats > this.feats.length) {
      for (let i = this.feats.length; i < this.savedFeats; i++) {
        this.featsGarbage.push(i);
      }
    }
    if (this.savedTables > this.tables.length) {
      for (let i = this.tables.length; i < this.savedTables; i++) {
        this.tablesGarbage.push(i);
      }
    }
  }

  async updateInternalCharges(isChecked, item) {
    let itemData = await RetrieveHelpers.getItemAsync(item);
    const itemChargeData = itemData.system.uses;
    if (isChecked && itemChargeData?.per) {
      this.charges = itemChargeData.max;
      this.uses = itemChargeData.value;
      this.chargeType = MAGICITEMS.CHARGE_TYPE_WHOLE_ITEM;
      this.rechargeable = false;
      this.recharge = itemChargeData.recovery;
      this.rechargeType = this.chargesTypeCompatible(itemChargeData);
      this.rechargeUnit = MAGICITEMS.RECHARGE_TRANSLATION[itemChargeData.per];
    } else if (isChecked && !itemChargeData?.per) {
      this.charges = 0;
      this.uses = 0;
      this.chargeType = MAGICITEMS.CHARGE_TYPE_WHOLE_ITEM;
      this.rechargeable = false;
      this.rechargeUnit = "";
      this.rechargeType = MAGICITEMS.NUMERIC_RECHARGE;
    }
  }

  chargesTypeCompatible(chargeData) {
    if (["lr", "sr", "day"].includes(chargeData.per)) {
      return MAGICITEMS.FORMULA_FULL;
    } else if (NumberUtils.parseIntOrGetDefault(chargeData.recovery, 0) !== 0) {
      return MAGICITEMS.NUMERIC_RECHARGE;
    } else {
      return MAGICITEMS.FORMULA_RECHARGE;
    }
  }
}
