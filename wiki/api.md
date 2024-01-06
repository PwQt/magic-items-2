The api is reachable from the variable `game.modules.get('magic-items').api` or from the socket libary `socketLib` on the variable `game.modules.get('magic-items').socket` if present and active.

### The documentation can be out of sync with the API code checkout the code if you want to dig up [API](../src/scripts/API/api.js)

**NOTE:** For retrocompatibility the API is still reachable on the `MagicItems`/ `window.MagicItems` global variable.

You can find some javascript examples here **=> [macros](./macros/) <=**

**Note on the execution of the macro:** executes Macro command, giving speaker, actor, token, character, and event constants. This is recognized as the macro itself. Pass an event as the first argument. Is the same concept used from [Item Macro](https://github.com/Foundry-Workshop/Item-Macro/), but without the item, also the main reference is not the item, but the actor, we used the actor set as character by default or the first owned actor by the user, same concept of [Item Piles](https://github.com/fantasycalendar/FoundryVTT-ItemPiles). The macro is launched under as a asynchronus call so  `await ` command are good.

So when you set up to run a macro with this module these arguments are already "setted":`
- **speaker**: The chat message speaker referenced to the actor.
- **actor**: The actor reference.
- **token**: The token (if present on the current scene), referenced to the actor.
- **character**: The character is the actor reference to the one setted to the specific player (cannot be the same of the actor reference).
- **event**: The javascript event passed from the module to the macro.
- **args**: Additional arguments passed from the module to the macro.

## OLD API (Remain for retro compatibility, but is not very clear ?)

#### actor(id) ⇒ <code>Actor</code>

Method for retrieve the cached actor info by id

**Returns**: <code>Actor</code> - Return actor

| Param | Type | Description | Note |
| --- | --- | --- | --- |
| id | <code>string</code> | The id to the actor cached to retrieve | |

**Example basic**:

```javascript

game.modules.get('magic-items').api.actor("Actor.zsuisiww")

```

#### roll(magicItemName, innerChildMagicItemName)  ⇒ <code>void</code>

Roll a inner child magic item from a specific parent magic item

**Returns**: <code>void</code> - Return nothing

| Param | Type | Description | Note |
| --- | --- | --- | --- |
| magicItemName | <code>string</code> | The name of the parent magic item to use | |
| innerChildMagicItemName | <code>string</code> | The name of the inner child magic item to roll | |

**Example basic**:

```javascript

game.modules.get('magic-items').api.roll("Amulet of Fire","Burning Hands");

```

## OLD Sheet Integration (Remain for retro compatibility, but is not very clear ?)

The following are added to `window.MagicItems` to facilitate custom sheet integration:
- `bindCharacterSheet`
- `bindItemSheet`

To implement Magic Items within a character sheet, do this:
```js
Hooks.on(`renderMyCoolCharacterSheet`, (app, html, data) => {
  const magicItemsApi = game.modules.get('magic-items')?.api;
  if (magicItemsApi && magicItemsApi.bindCharacterSheet) {
    magicItemsApi.bindCharacterSheet(app, html, data);
  }
});
```

To implement Magic Items within an item sheet, do this:

```js
Hooks.on(`renderMyCoolItemSheet`, (app, html, data) => {
  const magicItemsApi = game.modules.get('magic-items')?.api;
  if (magicItemsApi && magicItemsApi.bindItemSheet) {
    magicItemsApi.bindItemSheet(app, html, data);
  }
});
```