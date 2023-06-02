import {MAGICITEMS} from "./config.js";
import {MagicItemActor} from "./magicitemactor.js";

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
        if(MagicItemActor.get(app.actor.id)) {
            let sheet = magicItemSheets[app.id];
            if(!sheet) {
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

        if(this.actor.hasMagicItems()) {
            this.render();
        }
    }

    /**
     *
     * @returns {Promise<void>}
     */
    async render() {
        if(this.actor.hasItemsFeats()) {
            await this.renderTemplate('magic-item-feat-sheet', 'magic-items-feats-content', 'features');
        }
        if(this.actor.hasItemsSpells()) {
            await this.renderTemplate('magic-item-spell-sheet', 'magic-items-spells-content', 'spellbook');
        }

        this.actor.items.filter(item => item.visible).forEach(item => {
            let itemEl = this.html.find(`.inventory-list .item-list .item[data-item-id="${item.id}"]`);
            let h4 = itemEl.find('h4');
            if(!h4.find('i.fa-magic').length) {
                h4.append('<i class="fas fa-magic attuned" style="margin-left: 5px;" title="Magic Item"></i>');
            }
        });

        this.handleEvents();
    }

    /**
     * Utility functions, render or replace the template by name in the passed tab.
     *
     * @param name
     * @param cls
     * @param tab
     * @returns {Promise<void>}
     */
    async renderTemplate(name, cls, tab) {
        let template = await renderTemplate(`modules/magicitems/templates/${name}.html`, this.actor);
        let el = this.html.find(`.${cls}`);
        if(el.length) {
            el.replaceWith(template);
        } else {
            this.html.find(`.${tab} .inventory-list`).append(template);
        }
    }

    /**
     *
     */
    handleEvents() {
        this.html.find('.item div.magic-item-image').click(evt => this.onItemRoll(evt));
        this.html.find('.item h4.spell-name').click(evt => this.onItemShow(evt));
        this.actor.items.forEach(item => {
            this.html.find(`input[data-item-id="magicitems.${item.id}.uses"]`).change(evt => {
                item.setUses(MAGICITEMS.numeric(evt.currentTarget.value, item.uses));
                item.update();
            });
            item.ownedEntries.forEach(entry => {
                this.html.find(`input[data-item-id="magicitems.${item.id}.${entry.id}.uses"]`).change(evt => {
                    entry.uses = MAGICITEMS.numeric(evt.currentTarget.value, entry.uses);
                    item.update();
                });
            });
        });
        this.html.find(`li.item.magic-item`).each((i, li) => {
            li.addEventListener("dragstart", this.onDragItemStart.bind(this), false);
        });
    }

    /**
     *
     * @param evt
     */
    onItemRoll(evt) {
        evt.preventDefault();
        let dataset = evt.currentTarget.closest(".item").dataset;
        let magicItemId = dataset.magicItemId;
        let itemId = dataset.itemId;
        this.actor.roll(magicItemId, itemId).then(() => { this.render() });
    }

    /**
     *
     * @param evt
     */
    onItemShow(evt) {
        evt.preventDefault();
        let dataset = evt.currentTarget.closest(".item").dataset;
        let magicItemId = dataset.magicItemId;
        let itemId = dataset.itemId;
        this.actor.renderSheet(magicItemId, itemId);
    }

    /**
     *
     * @param evt
     */
    onDragItemStart(evt) {
        const li = evt.currentTarget;
        let magicItemId = li.dataset.magicItemId;
        let itemId = li.dataset.itemId;
        let magicItem = this.actor.magicItem(magicItemId);
        let item = magicItem.entryBy(itemId);

        const dragData = {
            type: "MagicItem",
            name: `${magicItem.name} > ${item.name}`,
            img: item.img,
            magicItemName: magicItem.name,
            itemName: item.name
        };
        evt.dataTransfer.setData("text/plain", JSON.stringify(dragData));
    }
}