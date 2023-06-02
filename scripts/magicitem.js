import {MAGICITEMS} from "./config.js";
import {MagicItemUpcastDialog} from "./magicitemupcastdialog.js";

export class MagicItem {

    constructor(flags) {
        const data = mergeObject(this.defaultData(), flags || {}, { inplace: false });

        this.enabled = data.enabled;
        this.equipped = data.equipped;
        this.attuned = data.attuned;
        this.charges = parseInt(data.charges);
        this.chargeType = data.chargeType;
        this.rechargeable = data.rechargeable;
        this.recharge = data.recharge;
        this.rechargeType = data.rechargeType;
        this.rechargeUnit = data.rechargeUnit;
        this.destroy = data.destroy;
        this.destroyCheck = data.destroyCheck;
        this.destroyType = data.destroyType;
        this.destroyFlavorText = data.destroyFlavorText;
        this.sorting =  data.sorting;
        this.sortingModes = {"l": "MAGICITEMS.SheetSortByLevel", "a": "MAGICITEMS.SheetSortAlphabetically"};
        this.updateDestroyTarget();

        this.spells = Object.values(data.spells ? data.spells : {})
            .filter(spell => spell !== 'null')
            .map(spell => new MagicItemSpell(spell));

        this.feats = Object.values(data.feats ? data.feats : {})
            .filter(feat => feat !== 'null')
            .map(feat => new MagicItemFeat(feat));

        this.tables = Object.values(data.tables ? data.tables : {})
            .filter(table => table !== 'null')
            .map(table => new MagicItemTable(table));

        this.spellsGarbage = [];
        this.featsGarbage = [];
        this.tablesGarbage = [];

        this.savedSpells = this.spells.length;
        this.savedFeats = this.feats.length;
        this.savedTables = this.tables.length;
    }

    static sortByName(a, b) {
        if(a.displayName < b.displayName) { return -1; }
        if(a.displayName > b.displayName) { return 1; }
        return 0;
    }

    static sortByLevel(a, b) {
        return a.level === b.level ? MagicItem.sortByName(a, b) : a.level - b.level;
    }

    sort() {
        if(this.sorting === "a") {
            this.spells = this.spells.sort(MagicItem.sortByName);
        }
        if(this.sorting === "l") {
            this.spells = this.spells.sort(MagicItem.sortByLevel);
        }
    }

    updateDestroyTarget() {
        this.destroyTarget = this.chargeType === "c1" ?
                game.i18n.localize("MAGICITEMS.SheetObjectTarget") :
                game.i18n.localize("MAGICITEMS.SheetSpellTarget");
    }

    defaultData() {
        return {
            enabled: false,
            equipped: false,
            attuned: false,
            charges: 0,
            chargeType: 'c1',
            rechargeable: false,
            recharge: 0,
            rechargeType: 't1',
            rechargeUnit: '',
            destroy: false,
            destroyCheck: 'd1',
            destroyType: 'dt1',
            destroyFlavorText: game.i18n.localize("MAGICITEMS.MagicItemDestroy"),
            sorting: 'l',
            spells: {},
            feats: {},
            tables: {}
        }
    }

    serializeData() {
        return {
            enabled: this.enabled,
            charges: this.charges,
            chargeType: this.chargeType,
            rechargeable: this.rechargeable,
            recharge: this.recharge,
            rechargeType: this.rechargeType,
            rechargeUnit: this.rechargeUnit,
            destroy: this.destroy,
            destroyCheck: this.destroyCheck,
            destroyType: this.destroyType,
            destroyFlavorText: this.destroyFlavorText,
            sorting: this.sorting,
            spells: this.serializeEntries(this.spells, this.spellsGarbage),
            feats: this.serializeEntries(this.feats, this.featsGarbage),
            tables: this.serializeEntries(this.tables, this.tablesGarbage),
            uses: this.uses
        }
    }

    serializeEntries(entries, trash) {
        let data = {};
        entries.forEach((spell, idx) => data[""+idx] = spell.serializeData());
        trash.forEach(index => data["-="+index] = null);
        return data;
    }

    get chargeTypes() {
        return MAGICITEMS.localized(MAGICITEMS.chargeTypes);
    }

    get destroyChecks() {
        return MAGICITEMS.localized(MAGICITEMS.destroyChecks);
    }

