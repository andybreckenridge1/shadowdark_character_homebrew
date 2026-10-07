[README.md](https://github.com/user-attachments/files/33134864/README.md)
# Shadowdark campaign character creator

A static web app that creates a first-level character using the supplied campaign background table, 400-row ability table, ancestry PDF, standard and homebrew class PDFs, and mutant ability DOCX. It works offline and can be hosted on GitHub Pages. No server, API key, database, build step, or npm install is required to use it.
implemented.


## Included choices

| Mode | Classes | Ancestries |
| --- | --- | --- |
| STANDARD | Fighter, priest, thief, wizard | Dwarf, half-orc, half-elf, halfling, human |
| HOMEBREW | All standard classes, plus barbarian, bard, druid, Knight of Alleah, paladin, ranger, shaman | All standard ancestries, plus mutant |

Half-elf uses the supplied elf feature. Full elves and goblins are not options. Bard is included because it appears in the requested class-selection step and the homebrew PDF.

## Creation rules

1. Roll one campaign background on d40.
2. Roll one d400 result and copy its six ability scores in the original order. The supplied DOCX heading says d100, but its data contain all 400 rows; the app uses d400.
3. Choose an ancestry and resolve Farsight or a mutation where needed.
4. Choose a class. The interface shows its primary stats and the character's current scores, then prompts for applicable class choices and starting spells.
5. Roll 2d6 on the correct class talent table. Humans roll twice. Resolve each talent before the next roll, so new scores can affect required rerolls. A result of 12 prompts for the allowed talent choice or two separately allocated stat points. Shaman's 12 allows only the stat allocation, as its table specifies.
6. Roll HP using the confirmed house rule below.
7. Choose alignment. Druids must be Neutral; paladins and Knights of Alleah must be Lawful.

Required talent rerolls are automatic and retained in the roll record. Bard and ranger reroll their prohibited level-one results. Duplicate thief initiative advantage and barbarian Rage critical range require rerolls. Shaman's Wisdom increase rerolls when Wisdom is already 18 or higher.

Changes to upstream choices clear downstream choices and rolls that depend on them. Going Back without changing a choice keeps existing results.

### Hit points

For a class with hit die maximum `D`:

```text
rolled = one dD result
        (dwarves roll two dD and keep the higher result)
base = ceil((rolled + D) / 2)
HP = max(ceil(D / 2), base + CON modifier + dwarf bonus + mutation HP adjustment)
dwarf bonus = 2 for dwarves, otherwise 0
```

Before CON and ancestry adjustments, a d4 class has 3–4 HP, a d6 class 4–6, a d8 class 5–8, and a d10 class 6–10. The floor is half the class die maximum, rounded up; it does not incorporate a theoretical maximum CON score. Final CON uses all applied stat changes.

Ability modifiers run from −4 to +4; scores above 18 still have a +4 modifier. Stat scores are not automatically capped at 18. Attack talents and ancestry bonuses can increase totals above +4. STR and DEX modifiers are used for attack rolls, not added to damage. Conditional weapon and armor bonuses are listed separately in the output.

### Details and decisions

- The requested background-first workflow is retained for bards. Bards keep the rolled campaign background and also get Entertainer and their chosen Scholar or Actor background. Repeated backgrounds apply once. Actor requires CHA 12+.
- A rolled background with an unmet stat requirement offers either a background reroll or an explicit GM-approval checkbox. The final summary flags a requirement that remains unmet after all talent changes.
- Norse, Celtic, and Saxon requirements for barbarians and shamans appear as a required cultural-origin choice alongside the character ancestry.
- The standard class PDFs do not include their complete spell lists. Priest and wizard starting spells use name-entry fields; users should consult the relevant spell list. Homebrew starting spell choices use the lists in the supplied PDF.
- Wizard talent 2 prompts for the magic item type. The supplied files do not contain the random magic item tables, so the item itself and its properties are determined by the GM.
- Class armor permissions and conditional armor bonuses are recorded. Equipment selection, wealth, full spell descriptions, leveling, and combat automation are outside this seven-step creator.
- Background features are preserved in full. Defined gear-slot bonuses and the Kaat Addict class spellcasting bonus are calculated. Conditional background attack bonuses are listed in the summary. Background-granted spells, languages, connections, wealth bonuses, and GM-dependent rewards remain described for completion with the GM.

## Mutant abilities

HOMEBREW includes all 20 abilities from `mutantabilities.docx`. Roll d20 to select an ability automatically. Unusual Size (19) requires a choice of STR or CON before proceeding.

The creator applies Thick Skin's +1 AC, Tough's +1 starting HP, Prehensile Tail's extra inventory slot, the ranged attack bonus, and the INT, STR/CON, or DEX increases. The affected stats for Genius, Unusual Size, and Lightning Reflexes are capped at 20, including subsequent talent increases during creation. Other stats retain the normal uncapped score behavior. Ability modifiers still cap at +4.

Mutation spells are recorded as known spells even for classes that normally have no spells. Protection from Good or Evil uses WIS vs DC 11, and Telekinetic Projectile uses INT vs DC 11. Their check bonuses use the final ability modifiers. Class-specific spellcasting talent bonuses do not automatically apply to these independent mutation spells. The Cause Fear entry specifies a tier and critical-failure consequence but no casting stat or DC; the summary preserves that gap for the GM to determine.

Claws and the venomous bite appear as natural weapons. Resistances, immunity, physical damage reduction, underwater breathing, swimming, regeneration, movement, magic resistance, and Spider Climb are retained in the feature text and JSON effects. The app creates characters; it does not resolve combat, damage reduction, resistance rolls, or once-per-day usage during play.

The mutation data are in the `mutations` array in `rules.js`. Tough's +1 HP per level contributes +1 at level 1; leveling remains outside the creator's scope.

## Project files

| File | Purpose |
| --- | --- |
| `index.html` | App entry page |
| `styles.css` | Responsive screen and print styles |
| `tables.js` | Exact 400-row stat table and 40-row background table |
| `rules.js` | Ancestries, class rules, talent tables, and the complete d20 mutation table |
| `engine.js` | Dice, modifiers, talent effects, HP, and output calculations |
| `app.js` | Seven-step interface and character downloads |
| `tests/engine.test.cjs` | Rule calculations and edge cases |
| `tests/ui.test.cjs` | Interface event logic in a dependency-free DOM fixture |
| `package.json` | Optional test command; no runtime dependencies |

## Run rule tests

With Node.js installed:

```sh
npm test
```

Or run `node --test tests/*.test.cjs` directly. No package installation is needed for these rule tests. The tests cover table lengths and endpoints, modifiers, HP die ranges and minimums, dwarf advantage, talent-table coverage, stacking, first-level rerolls, stat changes, spell effects, conditional AC, background prerequisites, and mutant adjustments.

## Credits

Shadowdark RPG is by The Arcane Library, LLC. This is an independent campaign tool and is not an official Arcane Library product. Campaign tables and homebrew rules come from the files supplied for this project. The PDFs and other original attachments are not bundled in the project.

Rules reference for attack damage and CON changes: [Shadowdark RPG Rules FAQ](https://www.thearcanelibrary.com/blogs/shadowdark-blog/shadowdark-rules-faq).

Validation completed: 24 rule tests and 128 interface event scenarios pass. Interface tests use a DOM fixture, not a rendering browser. Browser rendering and visual layout have not been verified in this environment because the test browser download was unavailable.
