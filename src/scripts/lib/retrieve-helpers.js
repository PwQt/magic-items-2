import Logger from "./Logger";

export class RetrieveHelpers {
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

  static getDocument(target) {
    if (RetrieveHelpers.stringIsUuid(target)) {
      target = fromUuidSync(target);
    }
    return target?.document ?? target;
  }

  static stringIsUuid(inId) {
    return typeof inId === "string" && (inId.match(/\./g) || []).length && !inId.endsWith(".");
  }

  static getUuid(target) {
    if (RetrieveHelpers.stringIsUuid(target)) {
      return target;
    }
    const document = getDocument(target);
    return document?.uuid ?? false;
  }

  static getCompendiumCollectionSync(target, ignoreError = false, ignoreName = true) {
    let targetTmp = target;
    if (!targetTmp) {
      throw Logger.error(`CompendiumCollection is undefined`, true, targetTmp);
    }
    if (targetTmp instanceof CompendiumCollection) {
      return targetTmp;
    }
    // This is just a patch for compatibility with others modules
    if (targetTmp.document) {
      targetTmp = targetTmp.document;
    }
    if (targetTmp.uuid) {
      targetTmp = targetTmp.uuid;
    }

    if (targetTmp instanceof CompendiumCollection) {
      return targetTmp;
    }
    // if (RetrieveHelpers.stringIsUuid(targetTmp)) {
    //   targetTmp = fromUuid(targetTmp);
    // } else {
    targetTmp = game.packs.get(targetTmp);
    if (!targetTmp && !ignoreName) {
      targetTmp = game.packs.getName(targetTmp);
    }
    // }
    if (!targetTmp) {
      if (ignoreError) {
        Logger.warn(`CompendiumCollection is not found`, false, targetTmp);
        return;
      } else {
        throw Logger.error(`CompendiumCollection is not found`, true, targetTmp);
      }
    }
    // Type checking
    // if (!(targetTmp instanceof CompendiumCollection)) {
    //   if (ignoreError) {
    //     Logger.warn(`Invalid CompendiumCollection`, true, targetTmp);
    //     return;
    //   } else {
    //     throw Logger.error(`Invalid CompendiumCollection`, true, targetTmp);
    //   }
    // }
    return targetTmp;
  }

  static async getCompendiumCollectionAsync(target, ignoreError = false, ignoreName = true) {
    let targetTmp = target;
    if (!targetTmp) {
      throw Logger.error(`CompendiumCollection is undefined`, true, targetTmp);
    }
    if (targetTmp instanceof CompendiumCollection) {
      return targetTmp;
    }
    // This is just a patch for compatibility with others modules
    if (targetTmp.document) {
      targetTmp = targetTmp.document;
    }
    if (targetTmp.uuid) {
      targetTmp = targetTmp.uuid;
    }

    if (targetTmp instanceof CompendiumCollection) {
      return targetTmp;
    }
    if (RetrieveHelpers.stringIsUuid(targetTmp)) {
      targetTmp = await fromUuid(targetTmp);
    } else {
      targetTmp = game.packs.get(targetTmp);
      if (!targetTmp && !ignoreName) {
        targetTmp = game.packs.getName(targetTmp);
      }
    }
    if (!targetTmp) {
      if (ignoreError) {
        Logger.warn(`CompendiumCollection is not found`, false, targetTmp);
        return;
      } else {
        throw Logger.error(`CompendiumCollection is not found`, true, targetTmp);
      }
    }
    // Type checking
    if (!(targetTmp instanceof CompendiumCollection)) {
      if (ignoreError) {
        Logger.warn(`Invalid CompendiumCollection`, true, targetTmp);
        return;
      } else {
        throw Logger.error(`Invalid CompendiumCollection`, true, targetTmp);
      }
    }
    return targetTmp;
  }

  static getUserSync(target, ignoreError = false, ignoreName = true) {
    let targetTmp = target;
    if (!targetTmp) {
      throw Logger.error(`User is undefined`, true, targetTmp);
    }
    if (targetTmp instanceof User) {
      return targetTmp;
    }
    // This is just a patch for compatibility with others modules
    if (targetTmp.document) {
      targetTmp = targetTmp.document;
    }
    if (targetTmp.uuid) {
      targetTmp = targetTmp.uuid;
    }

    if (targetTmp instanceof User) {
      return targetTmp;
    }
    if (RetrieveHelpers.stringIsUuid(targetTmp)) {
      targetTmp = fromUuidSync(targetTmp);
    } else {
      targetTmp = game.users.get(targetTmp);
      if (!targetTmp && !ignoreName) {
        targetTmp = game.users.getName(targetTmp);
      }
    }
    if (!targetTmp) {
      if (ignoreError) {
        Logger.warn(`User is not found`, false, targetTmp);
        return;
      } else {
        throw error(`User is not found`, true, targetTmp);
      }
    }
    // Type checking
    // if (!(targetTmp instanceof User)) {
    //   if (ignoreError) {
    //     Logger.warn(`Invalid User`, true, targetTmp);
    //     return;
    //   } else {
    //     throw Logger.error(`Invalid User`, true, targetTmp);
    //   }
    // }
    return targetTmp;
  }

