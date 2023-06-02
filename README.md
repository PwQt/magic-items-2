# Still in progress of fixing/transporting - please don't download yet

# FoundryVTT - Magic Items 2

This module for Foundry VTT and specific for the **DnD5e system**, adds the ability to create magical items with spells or feats that belong to the item itself, such as staffs or 
magic wands, which will be automatically inherited from the character who owns the item.

## Installation

To install, follow these instructions:

1.  Inside Foundry, select the Game Modules tab in the Configuration and Setup menu.
2.  Click the Install Module button and enter the following URL: https://github.com/PwQt/magic-items-2/blob/master/module.json
3.  Click Install and wait for installation to complete.

## Usage Instructions

Once activated, a new tab named 'Magic Item' will be available for each items of type 'weapon', 'equipment' or 'consumable'.  
In this tab, you can drag spells from a compendium and configure its consumption which will be subtracted from the total number of charges each time the spell is used.  
It is also possible to configure the max number of charges, if they can be can be recharged and when, and if the item will be destroyed when the charges reach 0.

<div align="center">

![example0](/example0.png?raw=true)
</div>

Using combinations of these parameters is possible to create, for example:

* A legendary staff equipped with great thaumaturgical spells

<div align="center">

![example1](/example1.png?raw=true)
</div>

* A globe with a perennial light spell.

<div align="center">

![example2](/example2.png?raw=true)
</div>

* A scroll with a powerful necromantic spell that dissolves once pronounced.

<div align="center">

![example3](/example3.png?raw=true)
</div>

In addition to spells, it is also possible to assign feats to the items, or combinations of both:

<div align="center">

![example5](/example5.png?raw=true)
</div>

When a character is equipped with one or more magical objects, within his sheet in the spellbook/features section, 
a set of inherited spells/feats divided by item will be displayed after his owned items:

<div align="center">

![example4](/example4.png?raw=true)
</div>

<div align="center">

![example6](/example6.png?raw=true)
</div>

From here you can cast spells or use feats provided by the items and monitor the consumption/recharges.

## Compatibility

Tested on 0.4.7 version.

### Sheet Integration

The following are added to `window.MagicItems` to facilitate custom sheet integration:
- `bindCharacterSheet`
- `bindItemSheet`

To implement Magic Items within a character sheet, do this:
```js
Hooks.on(`renderMyCoolCharacterSheet`, (app, html, data) => {
  if (window.MagicItems && window.MagicItems.bindCharacterSheet) {
    window.MagicItems.bindCharacterSheet(app, html, data);
  }
});
```

To implement Magic Items within an item sheet, do this:
```js
Hooks.on(`renderMyCoolItemSheet`, (app, html, data) => {
  if (window.MagicItems && window.MagicItems.bindItemSheet) {
    window.MagicItems.bindItemSheet(app, html, data);
  }
});
```

## Feedback

Every suggestions/feedback are appreciated.

## Original Project

This is a fork of Magic Items module created by Simone found at [this address](https://gitlab.com/riccisi/foundryvtt-magic-items/).
Original Magic Items is a module for Foundry VTT by Simone and is licensed under a [Creative Commons Attribution 4.0 International License](http://creativecommons.org/licenses/by/4.0/).

## License

Magic Items 2 is a module for Foundry VTT by PwQt and is licensed under [MIT License](https://github.com/PwQt/magic-items-2/blob/master/LICENSE).

This work is licensed under Foundry Virtual Tabletop [EULA](https://foundryvtt.com/article/license/).
