# FoundryVTT - Magic Items 2

This module for Foundry VTT and specific for the **DnD5e system**, adds the ability to create magical items with spells or feats that belong to the item itself, such as staffs or 
magic wands, which will be automatically inherited from the character who owns the item.

Fork of [Magic Items](https://gitlab.com/riccisi/foundryvtt-magic-items/), since it seems like the original author's inactive.

If you have an issue that requires quick contact, I've created a [Discord](https://discord.gg/V6J6XDv4da) community.

## Difference between [Magic Items 2](https://github.com/PwQt/magic-items-2) and [Item with Spells](https://github.com/krbz999/foundryvtt-items-with-spells-5e)

They work very differently under the hood.

- **Item with Spells**: adds the _actual_ items to the actor but hides them if they should be unavailable, with modifications, and can these make use of the parent item's Limited Uses. Magic Items does not do that.
  - The benefit is that you can thus change or tweak the embedded items, which you can't do with Magic Items

- **Magic Items 2**: adds the _reference_ to the items are just references to where the actual item is stored.
  - Has more options
  - You can add Feature and Rolltable items to the parent item


## Installation

It's always easiest to install modules from the in game add-on browser.

To install this module manually:
1.  Inside the Foundry "Configuration and Setup" screen, click "Add-on Modules"
2.  Click "Install Module"
3.  In the "Manifest URL" field, paste the following url:
`https://github.com/PwQt/magic-items-2/releases/latest/download/module.json`
4.  Click 'Install' and wait for installation to complete
5.  Don't forget to enable the module in game using the "Manage Module" button

## Usage Instructions

1) Once activated, a new tab named 'Magic Item' will be available for each items of type 'weapon', 'equipment' or 'consumable'.  
2) In this tab, you can drag spells from a compendium and configure its consumption which will be subtracted from the total number of charges each time the spell is used.  
3) It is also possible to configure the max number of charges, if they can be can be recharged and when, and if the item will be destroyed when the charges reach 0.

<div align="center">

![example0](/wiki/example0.png?raw=true)
</div>

Using combinations of these parameters is possible to create, for example:

* A legendary staff equipped with great thaumaturgical spells

<div align="center">

![example1](/wiki/example1.png?raw=true)
</div>

* A globe with a perennial light spell.

<div align="center">

![example2](/wiki/example2.png?raw=true)
</div>

* A scroll with a powerful necromantic spell that dissolves once pronounced.

<div align="center">

![example3](/wiki/example3.png?raw=true)
</div>

In addition to spells, it is also possible to assign feats to the items, or combinations of both:

<div align="center">

![example5](/wiki/example5.png?raw=true)
</div>

When a character is equipped with one or more magical objects, within his sheet in the spellbook/features section, 
a set of inherited spells/feats divided by item will be displayed after his owned items:

<div align="center">

![example4](/wiki/example4.png?raw=true)
</div>

<div align="center">

![example6](/wiki/example6.png?raw=true)
</div>

From here you can cast spells or use feats provided by the items and monitor the consumption/recharges.

## Api

All informations about the api and the sheet integration can be found here [API](./wiki/api.md)

## Compatibility
| **Name** | **Compatibility** | **Additional information** |
|----------|:-----------------:|----------------------------|
|Legacy DnD 5e sheet|:heavy_check_mark:||
|DND5e 3.0 Sheet|:x:|In progress of making compatible|
|[Tidy5e Sheet](https://github.com/sdenec/tidy5e-sheet)|:heavy_check_mark:|works on 0.8.41+|
|[Compact DnDBeyond-like 5e Character Sheet](https://github.com/eastcw/foundryvtt-compactBeyond5eSheet)|:interrobang:|Works, but doesn't show in Actions tab.|
|[Tidy 5e Sheet Rewrite](https://github.com/kgar/foundry-vtt-tidy-5e-sheets/)|✔️||

# Build

## Install all packages

```bash
npm install
```

### dev

`dev` will let you develop you own code with hot reloading on the browser

```bash
npm run dev
```

## npm build scripts

### build

`build` will build and set up a symlink between `dist` and your `dataPath`.

```bash
npm run build
```

### build-watch

`build-watch` will build and watch for changes, rebuilding automatically.

```bash
npm run build-watch
```

### prettier-format

`prettier-format` launch the prettier plugin based on the configuration [here](./.prettierrc)

```bash
npm run-script prettier-format
```

### lint and lint:fix

`lint` launch the eslint process based on the configuration [here](./.eslintrc.json)

```bash
npm run-script lint
```

`lint:fix` launch the eslint process with the fix argument

```bash
npm run-script lint:fix
```

## [Changelog](./CHANGELOG.md)

## Issues

Any issues, bugs, or feature requests are always welcome to be reported directly to the [Issue Tracker](https://github.com/PwQt/magic-items-2/issues).

## License

This package is under an [MIT license](LICENSE) and the [Foundry Virtual Tabletop Limited License Agreement for module development](https://foundryvtt.com/article/license/).

## Credit

This is a fork of Magic Items module created by Simone found at [this address](https://gitlab.com/riccisi/foundryvtt-magic-items/).

Magic Items is a module for Foundry VTT by Simone and is licensed under a [Creative Commons Attribution 4.0 International License](http://creativecommons.org/licenses/by/4.0/).