  static getActorSync(target, ignoreError = false, ignoreName = true) {
    let targetTmp = target;
    if (!targetTmp) {
      throw Logger.error(`Actor is undefined`, true, targetTmp);
    }
    if (targetTmp instanceof Actor) {
      return targetTmp;
    }
    // This is just a patch for compatibility with others modules
    if (targetTmp.document) {
      targetTmp = targetTmp.document;
    }
    if (targetTmp.uuid) {
      targetTmp = targetTmp.uuid;
    }

    if (targetTmp instanceof Actor) {
      return targetTmp;
    }
    if (RetrieveHelpers.stringIsUuid(targetTmp)) {
      targetTmp = fromUuidSync(targetTmp);
    } else {
      targetTmp = game.actors.get(targetTmp);
      if (!targetTmp && !ignoreName) {
        targetTmp = game.actors.getName(targetTmp);
      }
    }
    if (!targetTmp) {
      if (ignoreError) {
        Logger.warn(`Actor is not found`, false, targetTmp);
        return;
      } else {
        throw Logger.error(`Actor is not found`, true, targetTmp);
      }
    }
    // Type checking
    // if (!(targetTmp instanceof Actor)) {
    //   if (ignoreError) {
    //     Logger.warn(`Invalid Actor`, true, targetTmp);
    //     return;
    //   } else {
    //     throw Logger.error(`Invalid Actor`, true, targetTmp);
    //   }
    // }
    return targetTmp;
  }

  static async getActorAsync(target, ignoreError = false, ignoreName = true) {
    let targetTmp = target;
    if (!targetTmp) {
      throw Logger.error(`Actor is undefined`, true, targetTmp);
    }
    if (targetTmp instanceof Actor) {
      return targetTmp;
    }
    // This is just a patch for compatibility with others modules
    if (targetTmp.document) {
      targetTmp = targetTmp.document;
    }
    if (targetTmp.uuid) {
      targetTmp = targetTmp.uuid;
    }

    if (targetTmp instanceof Actor) {
      return targetTmp;
    }
    if (RetrieveHelpers.stringIsUuid(targetTmp)) {
      targetTmp = await fromUuid(targetTmp);
    } else {
      targetTmp = game.actors.get(targetTmp);
      if (!targetTmp && !ignoreName) {
        targetTmp = game.actors.getName(targetTmp);
      }
    }
    if (!targetTmp) {
      if (ignoreError) {
        Logger.warn(`Actor is not found`, false, targetTmp);
        return;
      } else {
        throw Logger.error(`Actor is not found`, true, targetTmp);
      }
    }
    // Type checking
    if (!(targetTmp instanceof Actor)) {
      if (ignoreError) {
        Logger.warn(`Invalid Actor`, true, targetTmp);
        return;
      } else {
        throw Logger.error(`Invalid Actor`, true, targetTmp);
      }
    }
    return targetTmp;
  }

  static getJournalSync(target, ignoreError = false, ignoreName = true) {
    let targetTmp = target;
    if (!targetTmp) {
      throw Logger.error(`Journal is undefined`, true, targetTmp);
    }
    if (targetTmp instanceof Journal) {
      return targetTmp;
    }
    // This is just a patch for compatibility with others modules
    if (targetTmp.document) {
      targetTmp = targetTmp.document;
    }
    if (targetTmp.uuid) {
      targetTmp = targetTmp.uuid;
    }

    if (targetTmp instanceof Journal) {
      return targetTmp;
    }
    if (RetrieveHelpers.stringIsUuid(targetTmp)) {
      targetTmp = fromUuidSync(targetTmp);
    } else {
      targetTmp = game.journal.get(targetTmp);
      if (!targetTmp && !ignoreName) {
        targetTmp = game.journal.getName(targetTmp);
      }
    }
    if (!targetTmp) {
      if (ignoreError) {
        Logger.warn(`Journal is not found`, false, targetTmp);
        return;
      } else {
        throw Logger.error(`Journal is not found`, true, targetTmp);
      }
    }
    // Type checking
    // if (!(targetTmp instanceof Journal)) {
    //   if (ignoreError) {
    //     Logger.warn(`Invalid Journal`, true, targetTmp);
    //     return;
    //   } else {
    //     throw Logger.error(`Invalid Journal`, true, targetTmp);
    //   }
    // }
    return targetTmp;
  }

