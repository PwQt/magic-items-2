export const MAGICITEMS = {};

MAGICITEMS.actors = [];

MAGICITEMS.rechargeUnits = {
  r1: "MAGICITEMS.RechargeUnitDaily",
  r2: "MAGICITEMS.RechargeUnitDawn",
  r3: "MAGICITEMS.RechargeUnitSunset",
  r4: "MAGICITEMS.RechargeUnitShortRest",
  r5: "MAGICITEMS.RechargeUnitLongRest",
};

MAGICITEMS.DAILY = "r1";
MAGICITEMS.DAWN = "r2";
MAGICITEMS.SUNSET = "r3";
MAGICITEMS.SHORT_REST = "r4";
MAGICITEMS.LONG_REST = "r5";

MAGICITEMS.rechargeTypes = {
  t1: "MAGICITEMS.RechargeTypeNumeric",
  t2: "MAGICITEMS.RechargeTypeFormula",
  t3: "MAGICITEMS.RechargeTypeFull",
};

MAGICITEMS.destroyChecks = {
  d1: "MAGICITEMS.DestroyCheckAlways",
  d2: "MAGICITEMS.DestroyCheck1D20",
  d3: "MAGICITEMS.DestroyCheckCustomDC",
};

MAGICITEMS.destroyTypes = {
  dt1: "MAGICITEMS.JusDestroyType",
  dt2: "MAGICITEMS.LoosePowersType",
};

MAGICITEMS.chargeTypes = {
  c1: "MAGICITEMS.ChargeTypeWholeItem",
  c2: "MAGICITEMS.ChargeTypePerSpells",
};

MAGICITEMS.effects = {
  e1: "MAGICITEMS.EffectTypeConsume",
  e2: "MAGICITEMS.EffectTypeDestroy",
};

MAGICITEMS.CHARGE_TYPE_WHOLE_ITEM = "c1";
MAGICITEMS.CHARGE_TYPE_PER_SPELL = "c2";

MAGICITEMS.NUMERIC_RECHARGE = "t1";
MAGICITEMS.FORMULA_RECHARGE = "t2";
MAGICITEMS.FORMULA_FULL = "t3";

MAGICITEMS.tableUsages = {
  u1: "MAGICITEMS.TableUsageAsSpell",
  u2: "MAGICITEMS.TableUsageAsFeat",
  u3: "MAGICITEMS.TableUsageTriggerOnUsage",
};

MAGICITEMS.TABLE_USAGE_AS_SPELL = "u1";
MAGICITEMS.TABLE_USAGE_AS_FEAT = "u2";
MAGICITEMS.TABLE_USAGE_TRIGGER = "u3";

MAGICITEMS.DESTROY_JUST_DESTROY = "dt1";
MAGICITEMS.DESTROY_LOSE_CHARGES = "dt2";

MAGICITEMS.RECHARGE_TRANSLATION = {
  sr: MAGICITEMS.SHORT_REST,
  lr: MAGICITEMS.LONG_REST,
  day: MAGICITEMS.DAILY,
  dawn: MAGICITEMS.DAWN,
  charges: MAGICITEMS.DAILY,
  dusk: MAGICITEMS.SUNSET,
};
