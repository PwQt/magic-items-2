import {MAGICITEMS} from "./config.js";
import {MagicItem} from "./magicitem.js";

const magicItemTabs = [];

export class MagicItemTab {

    static bind(app, html, item) {
        let acceptedTypes = ['weapon', 'equipment', 'consumable', 'tool', 'backpack', 'feat'];
        if(acceptedTypes.includes(item.document.type)) {
            let tab = magicItemTabs[app.id];
            if(!tab) {
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

        if(html[0].localName !== "div") {
            html = $(html[0].parentElement.parentElement);
        }

        let tabs = html.find(`form nav.sheet-navigation.tabs`);
        if(tabs.find('a[data-tab=magicitems]').length > 0) {
            return; // already initialized, duplication bug!
        }

        tabs.append($(
            '<a class="item" data-tab="magicitems">Magic Item</a>'
        ));

        $(html.find(`.sheet-body`)).append($(
            '<div class="tab magic-items" data-group="primary" data-tab="magicitems"></div>'
        ));

        this.html = html;
        this.editable = data.editable;

        if(this.editable) {
            const dragDrop = new DragDrop({
                dropSelector: '.tab.magic-items',
                permissions: {
                    dragstart: this.app._canDragStart.bind(this.app),
                    drop: this.app._canDragDrop.bind(this.app)
                },
                callbacks: {
                    dragstart: this.app._onDragStart.bind(this.app),
                    dragover: this.app._onDragOver.bind(this.app),
                    drop: this._onDrop.bind(this)
                }
            });

            this.app._dragDrop.push(dragDrop);
            dragDrop.bind(this.app.form);
        }

        this.magicItem = new MagicItem(this.item.flags.magicitems);

        this.render();
    }

    hack(app) {
        let tab = this;
        app.setPosition = function(position={}) {
            position.height = tab.isActive() && !position.height ? "auto" : position.height;
            return this.__proto__.__proto__.setPosition.apply(this, [position])
        };
    }

    async render() {

        this.magicItem.sort();

        let template = await renderTemplate('modules/magicitems/templates/magic-item-tab.html', this.magicItem);
        let el = this.html.find(`.magic-items-content`);
        if(el.length) {
            el.replaceWith(template);
        } else {
            this.html.find('.tab.magic-items').append(template);
        }

        let magicItemEnabled = this.html.find('.magic-item-enabled');
        if(this.magicItem.enabled) {
            magicItemEnabled.show();
        } else {
            magicItemEnabled.hide();
        }

        let magicItemDestroyType = this.html.find('select[name="flags.magicitems.destroyType"]');
        if(this.magicItem.chargeType === 'c1') {
            magicItemDestroyType.show();
        } else {
            magicItemDestroyType.hide();
        }

        let magicItemDestroyCheck = this.html.find('select[name="flags.magicitems.destroyCheck"]');
        let magicItemFlavorText = this.html.find('.magic-item-destroy-flavor-text');
        if(this.magicItem.destroy) {
            magicItemDestroyCheck.prop("disabled", false);
            magicItemDestroyType.prop("disabled", false);
            magicItemFlavorText.show();
        } else {
            magicItemDestroyCheck.prop("disabled", true);
            magicItemDestroyType.prop("disabled", true);
            magicItemFlavorText.hide();
        }

        let magicItemRecharge = this.html.find('.form-group.magic-item-recharge');
        if(this.magicItem.rechargeable) {
            magicItemRecharge.show();
        } else {
            magicItemRecharge.hide();
        }

        let rechargeField = this.html.find('input[name="flags.magicitems.recharge"]');
        if(this.magicItem.rechargeType === MAGICITEMS.FORMULA_FULL) {
            rechargeField.prop("disabled", true);
        } else {
            rechargeField.prop("disabled", false);
        }

        if(this.editable) {
            this.handleEvents();
        } else {
            this.html.find('input').prop("disabled", true);
            this.html.find('select').prop("disabled", true);
        }

        this.app.setPosition();

        if(this.activate && !this.isActive()) {
            this.app._tabs[0].activate("magicitems");
            this.activate = false;
        }
    }

    handleEvents() {

        this.html.find('.magic-items-content input[type="text"]').change(evt => {
            this.activate = true;
            this.render();
        });
        this.html.find('.magic-items-content select').change(evt => {
            this.activate = true;
            this.render();
        });

        this.html.find('input[name="flags.magicitems.enabled"]').click(evt => {
            this.magicItem.toggleEnabled(evt.target.checked);
            this.render();
        });
        this.html.find('input[name="flags.magicitems.equipped"]').click(evt => {
            this.magicItem.equipped = evt.target.checked;
            this.render();
        });
        this.html.find('input[name="flags.magicitems.attuned"]').click(evt => {
            this.magicItem.attuned = evt.target.checked;
            this.render();
        });
        this.html.find('input[name="flags.magicitems.charges"]').change(evt => {
            this.magicItem.charges = MAGICITEMS.numeric(evt.target.value, this.magicItem.charges);
            this.render();
        });
        this.html.find('select[name="flags.magicitems.chargeType"]').change(evt => {
            this.magicItem.chargeType = evt.target.value;
            this.magicItem.updateDestroyTarget();
            this.render();
        });
        this.html.find('input[name="flags.magicitems.rechargeable"]').change(evt => {
            this.magicItem.toggleRechargeable(evt.target.checked);
            this.render();
        });
        this.html.find('input[name="flags.magicitems.recharge"]').change(evt => {
            this.magicItem.recharge = evt.target.value;
            this.render();
        });
        this.html.find('select[name="flags.magicitems.rechargeType"]').change(evt => {
            this.magicItem.rechargeType = evt.target.value;
            this.render();
        });
        this.html.find('select[name="flags.magicitems.rechargeUnit"]').change(evt => {
            this.magicItem.rechargeUnit = evt.target.value;
            this.render();
        });
        this.html.find('input[name="flags.magicitems.destroy"]').change(evt => {
            this.magicItem.destroy = evt.target.checked;
            this.render();
        });
        this.html.find('select[name="flags.magicitems.destroyCheck"]').change(evt => {
            this.magicItem.destroyCheck = evt.target.value;
            this.render();
        });
        this.html.find('select[name="flags.magicitems.destroyType"]').change(evt => {
            this.magicItem.destroyType = evt.target.value;
            this.render();
        });
        this.html.find('input[name="flags.magicitems.destroyFlavorText"]').change(evt => {
            this.magicItem.destroyFlavorText = evt.target.value;
            this.render();
        });
        this.html.find('input[name="flags.magicitems.sorting"]').change(evt => {
            this.magicItem.sorting = evt.target.value;
            this.magicItem.sort();
            this.render();
        });
        this.html.find('.item-delete.item-spell').click(evt => {
            this.magicItem.removeSpell(evt.target.getAttribute("data-spell-idx"));
            this.render();
        });
        this.html.find('.item-delete.item-feat').click(evt => {
            this.magicItem.removeFeat(evt.target.getAttribute("data-feat-idx"));
            this.render();
        });
        this.html.find('.item-delete.item-table').click(evt => {
            this.magicItem.removeTable(evt.target.getAttribute("data-table-idx"));
            this.render();
        });
        this.magicItem.spells.forEach((spell, idx) => {
            this.html.find(`select[name="flags.magicitems.spells.${idx}.level"]`).change(evt => {
                spell.level = parseInt(evt.target.value);
                this.render();
            });
            this.html.find(`input[name="flags.magicitems.spells.${idx}.consumption"]`).change(evt => {
                spell.consumption = MAGICITEMS.numeric(evt.target.value, spell.consumption);
                this.render();
            });
            this.html.find(`select[name="flags.magicitems.spells.${idx}.upcast"]`).change(evt => {
                spell.upcast = parseInt(evt.target.value);
                this.render();
            });
            this.html.find(`input[name="flags.magicitems.spells.${idx}.upcastCost"]`).change(evt => {
                spell.upcastCost = MAGICITEMS.numeric(evt.target.value, spell.cost);
                this.render();
            });
            this.html.find(`input[name="flags.magicitems.spells.${idx}.flatDc"]`).click(evt => {
                spell.flatDc = evt.target.checked;
                this.render();
            });
            this.html.find(`input[name="flags.magicitems.spells.${idx}.dc"]`).change(evt => {
                spell.dc = evt.target.value;
                this.render();
            });
            this.html.find(`a[data-spell-idx="${idx}"]`).click(evt => {
                spell.renderSheet();
            });
        });
        this.magicItem.feats.forEach((feat, idx) => {
            this.html.find(`select[name="flags.magicitems.feats.${idx}.effect"]`).change(evt => {
                feat.effect = evt.target.value;
                this.render();
            });
            this.html.find(`input[name="flags.magicitems.feats.${idx}.consumption"]`).change(evt => {
                feat.consumption = MAGICITEMS.numeric(evt.target.value, feat.consumption);
                this.render();
            });
            this.html.find(`a[data-feat-idx="${idx}"]`).click(evt => {
                feat.renderSheet();
            });
        });
        this.magicItem.tables.forEach((table, idx) => {
            this.html.find(`input[name="flags.magicitems.tables.${idx}.consumption"]`).change(evt => {
                table.consumption = MAGICITEMS.numeric(evt.target.value, table.consumption);
            });
            this.html.find(`a[data-table-idx="${idx}"]`).click(evt => {
                table.renderSheet();
            });
        });
    }

    async _onDrop(evt) {
        evt.preventDefault();

        let data;
        try {
            data = JSON.parse(evt.dataTransfer.getData('text/plain'));
            if(!this.magicItem.support(data.type)) {
                return;
            }
        } catch (err) {
            return false;
        }

        const entity = await fromUuid(data.uuid);
        const pack = entity.pack ? entity.pack : "world";

        if(entity && this.magicItem.compatible(entity)) {
            this.magicItem.addEntity(entity, pack);
            this.render();
        }
    }

    isActive() {
        return $(this.html).find('a.item[data-tab="magicitems"]').hasClass("active");
    }
}