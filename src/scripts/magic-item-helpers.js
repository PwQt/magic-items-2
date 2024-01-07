import { isRealNumber } from "./lib/lib";

export class MagiItemHelpers {
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
    else if (!isNaN(parseFloat(n)) && isFinite(n)) {
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
      return game.babele && entity.getFlag("babele", "hasTranslation")
        ? entity.getFlag("babele", "originalName")
        : entity.name;
    } else {
      return entity.name;
    }
  }

  static getEntityNameCompendiumWithBabele(packToCheck, nameToCheck) {
    if (game.modules.get("babele")?.active) {
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
    return a.level === b.level ? MagicItem.sortByName(a, b) : a.level - b.level;
  }

  /**
   *
   * @param {options}
   * @param {string} [options.documentName]
   * @param {string} [options.documentId]
   * @param {("User"|"Folder"|"Actor"|"Item"|"Scene"|"Combat"|"JournalEntry"|"Macro"|"Playlist"|"RollTable"|"Cards"|"ChatMessage"|"Setting"|"FogExploration")} [options.collection]
   * @param {string} [options.documentPack]
   */
  static retrieveUuid({ documentName, documentId, documentCollectionType, documentPack }) {
    let uuid = null;
    if (documentCollectionType || pack === "world") {
      const collection = game.collections.get(documentCollectionType);
      if (!collection) {
        // DO NOTHING
      } else {
        // Get the original document, if the name still matches - take no action
        const original = documentId ? collection.get(documentId) : null;
        if (original) {
          if (documentName) {
            if (original.name !== documentName) {
              // DO NOTHING
            } else {
              return original.uuid;
            }
          } else {
            return original.uuid;
          }
        }
        // Otherwise, find the document by ID or name (ID preferred)
        const doc = collection.find((e) => e.id === documentId || e.name === documentName) || null;
        if (doc) {
          return doc.uuid;
        }
      }
    }
    if (documentPack) {
      const pack = documentPack;

      // Get the original entry, if the name still matches - take no action
      const original = documentId ? pack.index.get(documentId) : null;
      if (original) {
        if (documentName) {
          if (original.name !== documentName) {
            // DO NOTHING
          } else {
            return original.uuid;
          }
        } else {
          return original.uuid;
        }
      }

      // Otherwise, find the document by ID or name (ID preferred)
      const doc = pack.index.find((i) => i._id === documentId || i.name === documentName) || null;
      if (doc) {
        return doc.uuid;
      }
    }
    return uuid;
  }
}