    get destroyTypes() {
        return MAGICITEMS.localized(MAGICITEMS.destroyTypes);
    }

    get rechargeUnits() {
        return MAGICITEMS.localized(MAGICITEMS.rechargeUnits);
    }

    get rechargeTypes() {
        return MAGICITEMS.localized(MAGICITEMS.rechargeTypes);
    }

    get rechargeText() {
        return this.rechargeType === 't3' ?
                game.i18n.localize("MAGICITEMS.RechargeTypeFull") :
                this.recharge
    }

    get empty() {
        return this.spells.length === 0 && this.feats.length === 0 && this.tables.length === 0;
    }

    get chargesOnWholeItem() {
        return this.chargeType === MAGICITEMS.CHARGE_TYPE_WHOLE_ITEM;
    }

    get chargesPerSpell() {
        return this.chargeType === MAGICITEMS.CHARGE_TYPE_PER_SPELL;
    }

    toggleEnabled(enabled) {
        this.enabled = enabled;
        if(!enabled) {
            this.clear();
        }
    }

    toggleRechargeable(rechargeable) {
        this.rechargeable = rechargeable;
        if(!rechargeable) {
            this.recharge = 0;
            this.rechargeType = 't1';
            this.rechargeUnit = '';
        }
    }

    clear() {
        mergeObject(this, this.defaultData());
        this.spells = [];
        this.feats = [];
        this.tables = [];
        this.cleanup();
    }

    support(type) {
        return ['Item', 'RollTable'].includes(type);
    }

    get items() {
        return this.spells.concat(this.feats).concat(this.tables);
    }

    addSpell(data) {
        this.spells.push(new MagicItemSpell(data));
        this.cleanup();
    }

    removeSpell(idx) {
        this.spells.splice(idx, 1);
        this.cleanup();
    }

    get hasSpells() {
        return this.spells.length > 0 || this.hasTableAsSpells;
    }

    hasSpell(spellId) {
        return this.spells.filter(spell => spell.id === spellId).length === 1;
    }

    addFeat(data) {
        this.feats.push(new MagicItemFeat(data));
        this.cleanup();
    }

    removeFeat(idx) {
        this.feats.splice(idx, 1);
        this.cleanup();
    }

    get hasFeats() {
        return this.feats.length > 0 || this.hasTableAsFeats;
    }

    hasFeat(featId) {
        return this.feats.filter(feat => feat.id === featId).length === 1;
    }

    addTable(data) {
        this.tables.push(new MagicItemTable(data));
        this.cleanup();
    }

    removeTable(idx) {
        this.tables.splice(idx, 1);
        this.cleanup();
    }

    get hasTableAsSpells() {
        return this.tableAsSpells.length === 1;
    }

    get hasTableAsFeats() {
        return this.tableAsFeats.length === 1;
    }

    hasTable(tableId) {
        return this.tables.filter(table => table.id === tableId).length === 1;
    }

    tablesByUsage(usage) {
        return this.tables.filter(table => table.usage === usage);
    }

    get tableAsSpells() {
        return this.tablesByUsage(MAGICITEMS.TABLE_USAGE_AS_SPELL);
    }

    get tableAsFeats() {
        return this.tablesByUsage(MAGICITEMS.TABLE_USAGE_AS_FEAT);
    }

    get triggeredTables() {
        return this.tablesByUsage(MAGICITEMS.TABLE_USAGE_TRIGGER);
    }

    compatible(entity) {
        return (['spell', 'feat'].includes(entity.type) || entity.documentName === 'RollTable')
            && !this.hasItem(entity.id);
    }

    addEntity(entity, pack) {
        let name = game.babele && entity.getFlag('babele','hasTranslation') ?
                entity.getFlag('babele','originalName') :
                entity.name;
        if(entity.type === "spell") {
            this.addSpell({
                id: entity.id,
                name: name,
                img: entity.img,
                pack: pack,
                baseLevel: entity.system.level,
                level: entity.system.level,
                consumption: entity.system.level,
                upcast: entity.system.level,
                upcastCost: 1
            });
            return true;
        }
        if(entity.type === "feat") {
            this.addFeat({
                id: entity.id,
                name: name,
                img: entity.img,
                pack: pack,
                effect: 'e1',
                consumption: 1
            });
            return true;
        }
        if(entity.documentName === "RollTable") {
            this.addTable({
                id: entity.id,
                name: name,
                img: entity.img,
                pack: pack,
                consumption: 1
            });
            return true;
        }
        return false;
    }