  static async getJournalAsync(target, ignoreError = false, ignoreName = true) {
    let targetTmp = target;
    if (!targetTmp) {
      throw Logger.error(`Journal is undefined`, true, targetTmp);
    }
    if (targetTmp instanceof Journal) {
      return targetTmp;
    }
    // This is just a patch for compatibility with others modules
    if (targetTmp.document) {
      targetTmp = targetTmp.document;
    }
    if (targetTmp.uuid) {
      targetTmp = targetTmp.uuid;
    }

    if (targetTmp instanceof Journal) {
      return targetTmp;
    }
    if (RetrieveHelpers.stringIsUuid(targetTmp)) {
      targetTmp = await fromUuid(targetTmp);
    } else {
      targetTmp = game.journal.get(targetTmp);
      if (!targetTmp && !ignoreName) {
        targetTmp = game.journal.getName(targetTmp);
      }
    }
    if (!targetTmp) {
      if (ignoreError) {
        Logger.warn(`Journal is not found`, false, targetTmp);
        return;
      } else {
        throw Logger.error(`Journal is not found`, true, targetTmp);
      }
    }
    // Type checking
    if (!(targetTmp instanceof Journal)) {
      if (ignoreError) {
        Logger.warn(`Invalid Journal`, true, targetTmp);
        return;
      } else {
        throw Logger.error(`Invalid Journal`, true, targetTmp);
      }
    }
    return targetTmp;
  }

  static getMacroSync(target, ignoreError = false, ignoreName = true) {
    let targetTmp = target;
    if (!targetTmp) {
      throw Logger.error(`Macro is undefined`, true, targetTmp);
    }
    if (targetTmp instanceof Macro) {
      return targetTmp;
    }
    // This is just a patch for compatibility with others modules
    if (targetTmp.document) {
      targetTmp = targetTmp.document;
    }
    if (targetTmp.uuid) {
      targetTmp = targetTmp.uuid;
    }

    if (targetTmp instanceof Macro) {
      return targetTmp;
    }
    if (RetrieveHelpers.stringIsUuid(targetTmp)) {
      targetTmp = fromUuidSync(targetTmp);
    } else {
      targetTmp = game.macros.get(targetTmp);
      if (!targetTmp && !ignoreName) {
        targetTmp = game.macros.getName(targetTmp);
      }
    }
    if (!targetTmp) {
      if (ignoreError) {
        Logger.warn(`Macro is not found`, true, targetTmp);
        return;
      } else {
        throw Logger.error(`Macro is not found`, true, targetTmp);
      }
    }
    // Type checking
    // if (!(targetTmp instanceof Macro)) {
    //   if (ignoreError) {
    //     Logger.warn(`Invalid Macro`, true, targetTmp);
    //     return;
    //   } else {
    //     throw Logger.error(`Invalid Macro`, true, targetTmp);
    //   }
    // }
    return targetTmp;
  }

  static async getMacroAsync(target, ignoreError = false, ignoreName = true) {
    let targetTmp = target;
    if (!targetTmp) {
      throw Logger.error(`Macro is undefined`, true, targetTmp);
    }
    if (targetTmp instanceof Macro) {
      return targetTmp;
    }
    // This is just a patch for compatibility with others modules
    if (targetTmp.document) {
      targetTmp = targetTmp.document;
    }
    if (targetTmp.uuid) {
      targetTmp = targetTmp.uuid;
    }

    if (targetTmp instanceof Macro) {
      return targetTmp;
    }
    if (RetrieveHelpers.stringIsUuid(targetTmp)) {
      targetTmp = await fromUuid(targetTmp);
    } else {
      targetTmp = game.macros.get(targetTmp);
      if (!targetTmp && !ignoreName) {
        targetTmp = game.macros.getName(targetTmp);
      }
    }
    if (!targetTmp) {
      if (ignoreError) {
        Logger.warn(`Macro is not found`, true, targetTmp);
        return;
      } else {
        throw Logger.error(`Macro is not found`, true, targetTmp);
      }
    }
    // Type checking
    if (!(targetTmp instanceof Macro)) {
      if (ignoreError) {
        Logger.warn(`Invalid Macro`, true, targetTmp);
        return;
      } else {
        throw Logger.error(`Invalid Macro`, true, targetTmp);
      }
    }
    return targetTmp;
  }

