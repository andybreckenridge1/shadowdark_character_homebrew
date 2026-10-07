(function(){
'use strict';
const R=SD_RULES,E=SD_ENGINE,T=SD_TABLES;
let state=fresh(),step=0,freeSelection='distribute';
function fresh(){return {version:1,mode:null,bgRoll:null,statRoll:null,ancestry:null,farsight:null,mutation:null,classId:null,classChoices:{},talents:[],hpRolls:null,alignment:null,name:''};}
const $=id=>document.getElementById(id);
const esc=v=>String(v??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const names=['Rules','Background','Stats','Ancestry','Class','Talents','HP','Alignment','Character'];
const options=(values,selected)=>values.map(v=>{const value=typeof v==='string'?v:v.value,label=typeof v==='string'?v:v.label;return `<option value="${esc(value)}" ${value===selected?'selected':''}>${esc(label)}</option>`;}).join('');
function select(id,label,values,value){return `<label class="field" for="${id}">${esc(label)}<select id="${id}">${options(values,value)}</select></label>`;}
function textField(id,label,value='',extra=''){return `<label class="field" for="${id}">${esc(label)}<input type="text" id="${id}" value="${esc(value)}" ${extra}></label>`;}
function statsHTML(d){return `<div class="stats">${R.statNames.map(s=>`<div class="stat"><span>${s}</span><b>${d.scores[s]}</b><small>${E.signed(d.mods[s])}</small></div>`).join('')}</div>`;}
function intro(n,title,desc){return `<p class="kicker">${n===0?'Begin your character':`Step ${n} of 7`}</p><h2 tabindex="-1">${title}</h2><p class="subtle">${desc}</p>`;}
function actions(next='Continue',enabled=true){return `<div class="actions">${step>0?'<button class="quiet" id="back">← Back</button>':''}<button class="forward" id="next" ${enabled?'':'disabled'}>${next} →</button></div>`;}
function invalidate(after){
 if(after<1)state.bgRoll=null;
 if(after<2)state.statRoll=null;
 if(after<3){state.ancestry=null;state.farsight=null;state.mutation=null;}
 if(after<4){state.classId=null;state.classChoices={};}
 if(after<5)state.talents=[];
 if(after<6)state.hpRolls=null;
 if(after<7)state.alignment=null;
}
function render(focus=false){
 $('error').textContent='';
 $('progress').innerHTML=names.slice(0,8).map((name,i)=>`<span class="step ${i===step?'active':i<step?'done':''}" ${i===step?'aria-current="step"':''}>${i===0?'':i+'. '}${name}</span>`).join('');
 const d=E.derive(state),c=R.classes[state.classId],a=R.ancestries[state.ancestry];
 $('preview').innerHTML=`<p class="kicker">Your adventurer</p><h2>${esc(state.name||'A story yet to begin')}</h2>${state.statRoll?statsHTML(d):'<p class="subtle">Your rolled scores will appear here.</p>'}<dl><dt>Rules</dt><dd>${state.mode||'Choose a mode'}</dd><dt>Background</dt><dd>${esc(d.backgrounds.map(b=>b.name).join(', ')||'—')}</dd><dt>Ancestry</dt><dd>${esc(a?.name||'—')}</dd><dt>Class</dt><dd>${esc(c?.name||'—')}</dd><dt>Class talents</dt><dd>${state.talents.filter(t=>t.resolved).length}${state.ancestry==='human'?' / 2':' / 1'}</dd><dt>Hit points</dt><dd class="hp">${d.hp?.total??'—'}</dd><dt>Alignment</dt><dd>${state.alignment||'—'}</dd></dl>`;
 let html='';
 if(step===0)html=intro(0,'Choose your rules','Select STANDARD for the four basic classes, or HOMEBREW to include the additional classes and mutant ancestry.')+`<div class="choices"><label class="choice"><input type="radio" name="mode" value="STANDARD" ${state.mode!=='HOMEBREW'?'checked':''}><strong class="mode">STANDARD</strong><p class="subtle">Fighter, priest, thief, wizard.<br>Dwarf, half-orc, half-elf, halfling, human.</p></label><label class="choice"><input type="radio" name="mode" value="HOMEBREW" ${state.mode==='HOMEBREW'?'checked':''}><strong class="mode">HOMEBREW</strong><p class="subtle">All standard choices, plus barbarian, bard, druid, Knight of Alleah, paladin, ranger, shaman, and mutant.</p></label></div>`+actions('Begin');
 if(step===1){const bg=state.bgRoll?T.backgrounds[state.bgRoll-1]:null;html=intro(1,'Roll a background','Roll 1d40 on the campaign background table.')+`<button id="roll-background">${bg?'Reroll':'Roll'} background · d40</button>`+(bg?`<div class="result"><span class="kicker">d40 result</span><div class="roll-value">${state.bgRoll}</div><h3>${esc(bg.name)}</h3><p>${esc(bg.description)}</p></div>`:'')+actions('Generate stats',!!bg);}
 if(step===2){const bg=state.bgRoll?T.backgrounds[state.bgRoll-1]:null,valid=E.eligibleBackground(bg,d.scores);html=intro(2,'Generate your stats','Roll 1d400. Each result gives the six scores from your supplied ability table, in STR, DEX, CON, INT, WIS, CHA order.')+`<button id="roll-stats">${state.statRoll?'Reroll':'Roll'} stats · d400</button>`+(state.statRoll?`<div class="callout">Ability table result: <strong>${state.statRoll}</strong></div>${statsHTML(d)}`:'')+(!valid?`<div class="callout warning"><p>${esc(bg.name)} has a stat requirement your current scores do not meet.</p><label class="check"><input type="checkbox" id="background-override">Continue with GM approval</label><p class="subtle">You can also go back and reroll the background.</p></div>`:'')+actions('Choose ancestry',!!state.statRoll);}
 if(step===3){html=intro(3,'Choose an ancestry','Half-elves use the supplied elf’s Farsight feature. Goblins are unavailable.')+`<div class="choices">${Object.entries(R.ancestries).filter(([,a])=>!a.homebrew||state.mode==='HOMEBREW').map(([id,a])=>`<label class="choice"><input type="radio" name="ancestry" value="${id}" ${state.ancestry===id?'checked':''}><strong>${esc(a.name)}</strong><p class="subtle">${esc(a.feature)}</p></label>`).join('')}</div>`;
 if(state.ancestry==='half-elf')html+=select('farsight','Choose your Farsight bonus',[{value:'ranged',label:'+1 ranged attacks'},{value:'spell',label:'+1 spellcasting checks'}],state.farsight||'ranged');
 if(state.ancestry==='mutant')html+=mutationForm();
 html+=actions('Choose class',!!state.ancestry);}
 if(step===4){html=intro(4,'Choose a class','Primary stats guide your choice; low scores do not prevent you from choosing a class.')+`<div class="choices">${Object.entries(R.classes).filter(([,c])=>!c.homebrew||state.mode==='HOMEBREW').map(([id,c])=>`<label class="choice"><input type="radio" name="class" value="${id}" ${state.classId===id?'checked':''}><strong>${esc(c.name)}</strong><p class="subtle">Primary: ${esc(c.primary)}<br>${(c.primary.match(/STR|DEX|CON|INT|WIS|CHA/g)||[]).map(s=>`${s} ${d.scores[s]} (${E.signed(d.mods[s])})`).join(' · ')}<br>Hit die: d${c.die}</p></label>`).join('')}</div>`;
 if(c)html+=classForm(c,d);
 html+=actions('Roll talents',!!c);}
 if(step===5){const count=state.ancestry==='human'?2:1,pending=state.talents.find(t=>!t.resolved);html=intro(5,'Roll class talents',`Roll 2d6 on the ${esc(c.name)} talent table. ${count===2?'Humans receive two talent rolls.':'You receive one talent roll.'}`)+state.talents.map((t,i)=>`<div class="talent ${t.resolved?'applied':''}"><p class="kicker">Talent ${i+1} · 2d6 = ${t.roll}</p><strong>${esc(t.resolved?t.description:t.label)}</strong>${t.history.filter(h=>!h.accepted).map(h=>`<p class="subtle">${h.dice.join(' + ')} = ${h.total}: required reroll (${esc(h.reason)}).</p>`).join('')}</div>`).join('');
 if(pending)html+=talentForm(pending,c,d);
 else if(state.talents.length<count)html+='<button id="roll-talent">Roll talent · 2d6</button>';
 html+=`<details><summary>View this class’s talent table</summary><ul>${c.talents.map(t=>`<li>${t.min===t.max?t.min:t.min+'–'+t.max}: ${esc(t.label)}${t.rerollLevelOne?' (reroll at level 1)':''}</li>`).join('')}</ul></details>`+actions('Roll hit points',state.talents.length===count&&!pending);}
 if(step===6){html=intro(6,'Roll hit points',`Roll d${c.die}${state.ancestry==='dwarf'?' twice and keep the higher roll':''}. Add the die maximum, divide by 2 and round up, then apply CON${state.ancestry==='dwarf'?' and +2 for dwarf':''}.`)+`<button id="roll-hp">${state.hpRolls?'Reroll':'Roll'} hit points · ${state.ancestry==='dwarf'?'2 × ':''}d${c.die}</button>`;
 if(d.hp)html+=`<div class="result"><p class="kicker">Starting hit points</p><div class="roll-value">${d.hp.total} HP</div><p>Rolled ${d.hp.rolls.join(' and ')}${state.ancestry==='dwarf'?'; kept '+d.hp.kept:''}.<br>ceil((${d.hp.kept} + ${c.die}) / 2) = ${d.hp.base}<br>CON ${E.signed(d.hp.con)}${d.hp.dwarfBonus?' · Dwarf +2':''}${d.hp.mutationBonus?' · Mutation '+E.signed(d.hp.mutationBonus):''}<br>Minimum final HP: ${d.hp.minimum}</p></div>`;
 html+=actions('Choose alignment',!!state.hpRolls);}
 if(step===7){html=intro(7,'Choose an alignment',c.alignment?`${c.name} must be ${c.alignment.toLowerCase()}, according to your class rules.`:'Choose Lawful, Neutral, or Chaotic.')+select('alignment','Alignment',c.alignment?[c.alignment]:['Lawful','Neutral','Chaotic'],state.alignment||c.alignment||'Neutral')+textField('character-name','Character name (optional)',state.name,'maxlength="100"')+actions('Finish character');}
 if(step===8)html=`<div class="summary-heading"><h2>Your character</h2><span class="badge">LEVEL 1 · ${state.mode}</span></div><p class="subtle no-print">Your character is ready. Save the summary or print it to PDF.</p><div class="actions no-print"><button id="download-text">Save text</button><button id="download-json" class="quiet">Save JSON</button><button id="print" class="quiet">Print / PDF</button></div><pre class="sheet">${esc(E.summary(state))}</pre><div class="actions no-print"><button id="back" class="quiet">← Edit alignment / name</button><button id="new-character">New character</button></div>`;
 $('workspace').innerHTML=html;
 if(focus)$('workspace').querySelector('h2')?.focus();
}
function mutationForm(){const m=state.mutation;return `<p class="subtle">Roll 1d20 on your mutant ability table.</p><button id="roll-mutation">${m?'Reroll':'Roll'} mutation · d20</button>${m?`<div class="result"><p class="kicker">Mutation roll: ${m.roll}</p><h3>${esc(m.name)}</h3><p>${esc(m.description)}</p></div>${m.choices?select('mutation-choice','Choose the ability that gains +2',[{value:'',label:'Choose STR or CON…'},...m.choices],m.choice||''):''}<p class="subtle">Stat, AC, attack, HP, and inventory bonuses apply automatically. Other features are recorded on your character.</p>`:''}`;}
function classForm(c,d){const ch=state.classChoices;let html=`<div class="callout"><strong>${esc(c.name)}</strong><p class="subtle">Weapons: ${esc(c.weapons)}<br>Armor: ${esc(c.armor.join(', ')||'None')}${c.shield?'; shields':''}</p><ul>${c.features.map(f=>`<li>${esc(f)}</li>`).join('')}</ul></div>`;
 if(state.classId==='fighter')html+=select('mastery','Weapon Mastery: choose a weapon',R.weapons,ch.mastery||'Longsword')+select('grit','Grit: choose your ability',['STR','DEX'],ch.grit||'STR');
 if(state.classId==='ranger')html+=select('style','Fighting style',[{value:'bows',label:'+1 attack with bows'},{value:'axes',label:'+1 attack with axes and daggers'}],ch.style||'bows');
 if(state.classId==='bard')html+=select('bard-background','Bard’s additional background',['Scholar','Actor'],ch.bardBackground||'Scholar')+'<p class="subtle">You keep your rolled campaign background and also receive Entertainer and the selected bard background. Repeated backgrounds are counted once.</p>';
 if(c.cultures)html+=select('culture','Required cultural origin',c.cultures,ch.culture||c.cultures[0])+`<p class="subtle">This is a cultural origin alongside your chosen ancestry.${state.classId==='shaman'?' Your character comes from a remote tribe.':''}</p>`;
 if(c.spells){html+=`<h3>Starting spells</h3><p class="subtle">Choose ${c.spells} different tier 1 ${esc(c.name)} spell${c.spells>1?'s':''}.${state.classId==='priest'?' Turn Undead is included separately.':''}</p>`;
 for(let i=0;i<c.spells;i++)html+=c.spellList?select('spell-'+i,`Spell ${i+1}`,[{value:'',label:'Choose a spell…'},...c.spellList],ch.spells?.[i]||''):textField('spell-'+i,`Spell ${i+1}: enter a name from your class spell list`,ch.spells?.[i]||'','maxlength="100"');
 }
 return html;
}
function talentForm(t,c,d){let row=c.talents.find(r=>r.min===t.rowMin);let html='<div class="callout"><h3>Resolve your talent</h3>';
 if(row.id==='free'){
  const choices=[{value:'distribute',label:'Distribute +2 points among stats'},...c.talents.filter(r=>r.id!=='free'&&E.talentAllowed(r,state)).map(r=>({value:String(r.min),label:r.label}))];
  if(!choices.some(x=>x.value===freeSelection))freeSelection='distribute';
  html+=select('free-selection','Choose the result you want',choices,freeSelection);
  row=freeSelection==='distribute'?{id:'distribute'}:c.talents.find(r=>r.min===Number(freeSelection));
 }
 html+=talentControls(row,c,d)+'</div><button id="apply-talent">Apply talent</button>';
 return html;
}
function talentControls(row,c,d){let html='';
 if(row.id==='stats')html+=select('talent-stat','Increase one stat by 2',row.choices,row.choices[0]);
 if(row.id==='distribute')html+=`<p class="subtle">Assign each point separately. You may put both in the same stat.</p><div class="two">${select('talent-point-1','First +1 point',R.statNames,'STR')}${select('talent-point-2','Second +1 point',R.statNames,'STR')}</div>`;
 if(row.id==='attack-choice')html+=select('talent-choice','Choose the attack bonus',[{value:'melee',label:'+1 melee attacks'},{value:'ranged',label:'+1 ranged attacks'}],'melee');
 if(row.id==='wizard-choice')html+=select('talent-choice','Choose the improvement',[{value:'stat:INT',label:'+2 INT'},{value:'spell',label:'+1 wizard spellcasting'}],'stat:INT');
 if(row.id==='barbarian-choice')html+=select('talent-choice','Choose the improvement',[{value:'stat:STR',label:'+2 STR'},{value:'stat:CON',label:'+2 CON'},{value:'melee',label:'+1 melee attacks'}],'stat:STR');
 if(row.id==='armor')html+=select('talent-detail','Armor type receiving +1 AC',c.armor,c.armor[0]);
 if(row.id==='mastery')html+=select('talent-detail','Choose an additional weapon type',R.weapons.filter(w=>!d.fx.masteries.includes(w)),'');
 if(row.id==='spell-advantage')html+=select('talent-detail','Which known spell gains advantage?',d.spells,d.spells[0]);
 if(row.id==='extra-spell'){
  const choices=(c.spellList||[]).filter(s=>!d.spells.some(k=>k.toLowerCase()===s.toLowerCase()));
  html+=c.spellList?select('talent-detail','Choose an additional tier 1 spell',choices,choices[0]):textField('talent-detail','Additional tier 1 wizard spell (not already known)','','maxlength="100"');
 }
 if(row.id==='magic-item')html+=textField('talent-detail','Choose the magic item type (e.g. weapon, wand, ring)','','maxlength="100"')+'<p class="subtle">The supplied documents contain no random magic item table. The GM determines the item and its properties.</p>';
 if(row.id==='superstition')html+=textField('talent-detail','Additional magic item type you will accept','','maxlength="100"');
 if(row.id==='rage-choice')html+=select('talent-choice','Choose your Rage improvement',[{value:'uses',label:'+1 daily Rage use'},{value:'die',label:'Increase Rage damage die one step'}],'uses');
 if(row.id==='shaman-wis')html+='<p>Wisdom increases by 2.</p>';
 if(!html)html=`<p>${esc(row.label)}</p>`;
 return html;
}
function requireValue(id,message){const value=$(id)?.value.trim();if(!value)throw new Error(message);return value;}
function applyTalent(){const t=state.talents.find(x=>!x.resolved),c=R.classes[state.classId];let row=c.talents.find(r=>r.min===t.rowMin);
 if(row.id==='free'){const choice=$('free-selection').value;row=choice==='distribute'?{id:'distribute',label:'Distribute +2 stat points'}:c.talents.find(r=>r.min===Number(choice));if(row.id!=='distribute'&&!E.talentAllowed(row,state))throw new Error('This talent requires a reroll; choose another result.');}
 const data={key:row.id,stats:{},choice:'',detail:'',description:row.label};
 if(row.id==='stats'){const s=$('talent-stat').value;data.stats[s]=2;data.description=`+2 ${s}`;}
 if(row.id==='distribute'){for(const id of ['talent-point-1','talent-point-2']){const s=$(id).value;data.stats[s]=(data.stats[s]||0)+1;}data.description=Object.entries(data.stats).map(([s,n])=>`+${n} ${s}`).join(', ');}
 if(row.id==='shaman-wis'){data.stats.WIS=2;data.description='+2 WIS';}
 if(['attack-choice','wizard-choice','barbarian-choice','rage-choice'].includes(row.id)){data.choice=$('talent-choice').value;if(data.choice.startsWith('stat:')){const s=data.choice.split(':')[1];data.stats[s]=2;data.description=`+2 ${s}`;}else data.description={melee:'+1 melee attacks',ranged:'+1 ranged attacks',spell:'+1 spellcasting checks',uses:'+1 daily Rage use',die:'Increase Rage damage die one step'}[data.choice];}
 if(['armor','mastery','spell-advantage','extra-spell','magic-item','superstition'].includes(row.id)){
  data.detail=requireValue('talent-detail','Enter or choose the target of this talent.');
  if(row.id==='extra-spell'&&E.derive(state).spells.some(s=>s.toLowerCase()===data.detail.toLowerCase()))throw new Error('That spell is already known. Choose a different spell.');
  data.description={armor:`+1 AC with ${data.detail}`,mastery:`Weapon Mastery: ${data.detail}`, 'spell-advantage':`Advantage casting ${data.detail}`,'extra-spell':`Learn ${data.detail}`,'magic-item':`Random magic item of type ${data.detail} (GM determines item)`,superstition:`Accept magic ${data.detail}`}[row.id];
 }
 Object.assign(t,data,{resolved:true});state.hpRolls=null;freeSelection='distribute';render();
}
function next(){
 if(step===0){const mode=document.querySelector('input[name=mode]:checked').value;if(state.mode!==mode){invalidate(0);state.mode=mode;}}
 if(step===1&&!state.bgRoll)throw new Error('Roll a background first.');
 if(step===2){if(!state.statRoll)throw new Error('Roll your stats first.');if(!E.eligibleBackground(T.backgrounds[state.bgRoll-1],E.derive(state).scores)&&!$('background-override')?.checked)throw new Error('This background requires GM approval, or a background reroll.');}
 if(step===3){if(!state.ancestry)throw new Error('Choose an ancestry.');
  if(state.ancestry==='half-elf'){const f=$('farsight').value;if(state.farsight!==f){invalidate(3);state.farsight=f;}}
  if(state.ancestry==='mutant'){
   if(!state.mutation)throw new Error('Roll a mutation first.');
   if(state.mutation.choices&&!state.mutation.choice)throw new Error('Choose STR or CON for Unusual Size.');
  }
 }
 if(step===4){const c=R.classes[state.classId];if(!c)throw new Error('Choose a class.');const ch={};
  if(state.classId==='fighter'){ch.mastery=$('mastery').value;ch.grit=$('grit').value;}
  if(state.classId==='ranger')ch.style=$('style').value;
  if(state.classId==='bard'){ch.bardBackground=$('bard-background').value;if(ch.bardBackground==='Actor'&&E.derive(state).scores.CHA<12)throw new Error('Actor requires CHA 12+. Choose Scholar.');}
  if(c.cultures)ch.culture=$('culture').value;
  if(c.spells){ch.spells=Array.from({length:c.spells},(_,i)=>requireValue('spell-'+i,`Choose or enter spell ${i+1}.`));const normalized=ch.spells.map(s=>s.toLowerCase());if(new Set(normalized).size!==c.spells||state.classId==='priest'&&normalized.includes('turn undead'))throw new Error('Choose different spells; Turn Undead is added automatically for priests.');}
  if(JSON.stringify(ch)!==JSON.stringify(state.classChoices)){invalidate(4);state.classChoices=ch;}
 }
 if(step===5){const count=state.ancestry==='human'?2:1;if(state.talents.length!==count||state.talents.some(t=>!t.resolved))throw new Error('Roll and apply all required talents.');}
 if(step===6&&!state.hpRolls)throw new Error('Roll hit points first.');
 if(step===7){state.alignment=$('alignment').value;state.name=$('character-name').value.trim();}
 step++;render(true);
}
function save(kind){const name=(state.name||'shadowdark-character').replace(/[^a-z0-9_-]+/gi,'-').replace(/^-+|-+$/g,'').slice(0,70)||'shadowdark-character';const d=E.derive(state);const content=kind==='json'?JSON.stringify({schemaVersion:1,character:state,derived:d,summary:E.summary(state)},null,2):E.summary(state);const blob=new Blob([content],{type:kind==='json'?'application/json':'text/plain;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name+'.'+(kind==='json'?'json':'txt');document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);}
function restart(){if(step>0&&!window.confirm('Start a new character? Save the current character first if you want to keep it.'))return;state=fresh();step=0;freeSelection='distribute';render(true);}
$('restart').addEventListener('click',restart);
$('workspace').addEventListener('change',event=>{try{
 const el=event.target;
 if(el.name==='ancestry'){if(state.ancestry!==el.value){invalidate(2);state.ancestry=el.value;}render();document.querySelector('input[name=ancestry]:checked')?.focus?.();}
 if(el.name==='class'){if(state.classId!==el.value){invalidate(3);state.classId=el.value;}render();document.querySelector('input[name=class]:checked')?.focus?.();}
 if(el.id==='mutation-choice'){const roll=state.mutation.roll;invalidate(3);state.mutation=E.getMutation(roll,el.value||null);render();$('mutation-choice')?.focus?.();}
 if(el.id==='free-selection'){freeSelection=el.value;render();$('free-selection')?.focus?.();}
}catch(error){$('error').textContent=error.message;}});
$('workspace').addEventListener('click',event=>{const id=event.target.closest('button')?.id;if(!id)return;try{
 if(id==='next')next();
 if(id==='back'){step--;render(true);}
 if(id==='roll-background'){invalidate(1);state.bgRoll=E.rollDie(40);render();}
 if(id==='roll-stats'){invalidate(2);state.statRoll=E.rollDie(400);render();}
 if(id==='roll-mutation'){invalidate(3);state.mutation=E.getMutation(E.rollDie(20));render();}
 if(id==='roll-talent'){state.talents.push(E.rollTalent(state));freeSelection='distribute';render();}
 if(id==='apply-talent')applyTalent();
 if(id==='roll-hp'){state.hpRolls=Array.from({length:state.ancestry==='dwarf'?2:1},()=>E.rollDie(R.classes[state.classId].die));render();}
 if(id==='download-text')save('text');
 if(id==='download-json')save('json');
 if(id==='print')window.print();
 if(id==='new-character')restart();
}catch(error){$('error').textContent=error.message;}});
render();
})();
