import {OwnedMagicItem} from "./magicitem.js";
import {MAGICITEMS} from "./config.js";

/**
 * "Aspect" class that dynamically extends the original Actor in order to handle magic items.
 */
export class MagicItemActor {

    /**
     * Create and register a new MagicItemActor.
     *
     * @param actor
     */
    static bind(actor) {
        MAGICITEMS.actors[actor.id] = new MagicItemActor(actor);
    }

    /**
     * Get a registered MagicItemActor.
     *
     * @param actorId   id of the original actor.
     * @returns {*}     the MagicItemActor associated with the actor by actorId.
     */
    static get(actorId) {
        return MAGICITEMS.actors[actorId];
    }

    /**
     * ctor. Builds a new instance of a MagicItemActor
     *
     * @param actor
     */
    constructor(actor) {
        this.actor = actor;
        this.id = actor.id;
        this.listeners = [];
        this.destroyed = [];
        this.listening = true;
        this.instrument();
        this.buildItems();
    }

    /**
     * Add change listeners.
     *
     * @param listener
     */
    onChange(listener) {
        this.listeners.push(listener);
    }

    /**
     * Notify listeners of changes.
     */
    fireChange() {
        this.listeners.forEach(listener => listener());
    }


    /**
     * Apply the aspects on the necessary actor pointcuts.
     */
    instrument() {
        this.actor.getOwnedItem = this.getOwnedItem(this.actor.getOwnedItem, this);
        this.actor.shortRest = this.shortRest(this.actor.shortRest, this);
        this.actor.longRest = this.longRest(this.actor.longRest, this);
    }

    /**
     *
     * @param original
     * @param me
     * @returns {function(*=): *}
     */
    getOwnedItem(original, me) {
        return function (id) {
            let found = null;
            me.items.concat(me.destroyed).forEach(item => {
                if(item.hasSpell(id) || item.hasFeat(id)) {
                    found = item.ownedItemBy(id);
                }
            });
            return found ? found : original.apply(me.actor, arguments);
        }
    }

    /**
     *
     * @param original
     * @param me
     * @returns {function(): *}
     */
    shortRest(original, me) {
        return async function() {
            let result = await original.apply(me.actor, arguments);
            me.onShortRest(result);
            return result;
        }
    }

    /**
     *
     * @param original
     * @param me
     * @returns {function(): *}
     */
    longRest(original, me) {
        return async function() {
            let result = await original.apply(me.actor, arguments);
            me.onLongRest(result);
            return result;
        }
    }

    /**
     * Temporarily suspends the interception of events, used for example to avoid intercepting a change
     * made by the client itself.
     */
    suspendListening() {
        this.listening = false;
    }

    /**
     * Resume a temporarily suspended interception of events.
     */
    resumeListening() {
        this.listening  = true;
    }

    /**
     * Build the list of magic items based on custom flag data of the item entity.
     */
    buildItems() {
        this.items = this.actor.items
            .filter(item => typeof item.flags.magicitems !== 'undefined' && item.flags.magicitems.enabled)
            .map(item => new OwnedMagicItem(item, this.actor, this));
        this.fireChange();
    }

    /**
     * Aspect: called after short rest.
     * Notify the item and update item uses on the actor flags if recharged.
     *
     * @param result
     */
    onShortRest(result) {
        if(result) {
            this.items.forEach(item => {
                item.onShortRest();
                if (result.newDay)
                    item.onNewDay();
            });
            this.fireChange();
        }
    }

    /**
     * Aspect: called after long rest.
     * Notify the item and update item uses on the actor flags if recharged.
     *
     * @param result
     */
    onLongRest(result) {
        if(result) {
            this.items.forEach(item => {
                item.onLongRest();
                if (result.newDay)
                    item.onNewDay();
            });
            this.fireChange();
        }
    }

    /**
     *
     * @returns {*}
     */
    get visibleItems() {
        return this.items.filter(item => item.visible);
    }

    /**
     *
     * @returns {boolean}
     */
    hasMagicItems() {
        return this.hasVisibleItems;
    }

    /**
     *
     */
    get hasVisibleItems() {
        return this.items.reduce((visible, item) => visible || item.visible, false);
    }

    /**
     * Returns the number of visible magic items owned by the actor.
     */
    get magicItemsCount() {
        return this.visibleItems.length;
    }

    /**
     * returns the number of visible actives magic items owned by the actor.
     */
    get magicItemsActiveCount() {
        return this.visibleItems.reduce((actives, item) => actives + item.active, 0);
    }

    /**
     *
     * @returns {boolean}
     */
    hasItemsSpells() {
        return this.visibleItems.reduce((hasSpells, item) => hasSpells || item.hasSpells, false);
    }

    /**
     *
     * @returns {boolean}
     */
    hasItemsFeats() {
        return this.visibleItems.reduce((hasFeats, item) => hasFeats || item.hasFeats, false);
    }

    /**
     *
     * @param itemId
     * @returns {number}
     */
    magicItem(itemId) {
        let found = this.items.filter(item => item.id === itemId);
        if(found.length) {
            return found[0];
        }
    }

    /**
     *
     * @param magicItemName
     * @param itemName
     */
    rollByName(magicItemName, itemName) {
        let found = this.items.filter(item => item.name === magicItemName);
        if(!found.length) {
            return ui.notifications.warn(game.i18n.localize("MAGICITEMS.WarnNoMagicItem") + itemName);
        }
        let item = found[0];
        item.rollByName(itemName);
    }

    /**
     *
     * @param magicItemId
     * @param itemId
     */
    async roll(magicItemId, itemId) {
        let found = this.items.filter(item => item.id === magicItemId);
        if(found.length) {
            let item = found[0];
            await item.roll(itemId);
        }
    }

    /**
     *
     * @param itemId
     * @param ownedItemId
     */
    renderSheet(itemId, ownedItemId) {
        let found = this.items.filter(item => item.id === itemId);
        if(found.length) {
            let item = found[0];
            item.renderSheet(ownedItemId);
        }
    }

    /**
     * Delete the magic item from the owned items of the actor,
     * keeping a temporary reference in case of open chat sheets.
     *
     * @param item
     */
    destroyItem(item) {
        let idx = 0;
        this.items.forEach((owned, i) => {
            if(owned.id === item.id) {
                idx = i;
            }
        });
        this.items.splice(idx, 1);
        this.destroyed.push(item);
        this.actor.deleteEmbeddedDocuments("Item", [item.id]);
    }
}