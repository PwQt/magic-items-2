import { MAGICITEMS } from "./config.js";
import CONSTANTS from "./constants/constants.js";
import Logger from "./lib/Logger.js";
import { MagicItemHelpers } from "./magic-item-helpers.js";
import { MagicItemActor } from "./magicitemactor.js";

const magicItemSheets = [];

export class MagicItemSheet {
  /**
   * Crete and register an instance of a MagicItemSheet, if not already present,
   * bindings with the corresponding MagiItemActor and reinitialize with the new rendered html.
   *
   * @param app
   * @param html
   * @param data
   */
  static bind(app, html, data) {
    if (MagicItemActor.get(app.actor.id)) {
      let sheet = magicItemSheets[app.id];
      if (!sheet) {
        sheet = new MagicItemSheet(app.actor.id);
        magicItemSheets[app.id] = sheet;
      }
      sheet.init(html, data);
    }
  }

  /**
   * Ctor. builds a new MagicItemSheet with the required actorId.
   *
   * @param actorId
   */
  constructor(actorId) {
    this.actor = MagicItemActor.get(actorId);
    this.actor.onChange(() => this.render());
  }

  /**
   * Set the rendered html from the original sheet and render if the actor has magic items.
   *
   * @param html
   * @param data
   */
  init(html, data) {
    this.html = html;
    this.data = data;

    if (this.actor.hasMagicItems()) {
      this.render();
    }
  }

  /**
   * Render the sheet
   * @returns {Promise<void>}
   */
  async render() {
    Logger.log(`IsUsingNew5eSheet: ${this.actor.isUsingNew5eSheet}`);
    if (!this.actor.isUsingNew5eSheet) {
      if (this.actor.hasItemsFeats()) {
        await this.renderTemplate(
          "magic-item-feat-sheet.html",
          "magic-items-feats-content",
          "features",
          "inventory-list"
        );
      }
      if (this.actor.hasItemsSpells()) {
        await this.renderTemplate(
          "magic-item-spell-sheet.html",
          "magic-items-spells-content",
          "spellbook",
          "inventory-list"
        );
      }
    } else {
      if (this.actor.hasItemsFeats()) {
        await this.renderTemplate(
          "magic-item-feat-sheet-v2.hbs",
          "magic-items-feats-content",
          "features",
          "features-list"
        );
        this.html.find(".item-tooltip").each((idx, el) => this.addToolTips(el));
      }
      if (this.actor.hasItemsSpells()) {
        await this.renderTemplate(
          "magic-item-spell-sheet-v2.hbs",
          "magic-items-spells-content",
          "spells",
          "spells-list"
        );
        this.html.find(".item-tooltip").each((idx, el) => this.addToolTips(el));
      }
    }

    this.actor.items
      .filter((item) => item.visible)
      .forEach((item) => {
        let itemEl = this.html.find(`.inventory-list .item-list .item[data-item-id="${item.id}"]`);
        let itemName = this.actor.isUsingNew5eSheet ? itemEl.find(".name .subtitle") : itemEl.find("h4");
        if (!itemName.find("i.fa-magic").length) {
          itemName.append(CONSTANTS.HTML.MAGIC_ITEM_ICON);
        }
      });

    MagicItemSheet.handleEvents(this.html, this.actor);
  }

  /**
   * Utility functions, render or replace the template by name in the passed tab.
   *
   * @param filename
   * @param cls
   * @param tab
   * @returns {Promise<void>}
   */
  async renderTemplate(filename, cls, tab, listName) {
    let template = await renderTemplate(`modules/${CONSTANTS.MODULE_ID}/templates/${filename}`, this.actor);
    let el = this.html.find(`.${cls}`);
    if (el.length) {
      el.replaceWith(template);
    } else {
      this.html.find(`.${tab} .${listName}`).append(template);
    }
  }

  /**
   * Adds spell tooltips to magic items on spells tab
   *
   * @param {*} element
   */
  addToolTips(element) {
    if ("tooltip" in element.dataset) return;
    const target = element.closest("[data-item-id], [data-uuid]");
    const uuid = target.dataset?.itemUuid;
    if (!uuid) return;
    element.dataset.tooltip = `
      <section class="loading" data-uuid="${uuid}"><i class="fas fa-spinner fa-spin-pulse"></i></section>
    `;
    element.dataset.tooltipClass = "dnd5e2 dnd5e-tooltip item-tooltip";
    element.dataset.tooltipDirection ??= "LEFT";
  }

  /**
   *
   */
  static handleEvents(html, actor) {
    if (!actor.isUsingNew5eSheet) {
      html.find(".item div.magic-item-image").click((evt) => MagicItemSheet.onItemRoll(evt, actor));
      html.find(".item h4.spell-name").click((evt) => MagicItemSheet.onItemShow(evt));
    } else {
      html.find(".item.magic-item .item-name").click((evt) => MagicItemSheet.onItemRoll(evt, actor));
    }
    MagicItemSheet.handleActorItemUsesChangeEvents(html, actor);
    MagicItemSheet.handleMagicItemDragStart(html, actor);
  }

  static handleMagicItemDragStart(html, actor) {
    html.find(`li.item.magic-item`).each((i, li) => {
      li.addEventListener("dragstart", (evt) => MagicItemSheet.onDragItemStart(evt, actor));
    });
  }

  static handleActorItemUsesChangeEvents(html, actor) {
    actor.items.forEach((item) => {
      html.find(`input[data-item-id="magicitems.${item.id}.uses"]`).change((evt) => {
        item.setUses(MagicItemHelpers.numeric(evt.currentTarget.value, item.uses));
        item.update();
      });
      item.ownedEntries.forEach((entry) => {
        html.find(`input[data-item-id="magicitems.${item.id}.${entry.id}.uses"]`).change((evt) => {
          entry.uses = MagicItemHelpers.numeric(evt.currentTarget.value, entry.uses);
          item.update();
        });
      });
    });
  }

  /**
   *
   * @param evt
   */
  static async onItemRoll(evt, actor) {
    evt.preventDefault();
    let dataset = evt.currentTarget.closest(".item").dataset;
    let magicItemId = dataset.magicItemId;
    let itemId = dataset.itemId;
    await actor.roll(magicItemId, itemId);
    // this.render();
  }

  /**
   *
   * @param evt
   */
  static async onItemShow(evt) {
    evt.preventDefault();
    let dataset = evt.currentTarget.closest(".item").dataset;
    let itemId = dataset.itemId;
    let itemUuid = dataset.itemUuid;
    let itemPack = dataset.itemPack;

    let uuid = null;
    if (itemUuid) {
      uuid = itemUuid;
    } else {
      uuid = MagicItemHelpers.retrieveUuid({
        documentName: null,
        documentId: itemId,
        documentCollectionType: "Item",
        documentPack: itemPack,
      });
    }
    const itemTmp = await fromUuid(uuid);
    itemTmp.ownership.default = CONST.DOCUMENT_PERMISSION_LEVELS.LIMITED;
    itemTmp.sheet.render(true);
  }

  /**
   *
   * @param evt
   */
  static onDragItemStart(evt, actor) {
    const li = evt.currentTarget;
    let magicItemId = li.dataset.magicItemId;
    let itemId = li.dataset.itemId;
    let magicItem = actor.magicItem(magicItemId);
    let item = magicItem.entryBy(itemId);

    const dragData = {
      type: "MagicItem",
      name: `${magicItem.name} > ${item.name}`,
      img: item.img,
      magicItemName: magicItem.name,
      itemName: item.name,
    };
    evt.dataTransfer.setData("text/plain", JSON.stringify(dragData));
  }
}
