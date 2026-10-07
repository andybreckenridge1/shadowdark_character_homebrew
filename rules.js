/* Level-one campaign rules, transcribed and paraphrased from the supplied PDFs. */
(function(root){
'use strict';
const statNames=['STR','DEX','CON','INT','WIS','CHA'];
const weapons=['Club','Crossbow','Dagger','Dart','Greataxe','Greatsword','Javelin','Longbow','Longsword','Mace','Shortbow','Shortsword','Sling','Spear','Staff','Warhammer'];
const druidSpells=['Goodberry','Shillelagh','Tangle Vine','Summon Creature','Talk With Animals','Barkskin','Eagle Eye','Bloodhound',"Hare’s Ear"];
const entry=(min,max,id,label,extra={})=>({min,max,id,label,...extra});
const stats=(min,max,choices)=>entry(min,max,'stats',`+2 to ${choices.join(', ')}`,{choices});
const attacks=(min,max,both=true)=>entry(min,max,both?'attacks':'attack-choice',both?'+1 to melee and ranged attacks':'+1 to melee OR ranged attacks');
const spell=(min,max,extra={})=>entry(min,max,'spell-bonus','+1 to spellcasting checks',extra);
const advantage=(min,max,extra={})=>entry(min,max,'spell-advantage','Advantage on casting one known spell',extra);
const free=(min=12,max=12)=>entry(min,max,'free','Choose a talent or distribute +2 stat points');
const armor=(min,max)=>entry(min,max,'armor','+1 AC with one chosen armor type');
const classes={
fighter:{name:'Fighter',primary:'STR or DEX',die:8,weapons:'All weapons',armor:['Leather','Chainmail','Plate'],shield:true,features:['Hauler: add a positive CON modifier to gear slots.','Weapon Mastery: +1 attack and damage with the selected weapon at level 1.','Grit: advantage on STR or DEX checks to overcome an opposing force.'],talents:[entry(2,2,'mastery','Weapon Mastery with another weapon type'),attacks(3,6),stats(7,9,['STR','DEX','CON']),armor(10,11),free()]},
priest:{name:'Priest',primary:'WIS',die:6,cast:'WIS',spells:2,weapons:'Club, crossbow, dagger, mace, longsword, staff, warhammer',armor:['Leather','Chainmail','Plate'],shield:true,features:['Know Turn Undead in addition to two chosen tier 1 spells.','Choose a deity matching your alignment; receive a holy symbol using no gear slots.','Choose Celestial, Diabolic, or Primordial as an additional language.'],talents:[advantage(2,2),attacks(3,6,false),spell(7,9),stats(10,11,['STR','WIS']),free()]},
thief:{name:'Thief',primary:'DEX',die:4,weapons:'Club, crossbow, dagger, shortbow, shortsword',armor:['Leather','Mithral chainmail'],shield:false,features:['Backstab: +1 weapon die against a creature unaware of your attack at level 1.','Thievery: advantage on climbing, sneaking, hiding, disguises, trap work, picking pockets, and opening locks; tools use no gear slots.'],talents:[entry(2,2,'initiative','Advantage on initiative (reroll duplicates)',{unique:true}),entry(3,5,'backstab','Backstab deals +1 damage die'),stats(6,9,['STR','DEX','CHA']),attacks(10,11),free()]},
wizard:{name:'Wizard',primary:'INT',die:4,cast:'INT',spells:3,weapons:'Dagger, staff',armor:[],shield:false,features:['Know three chosen tier 1 wizard spells.','Know two additional common and two rare languages.','A day of study and a DC 15 INT check can teach a wizard spell from a scroll; the scroll is consumed on success or failure.'],talents:[entry(2,2,'magic-item','Create one random magic item of a chosen type (GM determines the item)'),entry(3,7,'wizard-choice','+2 INT or +1 wizard spellcasting'),advantage(8,9),entry(10,11,'extra-spell','Learn another wizard spell of an available tier'),free()]},
barbarian:{name:'Barbarian',homebrew:true,primary:'STR',die:10,weapons:'All weapons',armor:['Leather','Hide'],shield:true,cultures:['Norse','Saxon','Celtic'],features:['Rage: twice daily for 3 rounds; +1 attack, +1d4 melee damage, critical hits on natural 19–20 at level 1.','Tough: advantage on CON checks against disease, poison, and natural environmental hazards.','Use STR for intimidation.','Bare Chested: unarmored AC starts at 12 when using no shield.','Superstitious: willingly use magical weapons, armor, healing potions, and herbal remedies; other magic is suspect.'],talents:[entry(2,2,'rage-choice','One extra daily Rage or raise Rage damage die (d4 → d6 → d8)'),entry(3,3,'rage-critical','Critical hits on 17–20 while raging (reroll duplicates)',{unique:true}),entry(4,6,'melee-damage','+1 melee weapon damage'),entry(7,9,'barbarian-choice','+2 STR, +2 CON, or +1 melee attacks'),entry(10,10,'superstition','Accept one additional type of magic item'),entry(11,11,'unarmored-ac','+1 AC while unarmored without a shield'),free()]},
bard:{name:'Bard',homebrew:true,primary:'CHA and INT',die:6,cast:'INT',spells:1,spellList:['Alarm','Charm Person','Detect Magic','Floating Disk','Hold Portal','Light','Protection From Evil','Sleep',"Traveler’s Tongue"],weapons:'Shortbow, club, dagger, dart, javelin, mace, sling, spear, staff, sword',armor:['Leather','Chainmail'],shield:true,features:['Backgrounds: Entertainer and a choice of Scholar or Actor.','Armored Casting: critical failure on natural 1 unarmored, 1–2 in leather, 1–3 in chainmail.','Bardic Luck: extra luck tokens each session = max(1, 1 + floor(CHA modifier / 2)).','Provoke: CHA check against DC 9 + floor(target level / 2) draws its attention until its next turn ends.','INT spellcasting uses wizard critical-failure rules.'],talents:[advantage(2,2,{rerollLevelOne:true}),attacks(3,6,false),stats(7,8,['STR','DEX','INT','CHA']),spell(9,11,{rerollLevelOne:true}),free()]},
druid:{name:'Druid',homebrew:true,primary:'WIS',die:6,cast:'WIS',spells:3,spellList:druidSpells,weapons:'Club, sling, staff, dart, spear, javelin',armor:['Leather','Hide'],shield:true,alignment:'Neutral',features:['Know Celtic in addition to Common and an ancestry language (choose another if already Celtic).','Nature’s Step: advantage on tracking, foraging, navigating, moving quietly outdoors, and detecting ambushes or hidden dangers.','Serve Cernunnos, also known as Pan.'],talents:[advantage(2,2),attacks(3,6),spell(7,9),stats(10,11,['STR','WIS','DEX','CON']),free()]},
knight:{name:'Knight of Alleah',homebrew:true,primary:'WIS, CHA, and DEX',die:6,cast:'AVERAGE',spells:1,spellList:['Jump','Mage Armor','Telekinetic Projectile','Mage Hand','Sanctuary','Truth Sense','Holy Weapon',"Traveler’s Tongue",'Charm Person','Feather Fall','Hold Portal','Throw'],weapons:'Staff, darts',armor:[],shield:false,alignment:'Lawful',features:['Defensive Maneuvers: +2 AC while unarmored and wielding a staff.','Staff of the Order: finesse; +1 attack and damage at level 1.','+1 reaction checks when speaking the target’s native language.','Spellcasting uses floor((WIS modifier + CHA modifier) / 2).'],talents:[advantage(2,2),attacks(3,3),spell(4,6),stats(7,9,['STR','DEX','CON','WIS','CHA']),entry(10,11,'staff-ac','+1 AC while wielding a staff'),free()]},
paladin:{name:'Paladin',homebrew:true,primary:'CHA and STR',die:8,weapons:'All melee weapons, crossbows',armor:['Leather','Chainmail','Plate'],shield:true,alignment:'Lawful',features:['Divine Inspiration: 1 + CHA modifier points per day.','Spend 1 point for Divine Smite (+1 attack and damage for 3 rounds at level 1), Detect Evil (near range, 3 rounds), Guardian Instinct (take a nearby ally’s damage before it is rolled), or Divine Courage (+1 ally attacks and spellcasting within near range for 3 rounds).','Give half of acquired wealth to the church, needy, or another worthy cause.'],talents:[entry(2,2,'inspiration','+1 Divine Inspiration per day'),stats(3,3,['CHA']),attacks(4,6),stats(7,9,['STR','DEX','CON']),armor(10,11),free()]},
ranger:{name:'Ranger',homebrew:true,primary:'WIS and (STR or DEX)',die:8,weapons:'Ax, sword, bow, club, sling, staff, dart, spear, javelin, dagger',armor:['Leather','Chainmail'],shield:true,features:['Fighting Style: +1 attack with bows OR with axes and daggers.','Nature’s Step: advantage on tracking and outdoor navigation; in leather or lighter also forage, move quietly, and detect hidden outdoor dangers with advantage.','Druid spellcasting starts at level 2; no class spells at level 1.','May serve a deity of hunting, wilderness, animals, travel, or protection.'],talents:[advantage(2,2,{rerollLevelOne:true}),attacks(3,6),spell(7,9,{rerollLevelOne:true}),stats(10,11,['STR','WIS','DEX','CON']),free()]},
shaman:{name:'Shaman',homebrew:true,primary:'WIS',die:4,cast:'WIS',spells:3,spellList:['Augury (tier 1)','Badger Form','Barkskin','Eagle Eye',"Hare’s Ear",'Light','Shillelagh','Talk With Animals','War Fury','Wolf Form'],weapons:'Dagger, staff, club, sling',armor:[],shield:false,cultures:['Norse','Celtic','Saxon'],features:['Know Primordial. Come from a remote Norse, Celtic, or Saxon tribe.','Know spells according to the wizard spells-known table, using WIS to cast.','After a critical failure, an animal sacrifice appropriate to the spell tier is required to regain it.'],talents:[advantage(2,2),entry(3,6,'shaman-wis','+2 WIS (reroll if WIS is 18)'),spell(7,9),entry(10,11,'extra-spell','Learn another shaman spell of an available tier'),entry(12,12,'distribute','Distribute +2 stat points')]}
};
const ancestries={
dwarf:{name:'Dwarf',feature:'Stout: +2 starting HP; roll hit dice with advantage.',languages:'Common, Dwarvish'},
'half-orc':{name:'Half-orc',feature:'Mighty: +1 to melee attack and melee damage rolls.',languages:'Common, Orcish'},
'half-elf':{name:'Half-elf',feature:'Farsight: choose +1 ranged attack OR +1 spellcasting checks (same feature as the supplied elf).',languages:'Common, Elvish, Sylvan'},
halfling:{name:'Halfling',feature:'Stealthy: once per day, become invisible for 3 rounds.',languages:'Common'},
human:{name:'Human',feature:'Ambitious: one extra class talent roll at level 1.',languages:'Common and one additional common language'},
mutant:{name:'Mutant',homebrew:true,feature:'Mutation: gain one randomly rolled feature from the d20 mutation table.',languages:'Not specified in the supplied files'}
};
const mutations=[
  {
    "roll": 1,
    "name": "Fire Resistance",
    "description": "Fire resistance (half damage).",
    "effects": {
      "fireDamageMultiplier": 0.5
    }
  },
  {
    "roll": 2,
    "name": "Claws",
    "description": "Claws, each does 1d6 damage, and advantage climbing.",
    "effects": {
      "naturalWeapons": [
        {
          "name": "Claws",
          "damage": "1d6 each"
        }
      ],
      "advantages": [
        "Climbing"
      ]
    }
  },
  {
    "roll": 3,
    "name": "Poison Immunity",
    "description": "Immunity to poison.",
    "effects": {
      "immunities": [
        "Poison"
      ]
    }
  },
  {
    "roll": 4,
    "name": "Fibrous Flesh",
    "description": "Fibrous flesh: reduce physical damage by 1.",
    "effects": {
      "physicalDamageReduction": 1
    }
  },
  {
    "roll": 5,
    "name": "Gills and Webbed Feet",
    "description": "Natural gills, webbed feet, and underwater breathing; swim 20 feet.",
    "effects": {
      "underwaterBreathing": true,
      "swimSpeed": 20
    }
  },
  {
    "roll": 6,
    "name": "Thick Skin",
    "description": "Thick skin (+1 AC).",
    "effects": {
      "ac": 1
    }
  },
  {
    "roll": 7,
    "name": "Demonic Connection",
    "description": "Your patron grants the tier 1 spell Cause Fear. A critical failure causes you to succumb to the spell instead of your target.",
    "effects": {
      "spells": [
        {
          "name": "Cause Fear",
          "tier": 1,
          "stat": null,
          "dc": null,
          "note": "Critical failure affects you instead of your target. The table does not specify a casting stat or DC."
        }
      ]
    }
  },
  {
    "roll": 8,
    "name": "Regeneration",
    "description": "Regeneration: heal 1d4 once per day when reduced to 0 HP.",
    "effects": {
      "regeneration": {
        "die": 4,
        "usesPerDay": 1,
        "trigger": "Reduced to 0 HP"
      }
    }
  },
  {
    "roll": 9,
    "name": "Fast Runner",
    "description": "Fast Runner (+10 movement).",
    "effects": {
      "movementBonus": 10
    }
  },
  {
    "roll": 10,
    "name": "Tough",
    "description": "Tough (+1 HP per level).",
    "effects": {
      "hpPerLevel": 1
    }
  },
  {
    "roll": 11,
    "name": "Prehensile Tail",
    "description": "Prehensile tail: one extra inventory slot and advantage climbing.",
    "effects": {
      "gearSlots": 1,
      "advantages": [
        "Climbing"
      ]
    }
  },
  {
    "roll": 12,
    "name": "Magic Resistance",
    "description": "Magic resistance 20%.",
    "effects": {
      "magicResistancePercent": 20
    }
  },
  {
    "roll": 13,
    "name": "Protection from Good or Evil",
    "description": "Cast Protection from Good or Evil (DC 11), using WIS.",
    "effects": {
      "spells": [
        {
          "name": "Protection from Good or Evil",
          "stat": "WIS",
          "dc": 11
        }
      ]
    }
  },
  {
    "roll": 14,
    "name": "Genius",
    "description": "Genius (+2 INT, maximum 20).",
    "effects": {
      "stats": {
        "INT": 2
      },
      "statCaps": {
        "INT": 20
      }
    }
  },
  {
    "roll": 15,
    "name": "Telekinetic",
    "description": "Cast Telekinetic Projectile (DC 11), using INT.",
    "effects": {
      "spells": [
        {
          "name": "Telekinetic Projectile",
          "stat": "INT",
          "dc": 11
        }
      ]
    }
  },
  {
    "roll": 16,
    "name": "Spider Climb",
    "description": "Climbing speed equals walking speed. Move freely along vertical surfaces using both hands and feet.",
    "effects": {
      "climbSpeed": "Walking speed",
      "verticalClimbing": true
    }
  },
  {
    "roll": 17,
    "name": "Eye-Hand Coordination",
    "description": "Exceptional eye-hand coordination (+1 ranged weapon attacks).",
    "effects": {
      "ranged": 1
    }
  },
  {
    "roll": 18,
    "name": "Venomous Bite",
    "description": "Bite for 1d4. Once per day, a creature hit must pass a DC 15 CON check or take an additional 1d6 poison damage.",
    "effects": {
      "naturalWeapons": [
        {
          "name": "Bite",
          "damage": "1d4"
        }
      ],
      "venom": {
        "usesPerDay": 1,
        "saveStat": "CON",
        "dc": 15,
        "damage": "1d6 poison"
      }
    }
  },
  {
    "roll": 19,
    "name": "Unusual Size",
    "description": "8 feet tall; choose +2 STR or +2 CON, maximum 20.",
    "choices": [
      "STR",
      "CON"
    ],
    "effects": {
      "heightFeet": 8,
      "statCaps": {
        "STR": 20,
        "CON": 20
      }
    }
  },
  {
    "roll": 20,
    "name": "Lightning Reflexes",
    "description": "Lightning Reflexes (+2 DEX, maximum 20).",
    "effects": {
      "stats": {
        "DEX": 2
      },
      "statCaps": {
        "DEX": 20
      }
    }
  }
];
const rules={statNames,weapons,classes,ancestries,mutations};
if(typeof module!=='undefined'&&module.exports) module.exports=rules; else root.SD_RULES=rules;
})(globalThis);
