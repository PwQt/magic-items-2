import CONSTANTS from "../constants/constants.js";
import Logger from "./Logger.js";
import { RetrieveHelpers } from "./retrieve-helpers.js";

// ================================
// Logger utility
// ================================

export function debug(msg, ...args) {
  return Logger.debug(msg, args);
}

export function log(message, ...args) {
  return Logger.log(message, args);
}

export function notify(message, ...args) {
  return Logger.notify(message, args);
}

export function info(info, notify = false, ...args) {
  return Logger.info(info, notify, args);
}

export function warn(warning, notify = false, ...args) {
  return Logger.warn(warning, notify, args);
}

export function error(error, notify = true, ...args) {
  return Logger.error(error, notify, args);
}

export function timelog(message) {
  return Logger.timelog(message);
}

export const i18n = (key) => {
  return Logger.i18n(key);
};

export const i18nFormat = (key, data = {}) => {
  return Logger.i18nFormat(key, data);
};

export function dialogWarning(message, icon = "fas fa-exclamation-triangle") {
  return Logger.dialogWarning(message, icon);
}

// =========================================================================================

export function isEmptyObject(obj) {
  // because Object.keys(new Date()).length === 0;
  // we have to do some additional check
  if (obj === null || obj === undefined) {
    return true;
  }
  if (isRealNumber(obj)) {
    return false;
  }
  const result =
    obj && // null and undefined check
    Object.keys(obj).length === 0; // || Object.getPrototypeOf(obj) === Object.prototype);
  return result;
}

export function getSubstring(string, char1, char2) {
  return string.slice(string.indexOf(char1) + 1, string.lastIndexOf(char2));
}

// =========================================================================================

export async function runMacro(macroReference, ...macroData) {
  return runMacro(null, macroReference, macroData);
}

export async function runMacroOnExplicitActor(explicitActor, macroReference, ...macroData) {
  let macroFounded = await RetrieveHelpers.getMacroAsync(macroReference, false, true);
  if (!macroFounded) {
    throw error(`Could not find macro with reference "${macroReference}"`, true);
  }
  // Credit to Otigon, Zhell, Gazkhan and MrVauxs for the code in this section
  /*
    let macroId = macro.id;
    if (macroId.startsWith("Compendium")) {
      let packArray = macroId.split(".");
      let compendium = game.packs.get(`${packArray[1]}.${packArray[2]}`);
      if (!compendium) {
        throw error(`Compendium ${packArray[1]}.${packArray[2]} was not found`, true);
      }
      let findMacro = (await compendium.getDocuments()).find(m => m.name === packArray[3] || m.id === packArray[3])
      if (!findMacro) {
        throw error(`The "${packArray[3]}" macro was not found in Compendium ${packArray[1]}.${packArray[2]}`, true);
      }
      macro = new Macro(findMacro?.toObject());
      macro.ownership.default = CONST.DOCUMENT_PERMISSION_LEVELS.OWNER;
    } else {
      macro = game.macros.getName(macroId);
      if (!macro) {
        throw error(`Could not find macro with name "${macroId}"`, true);
      }
    }
    */
  let result = false;
  try {
    let args = {};
    if (typeof macroData !== "object") {
      // for (let i = 0; i < macroData.length; i++) {
      //   args[String(macroData[i]).trim()] = macroData[i].trim();
      // }
      args = parseAsArray(macroData);
    } else {
      args = macroData;
    }

    // Little trick to bypass permissions and avoid a socket to run as GM
    let macroTmp = new Macro(macroFounded.toObject());
    macroTmp.ownership.default = CONST.DOCUMENT_PERMISSION_LEVELS.OWNER;
    if (macroTmp.type === "chat") {
      result = await macroTmp.execute(args);
    } else if (macroTmp.type === "script") {
      //add variable to the evaluation of the script
      const macro = macroTmp;
      const actor = explicitActor || getUserCharacter();
      const speaker = ChatMessage.getSpeaker({ actor: actor });
      const token = canvas.tokens.get(actor.token);
      const character = game.user.character;
      const event = getEvent();

      debug("runMacro | ", { macro, speaker, actor, token, character, event, args });

      //build script execution
      let body = ``;
      if (macro.command.trim().startsWith(`(async ()`)) {
        body = macro.command;
      } else {
        body = `(async ()=>{
            ${macro.command}
          })();`;
      }
      const fn = Function("speaker", "actor", "token", "character", "event", "args", body);

      debug("runMacro | ", { body, fn });

      //attempt script execution
      try {
        fn.call(macro, speaker, actor, token, character, event, args);
      } catch (err) {
        error(`error macro Execution`, true, err);
      }

      function getEvent() {
        let a = args[0];
        if (a instanceof Event) {
          return args[0].shift();
        }
        if (a?.originalEvent instanceof Event) {
          return args.shift().originalEvent;
        }
        return undefined;
      }
    } else {
      warn(`Something is wrong a macro can be only a 'char' or a 'script'`, true);
    }
  } catch (err) {
    throw error(`Error when executing macro ${macroReference}!`, true, macroDataArr, err);
  }

  return result;
}

export function getOwnedCharacters(user = false) {
  user = user || game.user;
  return game.actors
    .filter((actor) => {
      return actor.ownership?.[user.id] === CONST.DOCUMENT_PERMISSION_LEVELS.OWNER && actor.prototypeToken.actorLink;
    })
    .sort((a, b) => {
      return b._stats.modifiedTime - a._stats.modifiedTime;
    });
}

export function getUserCharacter(user = false) {
  user = user || game.user;
  return user.character || (user.isGM ? false : getOwnedCharacters(user)?.[0] ?? false);
}

export function isValidImage(pathToImage) {
  const pathToImageS = String(pathToImage);
  if (pathToImageS.match(CONSTANTS.imageReg) || pathToImageS.match(CONSTANTS.imageRegBase64)) {
    return true;
  }
  return false;
}

export function isRealNumber(inNumber) {
  return !isNaN(inNumber) && typeof inNumber === "number" && isFinite(inNumber);
}

export function isRealBoolean(inBoolean) {
  return String(inBoolean) === "true" || String(inBoolean) === "false";
}

export function parseAsArray(obj) {
  if (!obj) {
    return [];
  }
  let arr = [];
  if (typeof obj === "string" || obj instanceof String) {
    arr = obj.split(",");
  } else if (obj.constructor === Array) {
    arr = obj;
  } else {
    arr = [obj];
  }
  return arr;
}
