### :information_source: This section is very much `under development`

The api is reachable from the variable `game.modules.get('magicitems').api` or from the socket libary `socketLib` on the variable `game.modules.get('magicitems').socket` if present and active.

The migration APIs should be reachable under variable `game.modules.get('magicitems').migration`.

**NOTE:** For retrocompatibility the API is still reachable on the `MagicItems`/ `window.MagicItems` global variable.

**Note on the execution of the macro:** executes Macro command, giving speaker, actor, token, character, and event constants. This is recognized as the macro itself. Pass an event as the first argument. Is the same concept used from [Item Macro](https://github.com/Foundry-Workshop/Item-Macro/), but without the item, also the main reference is not the item, but the actor, we used the actor set as character by default or the first owned actor by the user, same concept of [Item Piles](https://github.com/fantasycalendar/FoundryVTT-ItemPiles). The macro is launched under as a asynchronus call so  `await` command are good.

So when you set up to run a macro with this module these arguments are already "setted":`
- **speaker**: The chat message speaker referenced to the actor.
- **actor**: The actor reference.
- **token**: The token (if present on the current scene), referenced to the actor.
- **character**: The character is the actor reference to the one setted to the specific player (cannot be the same of the actor reference).
- **event**: The javascript event passed from the module to the macro.
- **args**: Additional arguments passed from the module to the macro.

## API - /API/api.js

### actor(id) ⇒ <code>Actor</code>

Method for retrieve the cached actor info by id

**Returns**: <code>Actor</code> - Return actor

| Param | Type | Description | Note |
| --- | --- | --- | --- |
| id | <code>string</code> | The id to the actor cached to retrieve | |

**Basic Example**:

```js
await game.modules.get('magicitems').api.actor("Actor.zsuisiww");
```
---

### roll(magicItemName, innerChildMagicItemName)  ⇒ <code>void</code>

Roll a inner child magic item from a specific parent magic item

**Returns**: <code>void</code> - Return nothing

| Param | Type | Description | Note |
| --- | --- | --- | --- |
| magicItemName | <code>string</code> | The name of the parent magic item to use | |
| innerChildMagicItemName | <code>string</code> | The name of the inner child magic item to roll | |

**Basic Example**:

```js
await game.modules.get('magicitems').api.roll("Amulet of Fire","Burning Hands");
```

---
### magicItemAttack(item)  ⇒ <code>void</code>

Setup Magic item like you normally would by creating a spell called with all the damage details in the spell as detailed on the weapon.

Also checkes for Item Attunement and gives you a choice if you want to spend a charge or not.

**Returns**: <code>void</code> - Return nothing

| Param | Type | Description | Note |
| --- | --- | --- | --- |
| item | <code>Item/string/UUID</code> | The Item object/UUID | |

**Basic Example**:

```js
await game.modules.get('magicitems').api.magicItemAttack("HPtsPc3OhBZNO7fr");
```
---
### magicItemAttackFast(item)  ⇒ <code>void</code>

Setup Magic item like you normally would by creating a spell called with all the damage details in the spell as detailed on the weapon.

The same method like <code>magicItemAttack</code>, without checking for Attunement, just executing the action.

**Returns**: <code>void</code> - Return nothing

| Param | Type | Description | Note |
| --- | --- | --- | --- |
| item | <code>Item/string/UUID</code> | The Item object/UUID | |

**Basic Example**:

```js
await game.modules.get('magicitems').api.magicItemAttackFast("HPtsPc3OhBZNO7fr");
```

---
### magicItemMultipleSpellsTrinket(item)  ⇒ <code>void</code>

Setup Magic item like you normally would by creating a spell called with all the damage details in the spell as detailed on the weapon.

**Returns**: <code>void</code> - Return nothing

| Param | Type | Description | Note |
| --- | --- | --- | --- |
| item | <code>Item/string/UUID</code> | The Item object/UUID | |

**Basic Example**:

```js
await game.modules.get('magicitems').api.magicItemMultipleSpellsTrinket("HPtsPc3OhBZNO7fr");
```

---
### magicItemMultipleSpellsWeapon(item, runAsItemMacro)  ⇒ <code>void</code>

If there are multiple spells on said item, you can use this macro. Just enter the name of the item.

**Returns**: <code>void</code> - Return nothing

| Param | Type | Description | Note |
| --- | --- | --- | --- |
| item | <code>Item/string/UUID</code> | The Item object/UUID | |
| runAsItemMacro | boolean | Run as a item macro with the command `game.dnd5e.rollItemMacro(itemName)` | |

**Basic Example**:

```js
await game.modules.get('magicitems').api.magicItemMultipleSpellsWeapon("HPtsPc3OhBZNO7fr", true);
```

---
### execActorShortRest(actor, isNewDay)  ⇒ <code>void</code>

Method handling a short-rest action for magic items for an actor.

**Returns**: <code>void</code> - Return nothing

| Param | Type | Description | Note |
| --- | --- | --- | --- |
| actor | <code>Actor/string/UUID</code> | The actor data to use for retrieve the Actor object | |
| isNewDay | <code>Boolean</code> | Boolean value if the rest contains "New Day" param | |

**Basic Example**:

```js
await game.modules.get('magicitems').api.execActorShortRest("Actor.ZV4Lqx6nZhcxGlN0", false);
```
---
### execActorLongRest(actor, isNewDay)  ⇒ <code>void</code>

Method handling a short-rest action for magic items for an actor.

**Returns**: <code>void</code> - Return nothing

| Param | Type | Description | Note |
| --- | --- | --- | --- |
| actor | <code>Actor/string/UUID</code> | The actor data to use for retrieve the Actor object | |
| isNewDay | <code>Boolean</code> | Boolean value if the rest contains "New Day" param | |

**Basic Example**:

```js
await game.modules.get('magicitems').api.execActorLongRest("Actor.ZV4Lqx6nZhcxGlN0", false);
```
---

## MIGRATION - /api/migration.js

###  TODO