    hasItem(itemId) {
        return this.hasSpell(itemId) || this.hasFeat(itemId) || this.hasTable(itemId);
    }

    findById(itemId) {
        return this.items.filter(item => item.id === itemId)[0];
    }

    renderSheet(spellId) {
        this.findById(spellId).renderSheet();
    }

    cleanup() {
        this.spellsGarbage = [];
        this.featsGarbage = [];
        this.tablesGarbage = [];
        if(this.savedSpells > this.spells.length) {
            for(let i = this.spells.length; i < this.savedSpells; i++) {
                this.spellsGarbage.push(i);
            }
        }
        if(this.savedFeats > this.feats.length) {
            for(let i = this.feats.length; i < this.savedFeats; i++) {
                this.featsGarbage.push(i);
            }
        }
        if(this.savedTables > this.tables.length) {
            for(let i = this.tables.length; i < this.savedTables; i++) {
                this.tablesGarbage.push(i);
            }
        }
    }

}

class MagicItemEntry {

    constructor(data) {
        mergeObject(this, data);
    }

    get displayName() {
        if(this.pack !== 'world' && game.babele?.isTranslated(this.pack)) {
            return game.babele.translateField("name", this.pack, { name: this.name });
        } else {
            return this.name;
        }
    }

    renderSheet() {
        this.entity().then(entity => {
            const sheet = entity.sheet;
            if(this.pack === 'world') {
                sheet.options.compendium = this.pack;
            } else {
                sheet.options.editable = false;
            }
            sheet.render(true);
        });
    }

    entity() {
        return new Promise((resolve, reject) => {
            if(this.pack === 'world') {
                let entity = this.entityCls().collection.instance.get(this.id);
                if(entity) {
                    resolve(entity);
                } else {
                    ui.notifications.warn(game.i18n.localize("MAGICITEMS.WarnNoMagicItemSpell") + itemName);
                    reject();
                }
            } else {
                const pack = game.packs.find(p => p.collection === this.pack);
                pack.getDocument(this.id).then(entity => {
                    resolve(entity);
                });
            }
        });
    }

    entityCls() {
        return CONFIG['Item'];
    }

    data() {
        return new Promise((resolve) => {
            this.entity().then(entity => {
                resolve(entity.toJSON());
            })
        });
    }
}

class MagicItemFeat extends MagicItemEntry {

    constructor(data) {
        super(data);
        this.effect = this.effect ? this.effect : 'e1';
    }

    consumptionLabel() {
        return this.effect === 'e1' ?
                `${game.i18n.localize("MAGICITEMS.SheetConsumptionConsume")}: ${this.consumption}`:
                game.i18n.localize(`MAGICITEMS.SheetConsumptionDestroy`);
    }

    serializeData() {
        return {
            consumption: this.consumption,
            id: this.id,
            img: this.img,
            name: this.name,
            pack: this.pack,
            uses: this.uses,
            effect: this.effect
        };
    }

    get effects() {
        return MAGICITEMS.localized(MAGICITEMS.effects);
    }
}

class MagicItemTable extends MagicItemEntry {

    entityCls() {
        return CONFIG['RollTable'];
    }

    get usages() {
        return MAGICITEMS.localized(MAGICITEMS.tableUsages);
    }

    async roll(actor) {
        let entity = await this.entity();
        let result = await entity.draw();
        if(result && result.results && result.results.length === 1 && result.results[0].collection) {
            const collectionId = result.results[0].documentCollection;
            const id = result.results[0].documentId;
            const pack = game.collections.get(collectionId) || game.packs.get(collectionId);

            const entity = pack.getDocument ? await pack.getDocument(id) : pack.get(id);
            if(entity) {
                let item = (await actor.createEmbeddedDocuments("Item", [entity]))[0];
                const chatData = await item.roll({createMessage: false});
                ChatMessage.create(
                    mergeObject(chatData, {
                        "flags.dnd5e.itemData": item
                    })
                );
            }
        }
    }

