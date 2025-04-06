import CONSTANTS from "./constants/constants.js";
import { MagicItemHelpers } from "./magic-item-helpers.js";
import { MagicItem } from "./magic-item/MagicItem.js";
import Logger from "./lib/Logger.js";

const magicItemTabs = [];

export class MagicItemTab {
  static bind(app, html, item) {
    if (MagicItemTab.isAcceptedItemType(item.item)) {
      let tab = magicItemTabs[app.id];
      if (!tab) {
        tab = new MagicItemTab(app);
        magicItemTabs[app.id] = tab;
      }
      tab.init(html, item, app);
    }
  }

  constructor(app) {
    this.hack(app);
    this.activate = false;
  }

  init(html, data, app) {
    this.item = app.item;
    this.html = html;
    this.editable = data.editable;

    if (html[0].localName !== "div") {
      html = $(html[0].parentElement.parentElement);
    }
    let tabs = html.find(`form nav.sheet-navigation.tabs`);
    if (tabs.find(`a[data-tab=${CONSTANTS.MODULE_ID}]`).length > 0) {
      return; // already initialized, duplication bug!
    }

    tabs.append($(`<a class="item" data-tab="${CONSTANTS.MODULE_ID}">Magic Item</a>`));

    $(html.find(`.sheet-body`)).append(
      $(`<div class="tab magicitems" data-group="primary" data-tab="${CONSTANTS.MODULE_ID}"></div>`),
    );

    if (this.editable) {
      const dragDrop = new DragDrop({
        dropSelector: ".tab.magicitems",
        permissions: {
          dragstart: this._canDragStart.bind(app),
          drop: this._canDragDrop.bind(app),
        },
        callbacks: {
          dragstart: app._onDragStart.bind(app),
          dragover: app._onDragOver.bind(app),
          drop: (event) => {
            this.activate = true;
            MagicItemTab.onDrop({
              event: event,
              item: this.item,
              magicItem: this.magicItem,
            });
          },
        },
      });

      app._dragDrop.push(dragDrop);
      dragDrop.bind(app.form);
    }
    const flagsData = foundry.utils.getProperty(app.item, `flags.${CONSTANTS.MODULE_ID}`);
    this.magicItem = new MagicItem(flagsData);

    this.render(app);
  }

  hack(app) {
    let tab = this;
    app.setPosition = function (position = {}) {
      position.height = tab.isActive() && !position.height ? "auto" : position.height;
      let that = this;
      for (let i = 0; i < 100; i++) {
        if (that.constructor.name === ItemSheet.name) {
          break;
        }
        that = Object.getPrototypeOf(that);
      }
      return that.setPosition.apply(this, [position]);
    };
  }

  async render(app) {
    let template = null;
    if (MagicItemTab.isUsingNew5eSheet(this.item)) {
      template = await renderTemplate(`modules/${CONSTANTS.MODULE_ID}/templates/magic-item-tab-v2.hbs`, this.magicItem);
    }
    let el = this.html.find(`.magicitems-content`);
    if (el.length) {
      el.replaceWith(template);
    } else {
      this.html.find(".tab.magicitems").append(template);
    }

    if (this.editable) {
      this.activateTabManagementListeners();
      MagicItemTab.activateTabContentsListeners({
        html: this.html,
        item: this.item,
        magicItem: this.magicItem,
        onItemUpdatingCallback: () => {
          this.activate = true;
        },
      });
    } else {
      MagicItemTab.disableMagicItemTabInputs(this.html);
    }

    if (this.activate && !this.isActive()) {
      app._tabs[0].activate(`${CONSTANTS.MODULE_ID}`);

      this.activate = false;
    }
  }

  isActive() {
    return $(this.html).find(`a.item[data-tab="${CONSTANTS.MODULE_ID}"]`).hasClass("active");
  }

  _canDragDrop() {
    return true;
  }

  _canDragStart() {
    return true;
  }

