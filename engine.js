/* Pure rules engine. The interface and tests use these same calculations. */
(function(root){
'use strict';
const rules=typeof module!=='undefined'&&module.exports?require('./rules.js'):root.SD_RULES;
const tables=typeof module!=='undefined'&&module.exports?require('./tables.js'):root.SD_TABLES;
const modifier=score=>Math.max(-4,Math.min(4,Math.floor((score-10)/2)));
const signed=n=>n>=0?`+${n}`:String(n);
function rollDie(sides,random){
 if(!Number.isInteger(sides)||sides<2) throw new Error('Invalid die.');
 if(random){const r=random();if(!(r>=0&&r<1))throw new Error('Invalid random source.');return Math.floor(r*sides)+1;}
 if(root.crypto&&root.crypto.getRandomValues){const limit=Math.floor(4294967296/sides)*sides;const buffer=new Uint32Array(1);do{root.crypto.getRandomValues(buffer);}while(buffer[0]>=limit);return buffer[0]%sides+1;}
 return Math.floor(Math.random()*sides)+1;
}
function baseStats(roll){if(!Number.isInteger(roll)||roll<1||roll>400)throw new Error('Ability table roll must be 1–400.');return Object.fromEntries(rules.statNames.map((s,i)=>[s,tables.stats[roll-1][i]]));}
function eligibleBackground(bg,stats){
 if(!bg||!stats)return true;
 const requirements={29:()=>stats.CHA>=12,31:()=>stats.STR>=12,34:()=>stats.STR>=12||stats.CHA>=12,35:()=>stats.DEX>=12};
 return requirements[bg.roll]?requirements[bg.roll]():true;
}
function getMutation(roll,choice=null){
 const entry=rules.mutations.find(m=>m.roll===roll);
 if(!entry)throw new Error('Mutation roll must match the supplied d20 table.');
 const mutation=JSON.parse(JSON.stringify(entry));
 if(entry.choices){
  if(choice!==null&&!entry.choices.includes(choice))throw new Error('Choose STR or CON for Unusual Size.');
  mutation.choice=choice;
  if(choice)mutation.effects.stats={[choice]:2};
 }
 return mutation;
}
function derive(state){
 const c=rules.classes[state.classId];
 const scores=state.statRoll?baseStats(state.statRoll):Object.fromEntries(rules.statNames.map(s=>[s,10]));
 const fx={melee:0,ranged:0,meleeDamage:0,spell:0,ac:0,unarmoredAC:0,staffAC:0,armor:{},masteries:[],backstabDice:state.classId==='thief'?1:0,initiative:false,spellAdvantages:[],extraSpells:[],notes:[],rageUses:2,rageDie:4,rageCritical:19,inspiration:0};
 const mutation=state.ancestry==='mutant'?state.mutation:null;
 if(mutation&&mutation.effects){const e=mutation.effects;for(const s of rules.statNames){const increase=Number(e.stats?.[s]||0);if(increase)scores[s]=Math.min(e.statCaps?.[s]??Infinity,scores[s]+increase);}for(const k of ['melee','ranged','spell','ac'])fx[k]+=Number(e[k]||0);}
 let universalSpellBonus=Number(mutation?.effects?.spell||0);
 if(state.ancestry==='half-orc'){fx.melee++;fx.meleeDamage++;}
 if(state.ancestry==='half-elf'){if(state.farsight==='ranged')fx.ranged++;else if(state.farsight==='spell')fx.spell++;}
 if(state.classId==='fighter'&&state.classChoices?.mastery)fx.masteries.push(state.classChoices.mastery);
 for(const t of state.talents||[]){
  if(!t.resolved)continue;
  const key=t.key;
  if(key==='stats'||key==='distribute'||key==='shaman-wis'||key==='wizard-choice'||key==='barbarian-choice'){
   for(const s of rules.statNames)scores[s]+=Number(t.stats?.[s]||0);
   if(t.choice==='spell')fx.spell++;
   if(t.choice==='melee')fx.melee++;
  }
  if(key==='attacks'){fx.melee++;fx.ranged++;}
  if(key==='attack-choice')fx[t.choice]++;
  if(key==='spell-bonus')fx.spell++;
  if(key==='armor')fx.armor[t.detail]=(fx.armor[t.detail]||0)+1;
  if(key==='mastery')fx.masteries.push(t.detail);
  if(key==='spell-advantage')fx.spellAdvantages.push(t.detail);
  if(key==='extra-spell')fx.extraSpells.push(t.detail);
  if(key==='magic-item')fx.notes.push(`Random magic item (${t.detail}); GM determines the item and its properties.`);
  if(key==='initiative')fx.initiative=true;
  if(key==='backstab')fx.backstabDice++;
  if(key==='melee-damage')fx.meleeDamage++;
  if(key==='rage-choice'){if(t.choice==='uses')fx.rageUses++;else fx.rageDie=fx.rageDie===4?6:8;}
  if(key==='rage-critical')fx.rageCritical=17;
  if(key==='superstition')fx.notes.push(`Willing to use magic ${t.detail}.`);
  if(key==='unarmored-ac')fx.unarmoredAC++;
  if(key==='staff-ac')fx.staffAC++;
  if(key==='inspiration')fx.inspiration++;
 }
 for(const [stat,increase] of Object.entries(mutation?.effects?.stats||{}))if(increase&&mutation.effects.statCaps?.[stat]!==undefined)scores[stat]=Math.min(scores[stat],mutation.effects.statCaps[stat]);
 const mods=Object.fromEntries(rules.statNames.map(s=>[s,modifier(scores[s])]));
 const backgrounds=state.bgRoll?[tables.backgrounds[state.bgRoll-1]]:[];
 if(state.classId==='bard'){
  for(const id of [17,state.classChoices?.bardBackground==='Actor'?29:18])if(!backgrounds.some(b=>b.roll===id))backgrounds.push(tables.backgrounds[id-1]);
 }
 let slots=Math.max(10,scores.STR)+Number(mutation?.effects?.gearSlots||0);
 if(state.classId==='fighter')slots+=Math.max(0,mods.CON);
 for(const b of backgrounds){
  if([11,38].includes(b.roll))slots++;
  if(b.roll===28&&(c?.cast||mutation?.effects?.spells?.length)){fx.spell++;universalSpellBonus++;}
 }
 const castBase=c?.cast==='AVERAGE'?Math.floor((mods.WIS+mods.CHA)/2):c?.cast?mods[c.cast]:null;
 const hp=state.hpRolls&&c?calculateHP(c.die,state.hpRolls,mods.CON,state.ancestry==='dwarf',Number(mutation?.effects?.hp||0)+Number(mutation?.effects?.hpPerLevel||0)):null;
 const spells=[...(state.classChoices?.spells||[]),...fx.extraSpells];
 if(state.classId==='priest')spells.push('Turn Undead');
 const mutationSpells=(mutation?.effects?.spells||[]).map(s=>({...s,checkBonus:s.stat?mods[s.stat]+universalSpellBonus:null}));
 for(const spell of mutationSpells)if(!spells.includes(spell.name))spells.push(spell.name);
 return {scores,mods,fx,backgrounds,slots,castBase,spellTotal:castBase===null?null:castBase+fx.spell,hp,spells,mutationSpells,mutationEffects:mutation?.effects||{},
 meleeAttack:mods.STR+fx.melee,rangedAttack:mods.DEX+fx.ranged,
 unarmoredAC:(state.classId==='barbarian'?12:10)+mods.DEX+fx.ac+fx.unarmoredAC,
 staffAC:10+mods.DEX+fx.ac+(state.classId==='knight'?2:0)+fx.staffAC,
 divineInspiration:state.classId==='paladin'?1+mods.CHA+fx.inspiration:null,
 bardLuck:state.classId==='bard'?Math.max(1,1+Math.floor(mods.CHA/2)):null};
}
function calculateHP(die,rolls,con,dwarf=false,bonus=0){
 if(!Array.isArray(rolls)||rolls.length!==(dwarf?2:1)||rolls.some(n=>!Number.isInteger(n)||n<1||n>die))throw new Error('Invalid hit point roll.');
 const kept=Math.max(...rolls),base=Math.ceil((kept+die)/2),minimum=Math.ceil(die/2);
 const total=Math.max(minimum,base+con+(dwarf?2:0)+bonus);
 return {die,rolls:[...rolls],kept,base,con,dwarfBonus:dwarf?2:0,mutationBonus:bonus,minimum,total};
}
function talentAllowed(t,state){
 if(t.rerollLevelOne)return false;
 const d=derive(state);
 if(t.id==='shaman-wis'&&d.scores.WIS>=18)return false;
 if(t.unique&&(state.talents||[]).some(x=>x.resolved&&x.key===t.id))return false;
 return true;
}
function rollTalent(state,random){
 const c=rules.classes[state.classId];if(!c)throw new Error('Choose a class first.');
 const history=[];
 for(let i=0;i<100;i++){
  const dice=[rollDie(6,random),rollDie(6,random)],total=dice[0]+dice[1];
  const row=c.talents.find(t=>total>=t.min&&total<=t.max);
  const accepted=talentAllowed(row,state);
  history.push({dice,total,accepted,reason:accepted?'':row.label});
  if(accepted)return {roll:total,history,key:row.id,rowMin:row.min,label:row.label,resolved:false};
 }
 throw new Error('Too many required rerolls. Roll again.');
}
function summary(state){
 const d=derive(state),c=rules.classes[state.classId],a=rules.ancestries[state.ancestry];
 const lines=[state.name||'Unnamed adventurer',`Level 1 · ${state.mode}`,`Background: ${d.backgrounds.map(b=>b.name).join('; ')}`,rules.statNames.map(s=>`${s} ${d.scores[s]} (${signed(d.mods[s])})`).join('   '),`Ancestry: ${a?.name||'—'}`,`Ancestry feature: ${a?.feature||'—'}`];
 if(state.ancestry==='half-elf')lines.push(`Farsight selection: ${state.farsight==='ranged'?'+1 ranged attack':'+1 spellcasting'}`);
 if(state.ancestry==='mutant'&&state.mutation){lines.push(`Mutation (d20 ${state.mutation.roll}): ${state.mutation.name} — ${state.mutation.description}`);if(state.mutation.choice)lines.push(`Mutation stat choice: +2 ${state.mutation.choice} (maximum 20 from this mutation)`);}
 lines.push(`Class: ${c?.name||'—'} (${c?.primary||'—'})`,`Class talent(s): ${(state.talents||[]).filter(t=>t.resolved).map(t=>`[2d6 ${t.roll}] ${t.description||t.label}`).join('; ')||'—'}`,`HP: ${d.hp?.total??'—'}`,`Alignment: ${state.alignment||'—'}`,'','Background features:');
 d.backgrounds.forEach(b=>lines.push(`${b.name}: ${b.description}`));
 if(d.backgrounds.some(b=>!eligibleBackground(b,d.scores)))lines.push('GM approval needed: background stat prerequisite is not met.');
 lines.push('','Class features:',...(c?.features||[]));
 if(state.classChoices?.culture)lines.push(`Cultural origin: ${state.classChoices.culture}`);
 if(state.classChoices?.grit)lines.push(`Grit selection: ${state.classChoices.grit}`);
 lines.push(`Ancestry languages: ${a?.languages||'—'}`,`Gear slots: ${d.slots}`,`Melee attack: ${signed(d.meleeAttack)} (STR)`, `Melee attack with finesse: ${signed(modifier(d.scores.DEX)+d.fx.melee)} (DEX)`, `Ranged attack: ${signed(d.rangedAttack)} (DEX)`,`Melee damage bonus: ${signed(d.fx.meleeDamage)} (ability modifiers are not added to damage)`,`Unarmored AC: ${d.unarmoredAC}${state.classId==='barbarian'?' (without shield)':''}`);
 if(state.classId==='knight')lines.push(`Unarmored AC with staff: ${d.staffAC}`,`Staff of the Order attack: ${signed(Math.max(d.mods.STR,d.mods.DEX)+d.fx.melee+1)}; damage bonus ${signed(d.fx.meleeDamage+1)}`);
 d.fx.masteries.forEach(w=>lines.push(`${w} mastery: +1 attack and damage in addition to general bonuses`));
 Object.entries(d.fx.armor).forEach(([armor,bonus])=>lines.push(`${armor}: +${bonus} AC from talents`));
 if(state.classId==='ranger')lines.push(`Fighting style: +1 attack with ${state.classChoices?.style==='bows'?'bows':'axes and daggers'}`);
 if(d.spellTotal!==null)lines.push(`Spellcasting: ${signed(d.spellTotal)}`,`Known spells: ${d.spells.join(', ')}`);
 for(const spell of d.mutationSpells){lines.push(`Mutation spell: ${spell.name}${spell.stat?' — '+spell.stat+' check '+signed(spell.checkBonus):''}${spell.dc?' vs DC '+spell.dc:''}${spell.note?' — '+spell.note:''}`);}
 for(const weapon of d.mutationEffects.naturalWeapons||[])lines.push(`Natural weapon: ${weapon.name} — ${weapon.damage}; melee attack ${signed(d.meleeAttack)}; general melee damage bonus ${signed(d.fx.meleeDamage)}`);
 if(d.mutationEffects.gearSlots)lines.push(`Mutation inventory bonus: +${d.mutationEffects.gearSlots} slot (included above)`);
 if(d.mutationEffects.hpPerLevel)lines.push(`Mutation HP bonus: +${d.mutationEffects.hpPerLevel} per level (included in starting HP)`);
 if(d.mutationEffects.movementBonus)lines.push(`Movement bonus: +${d.mutationEffects.movementBonus}`);
 if(d.fx.spellAdvantages.length)lines.push(`Cast with advantage: ${d.fx.spellAdvantages.join(', ')}`);
 if(d.fx.initiative)lines.push('Initiative advantage');
 if(state.classId==='thief')lines.push(`Backstab extra damage: ${d.fx.backstabDice} weapon dice`);
 if(state.classId==='barbarian')lines.push(`Rage: ${d.fx.rageUses}/day, +1d${d.fx.rageDie} melee damage, critical on ${d.fx.rageCritical}–20; +1 attack while raging`);
 if(d.divineInspiration!==null)lines.push(`Divine Inspiration/day: ${d.divineInspiration}`);
 if(d.bardLuck!==null)lines.push(`Extra Bardic Luck tokens/session: ${d.bardLuck}`);
 lines.push(...d.fx.notes);
 for(const b of d.backgrounds){
  if(b.roll===5)lines.push('Blacksmith: +1 hammer attack in addition to general bonuses.');
  if(b.roll===21)lines.push('Circus Performer: +1 throwing-knife attack in addition to general bonuses.');
  if(b.roll===31)lines.push('Bouncer / Prize Fighter: +2 unarmed/brass-knuckle attack in addition to general bonuses.');
 }
 lines.push('','Roll record:',`Background d40: ${state.bgRoll}`,`Ability table d400: ${state.statRoll}`);
 for(const t of state.talents||[])for(const h of t.history||[])lines.push(`Talent: ${h.dice.join(' + ')} = ${h.total}${h.accepted?'':' (required reroll: '+h.reason+')'}`);
 if(d.hp)lines.push(`HP d${d.hp.die}: ${d.hp.rolls.join(', ')}; kept ${d.hp.kept}; ceil((${d.hp.kept} + ${d.hp.die}) / 2) = ${d.hp.base}; CON ${signed(d.hp.con)}; dwarf ${signed(d.hp.dwarfBonus)}; mutation ${signed(d.hp.mutationBonus)}; minimum ${d.hp.minimum}; final ${d.hp.total}`);
 return lines.join('\n');
}
const api={getMutation,modifier,signed,rollDie,baseStats,eligibleBackground,derive,calculateHP,talentAllowed,rollTalent,summary};
if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.SD_ENGINE=api;
})(globalThis);