    serializeData() {
        return {

        };
    }
}

class MagicItemSpell extends MagicItemEntry {

    constructor(data) {
        super(data);
        this.baseLevel = parseInt(this.baseLevel);
        this.level = parseInt(this.level);
        this.consumption = parseInt(this.consumption);
        this.upcast = this.upcast ? parseInt(this.upcast) : this.level;
        this.upcastCost = this.upcastCost ? parseInt(this.upcastCost) : 1;
        this.dc = this.flatDc && this.dc ? this.dc : "";
    }

    get levels() {
        let levels = {};
        for(let i = this.baseLevel; i <= 9; i++) {
            levels[i] = game.i18n.localize(`MAGICITEMS.SheetSpellLevel${i}`);
            if(i === 0) {
                break;
            }
        }
        return levels;
    }

    get upcasts() {
        let upcasts = {};
        for(let i = this.level; i <= 9; i++) {
            upcasts[i] = game.i18n.localize(`MAGICITEMS.SheetSpellUpcast${i}`);
            if(i === 0) {
                break;
            }
        }
        return upcasts;
    }

    get allowedLevels() {
        let levels = {};
        for(let i = this.level; i <= Math.min(this.upcast, 9); i++) {
            levels[i] = game.i18n.localize(`MAGICITEMS.SheetSpellLevel${i}`);
            if(i === 0) {
                break;
            }
        }
        return levels;
    }

    canUpcast() {
        return this.level < this.upcast;
    }

    canUpcastLabel() {
        return this.canUpcast() ?
            game.i18n.localize(`MAGICITEMS.SheetCanUpcastYes`) :
            game.i18n.localize(`MAGICITEMS.SheetCanUpcastNo`)
    }

    consumptionAt(level) {
        return this.consumption + this.upcastCost * (level - this.level);
    }

    serializeData() {
        return {
            baseLevel: this.baseLevel,
            consumption: this.consumption,
            id: this.id,
            img: this.img,
            level: this.level,
            name: this.name,
            pack: this.pack,
            upcast: this.upcast,
            upcastCost: this.upcastCost,
            flatDc: this.flatDc,
            dc: this.dc,
            uses: this.uses
        };
    }
}

export class OwnedMagicItem extends MagicItem {

    constructor(item, actor, magicItemActor) {
        super(item.flags.magicitems);
        this.id = item.id;
        this.item = item;
        this.actor = actor;
        this.name = item.name;
        this.img = item.img;

        this.uses = parseInt(('uses' in item.flags.magicitems) ? item.flags.magicitems.uses : this.charges);

        this.rechargeableLabel = this.rechargeable ?
            `(${game.i18n.localize("MAGICITEMS.SheetRecharge")}: ${this.rechargeText} ${MAGICITEMS.localized(MAGICITEMS.rechargeUnits)[this.rechargeUnit]} )` :
            game.i18n.localize("MAGICITEMS.SheetNoRecharge");

        this.magicItemActor = magicItemActor;

        this.ownedEntries = this.spells.map(item => new OwnedMagicItemSpell(this, item));
        this.ownedEntries = this.ownedEntries.concat(this.feats.map(item => new OwnedMagicItemFeat(this, item)));
        this.ownedEntries = this.ownedEntries.concat(this.tables.map(table => new OwnedMagicItemTable(this, table)));

        this.instrument();
    }

    /**
     *
     */
    instrument() {
        this.item.roll = this.itemRoll(this.item.roll, this);
    }

    /**
     * Tests if the owned magic items can visualize his powers.
     */
    get visible() {
        let identifiedOnly = game.settings.get("magicitems", "identifiedOnly");
        return !identifiedOnly || this.item.system.identified;
    }

    /**
     * Tests if the owned magic items is active.
     */
    get active() {
        let active = true;
        if(this.equipped) {
            active = active && this.item.system.equipped;
        }
        if(this.attuned) {
            let isAttuned = this.item.system.attunement  ?
                this.item.system.attunement === 2 : this.item.system.attuned;
            active = active && isAttuned;
        }
        return active;
    }

    itemRoll(original, me) {
        return async function () {
            me.triggerTables();
            return await original.apply(me.item, arguments);
        }
    }

    isFull() {
        return this.uses === this.charges;
    }