  activateTabManagementListeners() {
    this.html.find(".magicitems-content").on("change", ":input", (evt) => {
      this.activate = true;
    });
  }

  /**
   * Disable all relevant inputs in the magic items tab.
   */
  static disableMagicItemTabInputs(html) {
    html.find(".magicitems-content input").prop("disabled", true);
    html.find(".magicitems-content select").prop("disabled", true);
  }

  /**
   * Handles drop event for compatible magic item source (for example, a spell).
   *
   * @param {object} params Parameters needed to handle item drops to the magic item tab.
   * @param {DragEvent} params.event The drop event.
   * @param {Item5e} params.item The target item.
   * @param {MagicItem} params.magicItem The relevant magic item associated with the target item.
   * @returns
   */
  static async onDrop({ event, item, magicItem }) {
    event.preventDefault();

    let data;
    try {
      data = JSON.parse(event.dataTransfer.getData("text/plain"));
      if (!magicItem.support(data.type)) {
        return;
      }
    } catch (err) {
      return false;
    }

    const entity = await fromUuid(data.uuid);
    const pack = entity.pack ? entity.pack : "world";

    if (entity && magicItem.compatible(entity)) {
      magicItem.addEntity(entity, pack);
      await item.update({
        flags: {
          [CONSTANTS.MODULE_ID]: magicItem.serializeData(),
        },
      });
    }
  }

  /**
   * Activates listeners related to tab contents.
   *
   * @param {object}    params The parameters for wiring up tab content event handling.
   * @param {jQuery}    params.html The sheet HTML jQuery element
   * @param {Item5e}    params.item The item which is to be changed.
   * @param {MagicItem} params.magicItem A Magic Item instance
   * @param {Function}  params.onItemUpdatingCallback A callback for handling when item updates are about to be applied. This is useful for current tab management.
   */
  static async activateTabContentsListeners({
    html,
    item,
    magicItem,
    onItemUpdatingCallback: onMagicItemUpdatingCallback = null,
  }) {
    html.find(".item-delete.item-spell").click((evt) => {
      magicItem.removeSpell(evt.target.getAttribute("data-spell-idx"));
      onMagicItemUpdatingCallback?.();
      item.update({
        flags: {
          [CONSTANTS.MODULE_ID]: magicItem.serializeData(),
        },
      });
    });
    html.find(".item-delete.item-feat").click((evt) => {
      magicItem.removeFeat(evt.target.getAttribute("data-feat-idx"));
      onMagicItemUpdatingCallback?.();
      item.update({
        flags: {
          [CONSTANTS.MODULE_ID]: magicItem.serializeData(),
        },
      });
    });
    html.find(".item-delete.item-table").click((evt) => {
      magicItem.removeTable(evt.target.getAttribute("data-table-idx"));
      onMagicItemUpdatingCallback?.();
      item.update({
        flags: {
          [CONSTANTS.MODULE_ID]: magicItem.serializeData(),
        },
      });
    });

    magicItem.spells.forEach((spell, idx) => {
      html.find(`a[data-spell-idx="${idx}"]`).click((evt) => {
        spell.renderSheet();
      });
    });
    magicItem.feats.forEach((feat, idx) => {
      html.find(`a[data-feat-idx="${idx}"]`).click((evt) => {
        feat.renderSheet();
      });
    });
    magicItem.tables.forEach((table, idx) => {
      html.find(`a[data-table-idx="${idx}"]`).click((evt) => {
        table.renderSheet();
      });
    });
  }

  static get acceptedItemTypes() {
    return ["weapon", "equipment", "consumable", "tool", "backpack", "feat"];
  }

  static isAcceptedItemType(document) {
    return MagicItemTab.acceptedItemTypes.includes(document?.type);
  }

  static isAllowedToShow() {
    return game.user.isGM || !game.settings.get(CONSTANTS.MODULE_ID, "hideFromPlayers");
  }

  static isUsingNew5eSheet(item) {
    return item?.sheet && MagicItemHelpers.isUsingNew5eSheet(item?.sheet);
  }
}
