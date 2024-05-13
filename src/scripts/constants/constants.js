const CONSTANTS = {
  MODULE_ID: "magicitems",
  PATH: `modules/magicitems/`,
  PREFIX_LABEL: "MAGICITEMS",
  // PREFIX_FLAG: "magicitems",
  FLAGS: {
    DEFAULT: "default",
    SPELLS: "spells",
  },
  HTML: {
    MAGIC_ITEM_ICON: '<i class="fas fa-magic" style="margin-left: 5px;" title="Magic Item"></i>',
  },
  QUANTITY_PROPERTY_PATH: "system.quantity",
  WEIGHT_PROPERTY_PATH: "system.weight",
  PRICE_PROPERTY_PATH: "system.price",
  SPELL_LEVEL_PROPERTY_PATH: "system.level",
};
CONSTANTS.PATH = `modules/${CONSTANTS.MODULE_NAME}/`;

export default CONSTANTS;