    setUses(uses) {
        this.uses = uses;
    }

    async roll(itemId) {
        let ownedItem = this.ownedEntries.filter(entry => entry.id === itemId)[0];
        await ownedItem.roll();
    }

    rollByName(itemName) {
        let found = this.ownedEntries.filter(entry => entry.name === itemName);
        if(!found.length) {
            return ui.notifications.warn(game.i18n.localize("MAGICITEMS.WarnNoMagicItemSpell") + itemName);
        }
        found[0].roll();
    }

    destroyItem() {
        this.magicItemActor.destroyItem(this);
    }

    consume(consumption) {
        this.uses = Math.max(this.uses - consumption, 0);
        if(this.destroyed()) {
            if(this.destroyType === "dt1") {
                this.destroyItem();
            } else {
                this.toggleEnabled(false);
            }
        }
    }

    destroyed() {
        let destroyed = this.uses === 0 && this.destroy;
        if(destroyed && this.destroyCheck === 'd2') {
            let r = new Roll('1d20');
            r.evaluate({ async: false});
            destroyed = r.total === 1;
            r.toMessage({
                flavor: `<b>${this.name}</b> ${game.i18n.localize("MAGICITEMS.MagicItemDestroyCheck")} 
                        - ${destroyed ? game.i18n.localize("MAGICITEMS.MagicItemDestroyCheckFailure") : game.i18n.localize("MAGICITEMS.MagicItemDestroyCheckSuccess")}`,
                speaker: ChatMessage.getSpeaker({actor: this.actor, token: this.actor.token})
            });
        }
        if(destroyed) {
            ChatMessage.create({
                user: game.user._id,
                speaker: ChatMessage.getSpeaker({actor: this.actor}),
                content: this.formatMessage(`<b>${this.name}</b> ${this.destroyFlavorText}`)
            });
        }
        return destroyed;
    }

    onShortRest() {
        if(this.rechargeable && this.rechargeUnit === MAGICITEMS.SHORT_REST) {
            return this.doRecharge();
        }
    }

    onLongRest() {
        if(this.rechargeable && [MAGICITEMS.LONG_REST, MAGICITEMS.SHORT_REST].includes(this.rechargeUnit)) {
            return this.doRecharge();
        }
    }

    onNewDay() {
        if (this.rechargeable && [MAGICITEMS.DAILY, MAGICITEMS.DAWN, MAGICITEMS.SUNSET].includes(this.rechargeUnit)) {
            return this.doRecharge();
        }
    }

    doRecharge() {

        let amount = 0, updated = 0,
            msg = `<b>Magic Item:</b> ${this.rechargeableLabel}<br>`;

        let prefix = game.i18n.localize("MAGICITEMS.SheetRechargedBy");
        let postfix = game.i18n.localize("MAGICITEMS.SheetChargesLabel");
        if(this.rechargeType === MAGICITEMS.NUMERIC_RECHARGE) {
            amount = parseInt(this.recharge);
            msg += `<b>${prefix}</b>: ${this.recharge} ${postfix}`;
        }
        if(this.rechargeType === MAGICITEMS.FORMULA_RECHARGE) {
            let r = new Roll(this.recharge);
            r.evaluate({ async: false});
            amount = r.total;
            msg += `<b>${prefix}</b>: ${r.result} = ${r.total} ${postfix}`;
        }
        if(this.rechargeType === MAGICITEMS.FORMULA_FULL) {
            msg += `<b>${game.i18n.localize("MAGICITEMS.RechargeTypeFullText")}</b>`;
        }

        if(this.chargesOnWholeItem) {
            if(this.isFull()) {
                return;
            }

            if(this.rechargeType === MAGICITEMS.FORMULA_FULL) {
                updated = this.charges;
            } else {
                updated = Math.min(this.uses + amount, parseInt(this.charges));
            }

            this.setUses(updated);
        } else {
            if(this.ownedEntries.filter(entry => !entry.isFull()).length === 0) {
                return;
            }

            this.ownedEntries.forEach(entry => {
                if(this.rechargeType === MAGICITEMS.FORMULA_FULL) {
                    entry.uses = this.charges;
                } else {
                    entry.uses = Math.min(entry.uses + amount, parseInt(this.charges));
                }
            });
        }

        this.update();

        ChatMessage.create({
            speaker: { actor: this.actor },
            type: CONST.CHAT_MESSAGE_TYPES.OTHER,
            content: this.formatMessage(msg)
        });
    }

