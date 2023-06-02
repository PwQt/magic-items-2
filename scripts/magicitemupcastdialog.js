/**
 * A specialized Dialog subclass for casting a spell item at a certain level
 * @type {Dialog}
 */
export class MagicItemUpcastDialog extends Dialog {

    constructor(item, dialogData={}, options={}) {
        super(dialogData, options);
        this.options.classes = ["dnd5e", "dialog"];
        this.item = item;
    }

    activateListeners(html) {
        super.activateListeners(html);
        html.find(`select[name="level"]`).change(evt => {
            let level = parseInt(evt.target.value);
            let consumption = this.item.consumptionAt(level);
            html.find(`input[name="consumption"]`).val(consumption);
        });
    }

    static async create(magicItem, item) {
        const html = await renderTemplate("modules/magicitems/templates/magic-item-upcast-dialog.html", item);

        // Create the Dialog and return as a Promise
        return new Promise((resolve, reject) => {
            const dlg = new this(item, {
                title: `${magicItem.name} > ${item.name}: Spell Configuration`,
                content: html,
                buttons: {
                    cast: {
                        icon: '<i class="fas fa-magic"></i>',
                        label: "Cast",
                        callback: html => resolve(new FormData(html[0].querySelector("#spell-config-form")))
                    }
                },
                default: "cast",
                close: reject
            });
            dlg.render(true);
        });
    }
}