  static getSceneSync(target, ignoreError = false, ignoreName = true) {
    let targetTmp = target;
    if (!targetTmp) {
      throw Logger.error(`Scene is undefined`, true, targetTmp);
    }
    if (targetTmp instanceof Scene) {
      return targetTmp;
    }
    // This is just a patch for compatibility with others modules
    if (targetTmp.document) {
      targetTmp = targetTmp.document;
    }
    if (targetTmp.uuid) {
      targetTmp = targetTmp.uuid;
    }

    if (targetTmp instanceof Scene) {
      return targetTmp;
    }
    if (RetrieveHelpers.stringIsUuid(targetTmp)) {
      targetTmp = fromUuidSync(targetTmp);
    } else {
      targetTmp = game.scenes.get(targetTmp);
      if (!targetTmp && !ignoreName) {
        targetTmp = game.scenes.getName(targetTmp);
      }
    }
    if (!targetTmp) {
      if (ignoreError) {
        Logger.warn(`Scene is not found`, true, targetTmp);
        return;
      } else {
        throw Logger.error(`Scene is not found`, true, targetTmp);
      }
    }
    // Type checking
    // if (!(targetTmp instanceof Scene)) {
    //   if (ignoreError) {
    //     Logger.warn(`Invalid Scene`, true, targetTmp);
    //     return;
    //   } else {
    //     throw Logger.error(`Invalid Scene`, true, targetTmp);
    //   }
    // }
    return targetTmp;
  }

  static async getSceneAsync(target, ignoreError = false, ignoreName = true) {
    let targetTmp = target;
    if (!targetTmp) {
      throw Logger.error(`Scene is undefined`, true, targetTmp);
    }
    if (targetTmp instanceof Scene) {
      return targetTmp;
    }
    // This is just a patch for compatibility with others modules
    if (targetTmp.document) {
      targetTmp = targetTmp.document;
    }
    if (targetTmp.uuid) {
      targetTmp = targetTmp.uuid;
    }

    if (targetTmp instanceof Scene) {
      return targetTmp;
    }
    if (RetrieveHelpers.stringIsUuid(targetTmp)) {
      targetTmp = await fromUuid(targetTmp);
    } else {
      targetTmp = game.scenes.get(targetTmp);
      if (!targetTmp && !ignoreName) {
        targetTmp = game.scenes.getName(targetTmp);
      }
    }
    if (!targetTmp) {
      if (ignoreError) {
        Logger.warn(`Scene is not found`, true, targetTmp);
        return;
      } else {
        throw Logger.error(`Scene is not found`, true, targetTmp);
      }
    }
    // Type checking
    if (!(targetTmp instanceof Scene)) {
      if (ignoreError) {
        Logger.warn(`Invalid Scene`, true, targetTmp);
        return;
      } else {
        throw Logger.error(`Invalid Scene`, true, targetTmp);
      }
    }
    return targetTmp;
  }

  static getItemSync(target, ignoreError = false, ignoreName = true) {
    let targetTmp = target;
    if (!targetTmp) {
      throw Logger.error(`Item is undefined`, true, targetTmp);
    }
    if (targetTmp instanceof Item) {
      return targetTmp;
    }
    // This is just a patch for compatibility with others modules
    if (targetTmp.document) {
      targetTmp = targetTmp.document;
    }
    if (targetTmp.uuid) {
      targetTmp = targetTmp.uuid;
    }

    if (targetTmp instanceof Item) {
      return targetTmp;
    }
    if (RetrieveHelpers.stringIsUuid(targetTmp)) {
      targetTmp = fromUuidSync(targetTmp);
    } else {
      targetTmp = game.items.get(targetTmp);
      if (!targetTmp && !ignoreName) {
        targetTmp = game.items.getName(targetTmp);
      }
    }
    if (!targetTmp) {
      if (ignoreError) {
        Logger.warn(`Item is not found`, false, targetTmp);
        return;
      } else {
        throw Logger.error(`Item is not found`, true, targetTmp);
      }
    }
    // Type checking
    // if (!(targetTmp instanceof Item)) {
    //   if (ignoreError) {
    //     Logger.warn(`Invalid Item`, true, targetTmp);
    //     return;
    //   } else {
    //     throw Logger.error(`Invalid Item`, true, targetTmp);
    //   }
    // }
    return targetTmp;
  }

