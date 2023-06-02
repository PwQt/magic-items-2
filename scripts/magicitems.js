import {MagicItemActor} from "./magicitemactor.js";
import {MagicItemSheet} from "./magicitemsheet.js";
import {MagicItemTab} from "./magicItemtab.js";

//CONFIG.debug.hooks = true;

Handlebars.registerHelper('enabled', function(value, options) {
    return Boolean(value) ? "" : "disabled";
});

Hooks.once('init', () => {

    game.settings.register("magicitems", "identifiedOnly", {
        name: "MAGICITEMS.SettingIdentifiedOnly",
        hint: "MAGICITEMS.SettingIdentifiedOnlyHint",
        scope: "world",
        type: Boolean,
        default: true,
        config: true,
    });

    game.settings.register("magicitems", "hideFromPlayers", {
        name: "MAGICITEMS.SettingHideFromPlayers",
        hint: "MAGICITEMS.SettingHideFromPlayersHint",
        scope: "world",
        type: Boolean,
        default: false,
        config: true,
    });

    if(typeof Babele !== 'undefined') {

        Babele.get().register({
            module: 'magicitems',
            lang: 'it',
            dir: 'lang/packs/it'
        });
    }
});

Hooks.once('ready', () => {
    Array.from(game.actors).filter(actor => actor.permission >= 1).forEach(actor => {
        MagicItemActor.bind(actor);
    });
});

Hooks.once('createActor', (actor) => {
    if(actor.permission >= 2) {
        MagicItemActor.bind(actor);
    }
});

Hooks.on(`renderItemSheet5e`, (app, html, data) => {
    if(!game.user.isGM && game.settings.get("magicitems", "hideFromPlayers")) {
        return;
    }
    MagicItemTab.bind(app, html, data);
});

Hooks.on(`renderActorSheet5eCharacter`, (app, html, data) => {
    MagicItemSheet.bind(app, html, data);
});

Hooks.on(`renderActorSheet5eNPC`, (app, html, data) => {
    MagicItemSheet.bind(app, html, data);
});

Hooks.on("hotbarDrop", async (bar, data, slot) => {
    if ( data.type !== "MagicItem" ) return;

    const command = `MagicItems.roll("${data.magicItemName}","${data.itemName}");`;
    let macro = game.macros.entities.find(m => (m.name === data.name) && (m.command === command));
    if (!macro) {
        macro = await Macro.create({
            name: data.name,
            type: "script",
            img: data.img,
            command: command,
            flags: {"dnd5e.itemMacro": true}
        }, {displaySheet: false});
    }
    game.user.assignHotbarMacro(macro, slot);

    return false;
});

Hooks.on(`createItem`, (item) => {
    if(item.actor) {
        const actor = item.actor;
        const miActor = MagicItemActor.get(actor.id);
        if(miActor && miActor.listening && miActor.actor.id === actor.id) {
            miActor.buildItems();
        }
    }
});

Hooks.on(`updateItem`, (item) => {
    if (item.actor) {
        const actor = item.actor;
        const miActor = MagicItemActor.get(actor.id);
        if (miActor && miActor.listening && miActor.actor.id === actor.id) {
            setTimeout(miActor.buildItems.bind(miActor), 500);
        }
    }
});

Hooks.on(`deleteItem`, (item) => {
    if (item.actor) {
        const actor = item.actor;
        const miActor = MagicItemActor.get(actor.id);
        if (miActor && miActor.listening && miActor.actor.id === actor.id) {
            miActor.buildItems();
        }
    }
});

window.MagicItems = {

    actor: function(id) {
        return MagicItemActor.get(id);
    },

    roll: function(magicItemName, itemName) {

        const speaker = ChatMessage.getSpeaker();
        let actor;
        if ( speaker.token ) actor = game.actors.tokens[speaker.token];
        if ( !actor ) actor = game.actors.get(speaker.actor);

        const magicItemActor = actor ? MagicItemActor.get(actor.id) : null;
        if ( !magicItemActor ) return ui.notifications.warn(game.i18n.localize("MAGICITEMS.WarnNoActor"));

        magicItemActor.rollByName(magicItemName, itemName);
    },

    bindItemSheet: function(app, html, data) {
        MagicItemTab.bind(app, html, data);
    },

    bindCharacterSheet: function(app, html, data) {
        MagicItemSheet.bind(app, html, data);
    }
};