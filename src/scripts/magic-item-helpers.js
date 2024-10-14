import CONSTANTS from "./constants/constants";
import Logger from "./lib/Logger";
import { isRealNumber, isEmptyObject } from "./lib/lib.js";

export class MagicItemHelpers {
  static isUsingNew5eSheet(sheet) {
    return sheet?.constructor?.name === "ActorSheet5eCharacter2" || sheet?.constructor?.name === "ActorSheet5eNPC2";
  }

  static isMidiItemEffectWorkflowOn() {
    return (
      game.modules.get("midi-qol")?.active && game.settings.get("midi-qol", "ConfigSettings")?.autoItemEffects !== "off"
    );
  }

  static isLevelScalingSettingOn() {
    return game.settings.get(CONSTANTS.MODULE_ID, "scaleSpellDamage");
  }

  static canSummon() {
    return game.user.can("TOKEN_CREATE") && (game.user.isGM || game.settings.get("dnd5e", "allowSummoning"));
  }

  static numeric = function (value, fallback) {
    // if ($.isNumeric(value)) {
    //   return parseInt(value);
    // } else {
    //   return fallback;
    // }
    // if is a number
    if (isRealNumber(value)) {
      return value;
    }
    // if is a string but with a numeric value
    else if (!isNaN(parseFloat(value)) && isFinite(value)) {
      return parseInt(value);
    }
    // if is something else
    else {
      return fallback;
    }
  };

  static localized = function (cfg) {
    return Object.keys(cfg).reduce((i18nCfg, key) => {
      i18nCfg[key] = game.i18n.localize(cfg[key]);
      return i18nCfg;
    }, {});
  };

  static getEntityNameWithBabele(entity) {
    if (game.modules.get("babele")?.active) {
      return game.babele && entity.getFlag("babele", "hasTranslation") ? entity.getFlag("babele", "name") : entity.name;
    } else {
      return entity.name;
    }
  }

  static getEntityNameCompendiumWithBabele(packToCheck, nameToCheck) {
    if (game.modules.get("babele")?.active && game.babele?.packs !== undefined) {
      if (packToCheck !== "world" && game.babele?.isTranslated(packToCheck)) {
        return game.babele.translateField("name", packToCheck, { name: nameToCheck });
      } else {
        return nameToCheck;
      }
    } else {
      return nameToCheck;
    }
  }

  static sortByName(a, b) {
    if (a.displayName < b.displayName) {
      return -1;
    }
    if (a.displayName > b.displayName) {
      return 1;
    }
    return 0;
  }

  static sortByLevel(a, b) {
    return a.level === b.level ? MagicItemHelpers.sortByName(a, b) : a.level - b.level;
  }

  static async fetchEntity(entity) {
    if (entity.pack === "world") {
      const result = await CONFIG["Item"].collection?.instance?.get(entity.id);
      return result;
    } else {
      const pack = game.packs.find((p) => p.collection === entity.pack);
      if (!pack) {
        Logger.warn(`Cannot retrieve pack ${entity.pack}`, true);
      } else {
        const result = await pack.getDocument(entity.id);
        return result;
      }
    }
  }

  static async updateMagicItemFlagOnItem(item) {
    Logger.info(`Updating item ${item.name}`);
    const itemFlag = getProperty(item, `flags.${CONSTANTS.MODULE_ID}`);
    Logger.debug("", itemFlag);
    let updateItem = false;
    if (!isEmptyObject(itemFlag)) {
      if (!isEmptyObject(itemFlag.spells)) {
        for (const [key, spell] of Object.entries(itemFlag.spells)) {
          Logger.info(`Updating spell ${spell.name}`);
          Logger.debug("", spell);
          const entity = await MagicItemHelpers.fetchEntity(spell);
          if (entity) {
            if (!spell.componentsVSM) {
              Logger.debug(`Entered componentsVSM part ${JSON.stringify(entity?.labels?.components?.vsm)}`);
              spell.componentsVSM = await entity?.labels?.components?.vsm;
              Logger.info(`Added componentVSM value to spell ${spell.name}`);
              updateItem = true;
            }
            if (!spell.componentsALL) {
              Logger.debug(`Entered componentsALL part ${JSON.stringify(entity?.labels?.components?.all)}`);
              spell.componentsALL = await entity?.labels?.components?.all;
              Logger.info(`Added componentsALL value to spell ${spell.name}`);
              updateItem = true;
            }
          }
        }
      }

      if (!isEmptyObject(itemFlag.feats)) {
        for (const [key, feat] of Object.entries(itemFlag.feats)) {
          Logger.info(`Updating feat ${feat.name}`);
          Logger.debug("", feat);
          const entity = await MagicItemHelpers.fetchEntity(feat);
          if (entity) {
            if (!feat.featAction) {
              Logger.debug(`Entered featAction part ${JSON.stringify(entity?.labels?.activation)}`);
              feat.featAction = await entity?.labels?.activation;
              Logger.info(`Added activation method '${feat.featAction}' for feat: ${feat.name}`);
              updateItem = true;
            }
          }
        }
      }

      if (updateItem) {
        await item.update({
          flags: {
            [CONSTANTS.MODULE_ID]: itemFlag,
          },
        });
        Logger.info(`Updated item ${item.name}`);
      } else {
        Logger.info(`Update of item ${item.name} skipped - no flags updated`);
      }
    }
  }
}