  static async getItemAsync(target, ignoreError = false, ignoreName = true) {
    let targetTmp = target;
    if (!targetTmp) {
      throw Logger.error(`Item is undefined`, true, targetTmp);
    }
    if (targetTmp instanceof Item) {
      return targetTmp;
    }
    // This is just a patch for compatibility with others modules
    if (targetTmp.document) {
      targetTmp = targetTmp.document;
    }
    if (targetTmp.uuid) {
      targetTmp = targetTmp.uuid;
    }

    if (targetTmp instanceof Item) {
      return targetTmp;
    }
    if (RetrieveHelpers.stringIsUuid(targetTmp)) {
      targetTmp = await fromUuid(targetTmp);
    } else {
      targetTmp = game.items.get(targetTmp);
      if (!targetTmp && !ignoreName) {
        targetTmp = game.items.getName(targetTmp);
      }
    }
    if (!targetTmp) {
      if (ignoreError) {
        Logger.warn(`Item is not found`, false, targetTmp);
        return;
      } else {
        throw Logger.error(`Item is not found`, true, targetTmp);
      }
    }
    // Type checking
    if (!(targetTmp instanceof Item)) {
      if (ignoreError) {
        Logger.warn(`Invalid Item`, true, targetTmp);
        return;
      } else {
        throw Logger.error(`Invalid Item`, true, targetTmp);
      }
    }
    return targetTmp;
  }

  static getPlaylistSoundPathSync(target, ignoreError = false, ignoreName = true) {
    let targetTmp = target;
    if (!targetTmp) {
      throw Logger.error(`PlaylistSound is undefined`, true, targetTmp);
    }
    if (targetTmp instanceof PlaylistSound) {
      return targetTmp.path;
    }
    // This is just a patch for compatibility with others modules
    if (targetTmp.document) {
      targetTmp = targetTmp.document;
    }
    if (targetTmp.uuid) {
      targetTmp = targetTmp.uuid;
    }

    if (targetTmp instanceof PlaylistSound) {
      return targetTmp;
    }
    if (typeof targetTmp === "string" || targetTmp instanceof String) {
      return targetTmp;
    }
    if (RetrieveHelpers.stringIsUuid(targetTmp)) {
      targetTmp = fromUuidSync(targetTmp);
    } else {
      targetTmp = game.playlists.contents
        .flatMap((playlist) => playlist.sounds.contents)
        .find((playlistSound) => {
          return playlistSound.id === targetTmp || playlistSound.name === targetTmp;
        });
    }
    if (!targetTmp) {
      if (ignoreError) {
        Logger.warn(`PlaylistSound is not found`, true, targetTmp);
        return;
      } else {
        throw Logger.error(`PlaylistSound is not found`, true, targetTmp);
      }
    }
    // Type checking
    // if (!(targetTmp instanceof PlaylistSound)) {
    //   if (ignoreError) {
    //     Logger.warn(`Invalid PlaylistSound`, true, targetTmp);
    //     return;
    //   } else {
    //     throw Logger.error(`Invalid PlaylistSound`, true, targetTmp);
    //   }
    // }
    return targetTmp.path;
  }

  static async getPlaylistSoundPathAsync(target, ignoreError = false, ignoreName = true) {
    let targetTmp = target;
    if (!targetTmp) {
      throw Logger.error(`PlaylistSound is undefined`, true, targetTmp);
    }
    if (targetTmp instanceof PlaylistSound) {
      return targetTmp.path;
    }
    // This is just a patch for compatibility with others modules
    if (targetTmp.document) {
      targetTmp = targetTmp.document;
    }
    if (targetTmp.uuid) {
      targetTmp = targetTmp.uuid;
    }

    if (targetTmp instanceof PlaylistSound) {
      return targetTmp;
    }
    if (typeof targetTmp === "string" || targetTmp instanceof String) {
      return targetTmp;
    }
    if (RetrieveHelpers.stringIsUuid(targetTmp)) {
      targetTmp = await fromUuid(targetTmp);
    } else {
      targetTmp = game.playlists.contents
        .flatMap((playlist) => playlist.sounds.contents)
        .find((playlistSound) => {
          return playlistSound.id === targetTmp || playlistSound.name === targetTmp;
        });
    }
    if (!targetTmp) {
      if (ignoreError) {
        Logger.warn(`PlaylistSound is not found`, true, targetTmp);
        return;
      } else {
        throw Logger.error(`PlaylistSound is not found`, true, targetTmp);
      }
    }
    // Type checking
    if (!(targetTmp instanceof PlaylistSound)) {
      if (ignoreError) {
        Logger.warn(`Invalid PlaylistSound`, true, targetTmp);
        return;
      } else {
        throw Logger.error(`Invalid PlaylistSound`, true, targetTmp);
      }
    }
    return targetTmp.path;
  }
}