    entryBy(itemId) {
        return this.ownedEntries.filter(entry => entry.id === itemId)[0];
    }

    ownedItemBy(itemId) {
        return this.entryBy(itemId).ownedItem;
    }

    triggerTables() {
        this.triggeredTables.forEach(table => table.roll());
    }

    destroyItemEntry(entry) {
        if(this.hasSpell(entry.id)) {
            this.removeSpell(this.spells.findIndex(spell => spell.id === entry.id));
        }
    }

    update() {
        this.magicItemActor.suspendListening();
        this.item.update({
            flags: {
                magicitems: this.serializeData()
            }
        }).then(() => {
            this.magicItemActor.resumeListening();
        });
    }

    formatMessage(msg) {
        return `
            <div class="dnd5e chat-card item-card">
                <header class="card-header flexrow">
                    <img src="${this.img}" title="Palla di Fuoco" width="36" height="36" />
                    <h3 class="item-name">${this.name}</h3>
                </header>
    
                <div class="card-content">${msg}</div>
            </div>`
    }

}

class AbstractOwnedEntry {

    constructor(magicItem, item) {
        this.magicItem = magicItem;
        this.item = item;
        this.uses = parseInt(('uses' in this.item) ? this.item.uses : this.magicItem.charges);
    }

    get id() {
        return this.item.id;
    }

    get name() {
        return this.item.name;
    }

    get img() {
        return this.item.img;
    }

    get uses() {
        return this.item.uses;
    }

    set uses(uses) {
        this.item.uses = uses;
    }

    isFull() {
        return this.uses === this.magicItem.charges;
    }

    hasCharges(consumption) {
        let uses = this.magicItem.chargesOnWholeItem ? this.magicItem.uses : this.uses;
        return uses - consumption >= 0;
    }

    consume(consumption) {
        if(this.magicItem.chargesOnWholeItem) {
            this.magicItem.consume(consumption);
        } else {
            this.uses = Math.max(this.uses - consumption, 0);
            if(this.destroyed()) {
                this.magicItem.destroyItemEntry(this.item);
            }
        }
    }

    destroyed() {
        let destroyed = this.uses === 0 && this.magicItem.destroy;
        if(destroyed && this.magicItem.destroyCheck === 'd2') {
            let r = new Roll('1d20');
            r.evaluate({ async: false});
            destroyed = r.total === 1;
            r.toMessage({
                flavor: `<b>${this.name}</b> ${game.i18n.localize("MAGICITEMS.MagicItemDestroyCheck")} 
            - ${destroyed ? game.i18n.localize("MAGICITEMS.MagicItemDestroyCheckFailure") : game.i18n.localize("MAGICITEMS.MagicItemDestroyCheckSuccess")}`,
                speaker: ChatMessage.getSpeaker({actor: this.actor, token: this.actor.token})
            });
        }
        if(destroyed) {
            ChatMessage.create({
               user: game.user._id,
               speaker: ChatMessage.getSpeaker({actor: this.actor}),
               content: this.magicItem.formatMessage(`<b>${this.name}</b> ${this.magicItem.destroyFlavorText}`)
            });
        }
        return destroyed;
    }

    showNoChargesMessage(callback) {
        const message = game.i18n.localize("MAGICITEMS.SheetNoChargesMessage");
        const title = game.i18n.localize("MAGICITEMS.SheetDialogTitle");
        let d = new Dialog({
            title: title,
            content: `<b>'${this.magicItem.name}'</b> - ${message} <b>'${this.item.name}'</b><br><br>`,
            buttons: {
                use: {
                    icon: '<i class="fas fa-check"></i>',
                    label: game.i18n.localize("MAGICITEMS.SheetDialogUseAnyway"),
                    callback: () => callback()
                },
                close: {
                    icon: '<i class="fas fa-times"></i>',
                    label: game.i18n.localize("MAGICITEMS.SheetDialogClose"),
                    callback: () => d.close()
                }
            },
            default: "close"
        });
        d.render(true);
    }

