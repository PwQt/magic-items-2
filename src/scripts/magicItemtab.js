import { MAGICITEMS } from "./config.js";
import CONSTANTS from "./constants/constants.js";
import Logger from "./lib/Logger.js";
import { MagicItemHelpers } from "./magic-item-helpers.js";
import { MagicItem } from "./magic-item/MagicItem.js";

const magicItemTabs = [];

export class MagicItemTab {
  static bind(app, html, item) {
    let acceptedTypes = ["weapon", "equipment", "consumable", "tool", "backpack", "feat"];
    if (acceptedTypes.includes(item.document.type)) {
      let tab = magicItemTabs[app.id];
      if (!tab) {
        tab = new MagicItemTab(app);
        magicItemTabs[app.id] = tab;
      }
      tab.init(html, item);
    }
  }

  constructor(app) {
    this.app = app;
    this.item = app.item;

    this.hack(this.app);

    this.activate = false;
  }

  init(html, data) {
    if (html[0].localName !== "div") {
      html = $(html[0].parentElement.parentElement);
    }
    let tabs = html.find(`form nav.sheet-navigation.tabs`);
    if (tabs.find("a[data-tab=magicitems]").length > 0) {
      return; // already initialized, duplication bug!
    }

    tabs.append($('<a class="item" data-tab="magicitems">Magic Item</a>'));

    $(html.find(`.sheet-body`)).append(
      $('<div class="tab magic-items" data-group="primary" data-tab="magicitems"></div>')
    );

    this.html = html;
    this.editable = data.editable;

    if (this.editable) {
      const dragDrop = new DragDrop({
        dropSelector: ".tab.magic-items",
        permissions: {
          dragstart: this._canDragStart.bind(this.app),
          drop: this._canDragDrop.bind(this.app),
        },
        callbacks: {
          dragstart: this.app._onDragStart.bind(this.app),
          dragover: this.app._onDragOver.bind(this.app),
          drop: (event) => {
            this.activate = true;
            this.onDrop.call(this, event);
          },
        },
      });

      this.app._dragDrop.push(dragDrop);
      dragDrop.bind(this.app.form);
    }

    this.magicItem = new MagicItem(this.item.flags.magicitems);

    this.render();
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

  async render() {
    // TODO: Sort as part of the magic item adapter when enumerating items
    this.magicItem.sort();

    let template = await renderTemplate(`modules/${CONSTANTS.MODULE_ID}/templates/magic-item-tab.hbs`, this.magicItem);
    let el = this.html.find(`.magic-items-content`);
    if (el.length) {
      el.replaceWith(template);
    } else {
      this.html.find(".tab.magic-items").append(template);
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
      this.html.find("input").prop("disabled", true);
      this.html.find("select").prop("disabled", true);
    }

    this.app.setPosition();

    if (this.activate && !this.isActive()) {
      this.app._tabs[0].activate("magicitems");
      this.activate = false;
    } else {
      this.activate = false;
    }
  }

  async onDrop(evt) {
    evt.preventDefault();

    let data;
    try {
      data = JSON.parse(evt.dataTransfer.getData("text/plain"));
      if (!this.magicItem.support(data.type)) {
        return;
      }
    } catch (err) {
      return false;
    }

    const entity = await fromUuid(data.uuid);
    const pack = entity.pack ? entity.pack : "world";

    if (entity && this.magicItem.compatible(entity)) {
      this.magicItem.addEntity(entity, pack);
      this.item.update({
        flags: {
          magicitems: this.magicItem.serializeData(),
        },
      });
    }
  }

  isActive() {
    $(this.html).find('a.item[data-tab="magicitems"]').hasClass("active");
  }

  _canDragDrop() {
    return true;
  }

  _canDragStart() {
    return true;
  }

  activateTabManagementListeners() {
    this.html.find(".magic-items-content").on("change", ":input, :focus", (evt) => {
      this.activate = true;
    });
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
  static activateTabContentsListeners({
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
          magicitems: magicItem.serializeData(),
        },
      });
    });
    html.find(".item-delete.item-feat").click((evt) => {
      magicItem.removeFeat(evt.target.getAttribute("data-feat-idx"));
      onMagicItemUpdatingCallback?.();
      item.update({
        flags: {
          magicitems: magicItem.serializeData(),
        },
      });
    });
    html.find(".item-delete.item-table").click((evt) => {
      magicItem.removeTable(evt.target.getAttribute("data-table-idx"));
      onMagicItemUpdatingCallback?.();
      item.update({
        flags: {
          magicitems: magicItem.serializeData(),
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
}