    computeSaveDC(item) {

        const data = this.magicItem.actor.system;
        data.attributes.spelldc = data.attributes.spellcasting ? data.abilities[data.attributes.spellcasting].dc : 10;

        const save = item.system.save;
        if ( save?.ability ) {
            if ( save.scaling === "spell" ) save.dc = data.attributes.spelldc;
            else if ( save.scaling !== "flat" ) save.dc = data.abilities[save.scaling]?.dc ?? 10;
            const ability = CONFIG.DND5E.abilities[save.ability];
            item.labels.save = game.i18n.format("DND5E.SaveDC", {dc: save.dc || "", ability});
        }
    }
}

class OwnedMagicItemSpell extends AbstractOwnedEntry {

	async roll() {
        let upcastLevel = this.item.level;
        let consumption = this.item.consumption;

        if (!this.ownedItem) {

            let data = await this.item.data();

            if (typeof data.system.save.scaling === 'undefined') {
                data = mergeObject(data, {
                    "system.save.scaling": "spell"
                });
            }

            if (this.item.flatDc) {
                data = mergeObject(data, {
                    "system.save.scaling": "flat",
                    "system.save.dc": this.item.dc
                });
            }

            data = mergeObject(data, {
                "system.preparation": {"mode": "magicitems"}
            });

            const cls = CONFIG.Item.documentClass;
            this.ownedItem = new cls(data, {parent: this.magicItem.actor});
            this.ownedItem.prepareFinalAttributes();
        }

        if(this.item.canUpcast()) {
            const spellFormData = await MagicItemUpcastDialog.create(this.magicItem, this.item);
            upcastLevel = parseInt(spellFormData.get("level"));
            consumption = parseInt(spellFormData.get("consumption"));
        }

        let proceed = async () => {

            let spell = this.ownedItem;
            if(upcastLevel !== spell.system.level) {
                spell = spell.clone({"system.level": upcastLevel}, {keepId: true});
                spell.prepareFinalAttributes();
            }

            let chatData = await spell.roll({
                "configureDialog": false,
                "createMessage": false
            });
            ChatMessage.create(
                mergeObject(chatData, {
                    "flags.dnd5e.itemData": this.ownedItem.toJSON()
                })
            );
            this.consume(consumption);
            this.magicItem.update();
        }

        if(this.hasCharges(consumption)) {
            await proceed();
        } else {
            this.showNoChargesMessage(() => {
                proceed();
            });
        }
    }
}

class OwnedMagicItemFeat extends AbstractOwnedEntry {

    async roll() {
        let consumption = this.item.consumption;

        if(!this.ownedItem) {
            let data = await this.item.data();

            data = mergeObject(data, {
                "system.uses": null
            });

            const cls = CONFIG.Item.documentClass;
            this.ownedItem = new cls(data, { parent: this.magicItem.actor });
            this.ownedItem.prepareFinalAttributes();
        }

        let onUsage = this.item.effect === 'e1' ?
        () => { this.consume(consumption) } :
        () => {
            ChatMessage.create({
                user: game.user._id,
                speaker: ChatMessage.getSpeaker({actor: this.magicItem.actor}),
                content: this.magicItem.formatMessage(
                    `<b>${this.name}</b>: ${game.i18n.localize("MAGICITEMS.SheetConsumptionDestroyMessage")}`
                )
            });

            this.magicItem.destroyItem();
        };

        let proceed = async () => {
            let chatData = await this.ownedItem.roll({
                "createMessage": false,
                "configureDialog": false
            });
            ChatMessage.create(
                mergeObject(chatData, {
                    "flags.dnd5e.itemData": this.ownedItem.toJSON()
                })
            );
            onUsage();
            this.magicItem.update();
        };

        if(this.item.effect === 'e2' || this.hasCharges(consumption)) {
            await proceed();
        } else {
            this.showNoChargesMessage(() => {
                proceed();
            });
        }
    }

}

class OwnedMagicItemTable extends AbstractOwnedEntry {

    async roll() {
        let item = this.item;
        let consumption = item.consumption;
        if(this.hasCharges(consumption)) {
            await item.roll(this.magicItem.actor);
            this.consume(consumption);
        } else {
            this.showNoChargesMessage(() => {
                item.roll(this.magicItem.actor);
            });
        }
    }
}