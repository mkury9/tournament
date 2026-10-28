const STORAGE_KEY = "turnajplanner_tournaments_v5";
const CURRENT_KEY = "turnajplanner_current_v5";

function loadTournaments() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) return JSON.parse(raw);
        for (const k of ["turnajplanner_tournaments_v4","turnajplanner_tournaments_v3","turnajplanner_tournaments"]) {
            const r = localStorage.getItem(k);
            if (r) return JSON.parse(r);
        }
    } catch (e) {}
    return [];
}

function saveTournaments(list) { localStorage.setItem(STORAGE_KEY, JSON.stringify(list)); }
function loadCurrentId() { return localStorage.getItem(CURRENT_KEY) || localStorage.getItem("turnajplanner_current_v4") || localStorage.getItem("turnajplanner_current"); }
function setCurrentId(id) { localStorage.setItem(CURRENT_KEY, id); }
function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 8); }

const COUNTRIES = ["Česko","Slovensko","Německo","Rakousko","Polsko","Maďarsko","Francie","Itálie","Španělsko","Velká Británie","USA","Kanada","Rusko","Švédsko","Finsko","Norsko","Dánsko","Švýcarsko","Nizozemsko","Belgie"];

let state = { view: "home", tournaments: loadTournaments(), currentId: loadCurrentId(), wizard: { step: 1, name: "", date: "", location: "", division: "" }, tournamentTab: "general" };

function getCurrent(){ return state.tournaments.find(t=>t.id===state.currentId)||null; }
function saveCurrent(t){ const idx = state.tournaments.findIndex(x=>x.id===t.id); if(idx>=0) state.tournaments[idx]=t; else state.tournaments.push(t); saveTournaments(state.tournaments); }
function navigate(v){ state.view=v; render(); }
function escapeHtml(s){ if(s==null)return ""; return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function escapeAttr(s){ return escapeHtml(s).replace(/"/g,"&quot;"); }

function render(){
    const app = document.getElementById("app"); if(!app)return;
    if(state.view==="home"){ app.innerHTML=renderHome(); attachHomeEvents(); }
    else if(state.view==="wizard"){ app.innerHTML=renderWizard(); attachWizardEvents(); }
    else if(state.view==="tournament"){ app.innerHTML=renderTournament(); attachTournamentEvents(); }
}

function renderHome(){
    const list = state.tournaments.slice().sort((a,b)=>(b.createdAt||0)-(a.createdAt||0));
    return `<div class="min-h-screen">
        <header class="bg-white border-b border-gray-200"><div class="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between"><h1 class="text-xl font-semibold">TurnajPlanner</h1><button id="btn-new" class="bg-blue-600 text-white px-4 py-2 rounded">New Tournament</button></div></header>
        <main class="max-w-5xl mx-auto px-6 py-8"><h2 class="text-lg font-medium mb-4">Historie turnajů</h2>
        ${list.length===0?`<div class="text-gray-500">Zatím žádné turnaje.</div>`:`<div class="bg-white border border-gray-200 rounded divide-y">${list.map(t=>`<button data-open="${escapeAttr(t.id)}" class="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center justify-between"><div><div class="font-medium">${escapeHtml(t.name)}</div><div class="text-sm text-gray-500">${escapeHtml(t.date||"")} · ${escapeHtml(t.location||"")} · ${escapeHtml(t.division||"")}</div></div><div class="text-gray-400">›</div></button>`).join("")}</div>`}
        </main></div>`;
}
function attachHomeEvents(){ const be=document.getElementById("btn-export"); if(be){ be.onclick=()=>{ try{ const data=JSON.stringify(loadTournaments(),null,2); const blob=new Blob([data],{type:"application/json"}); const url=URL.createObjectURL(blob); const a=document.createElement("a"); a.href=url; a.download="turnajplanner-export.json"; a.click(); URL.revokeObjectURL(url); }catch(e){alert(e.message);} }; } const bi=document.getElementById("btn-import"); if(bi){ bi.onchange=(e)=>{ const file=e.target.files[0]; if(!file)return; const reader=new FileReader(); reader.onload=()=>{ try{ const arr=JSON.parse(reader.result); if(Array.isArray(arr)){ const cur=loadTournaments(); const merged=[...arr,...cur]; const uniq=[]; const seen=new Set(); for(const x of merged){ if(!x||!x.id) continue; if(seen.has(x.id)) continue; seen.add(x.id); uniq.push(x); } localStorage.setItem(STORAGE_KEY,JSON.stringify(uniq)); alert("Importováno"); location.reload(); } }catch(ex){alert("Chyba importu");} }; reader.readAsText(file); }; } const b=document.getElementById("btn-new"); if(b) b.onclick=()=>{ state.wizard={step:1,name:"",date:"",location:"",division:""}; navigate("wizard"); }; document.querySelectorAll("[data-open]").forEach(btn=>{ btn.onclick=()=>{ const id=btn.getAttribute("data-open"); setCurrentId(id); state.currentId=id; state.tournamentTab="general"; navigate("tournament"); }; }); }

function renderWizard(){
    const w=state.wizard;
    if(w.step===1){ return `<div class="min-h-screen flex items-center justify-center"><div class="bg-white border border-gray-200 rounded w-full max-w-md p-6"><h1 class="text-lg font-semibold mb-4">Nový turnaj</h1><label class="block text-sm mb-1">Název turnaje</label><input id="w-name" class="w-full border rounded px-3 py-2 mb-3" value="${escapeAttr(w.name)}"><label class="block text-sm mb-1">Datum</label><input id="w-date" type="date" class="w-full border rounded px-3 py-2 mb-3" value="${escapeAttr(w.date)}"><div class="flex justify-end gap-2"><button id="w-cancel" class="px-3 py-2 rounded border">Zrušit</button><button id="w-next" class="px-3 py-2 rounded bg-blue-600 text-white">Další</button></div></div></div>`; }
    if(w.step===2){ return `<div class="min-h-screen flex items-center justify-center"><div class="bg-white border border-gray-200 rounded w-full max-w-md p-6"><h1 class="text-lg font-semibold mb-4">Místo konání</h1><label class="block text-sm mb-1">Lokace</label><input id="w-location" class="w-full border rounded px-3 py-2 mb-3" value="${escapeAttr(w.location)}"><div class="flex justify-end gap-2"><button id="w-back" class="px-3 py-2 rounded border">Zpět</button><button id="w-next" class="px-3 py-2 rounded bg-blue-600 text-white">Další</button></div></div></div>`; }
    return `<div class="min-h-screen flex items-center justify-center"><div class="bg-white border border-gray-200 rounded w-full max-w-md p-6"><h1 class="text-lg font-semibold mb-4">Divize / kategorie</h1><label class="block text-sm mb-1">Divize</label><input id="w-division" class="w-full border rounded px-3 py-2 mb-3" value="${escapeAttr(w.division)}"><div class="flex justify-end gap-2"><button id="w-back" class="px-3 py-2 rounded border">Zpět</button><button id="w-create" class="px-3 py-2 rounded bg-green-600 text-white">Vytvořit turnaj</button></div></div></div>`;
}
function attachWizardEvents(){
    const w=state.wizard;
    if(w.step===1){ document.getElementById("w-cancel").onclick=()=>navigate("home"); document.getElementById("w-next").onclick=()=>{ state.wizard.name=document.getElementById("w-name").value.trim(); state.wizard.date=document.getElementById("w-date").value; if(!state.wizard.name){alert("Zadej název");return;} state.wizard.step=2; render(); }; }
    else if(w.step===2){ document.getElementById("w-back").onclick=()=>{state.wizard.step=1;render();}; document.getElementById("w-next").onclick=()=>{ state.wizard.location=document.getElementById("w-location").value.trim(); state.wizard.step=3; render(); }; }
    else { document.getElementById("w-back").onclick=()=>{state.wizard.step=2;render();}; document.getElementById("w-create").onclick=()=>{ state.wizard.division=document.getElementById("w-division").value.trim(); const t={id:uid(),name:state.wizard.name,date:state.wizard.date,location:state.wizard.location,division:state.wizard.division,language:"cs",createdAt:Date.now(),participants:{show:{logo:true,players:false,country:true,dressingRoom:true,name:true},playersConfig:{name:true,dob:false,number:false}},teams:[],format:{type:"groups_only",groupsCount:2,teamsPerGroup:4,advanceCount:2},groups:[],bracket:{matches:[]},fields:[],schedule:[],scheduleConfig:{matchDuration:60,gapDuration:10},scheduleMap:{},results:{},standings:{}}; saveCurrent(t); setCurrentId(t.id); state.currentId=t.id; state.tournamentTab="general"; navigate("tournament"); }; }
}

function renderTournament(){
    const t=getCurrent(); if(!t){navigate("home");return"";}
    const tabs=[{id:"general",label:"General"},{id:"participants",label:"Participants"},{id:"format",label:"Format"},{id:"schedule",label:"Schedule"},{id:"presentation",label:"Presentation"},{id:"results",label:"Results"}];
    return `<div class="min-h-screen"><header class="bg-white border-b border-gray-200"><div class="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between"><div class="flex items-center gap-4"><button id="t-home" class="text-blue-600 hover:underline">← Zpět na přehled</button><div><div class="font-semibold">${escapeHtml(t.name)}</div><div class="text-xs text-gray-500">${escapeHtml(t.date||"")} · ${escapeHtml(t.location||"")} · ${escapeHtml(t.division||"")}</div></div></div></div></header><div class="max-w-7xl mx-auto px-6 py-4 flex gap-2 flex-wrap">${tabs.map(tab=>`<button data-tab="${escapeAttr(tab.id)}" class="px-3 py-1.5 rounded ${state.tournamentTab===tab.id?"bg-blue-600 text-white":"border bg-white"}">${tab.label}</button>`).join("")}</div><main class="max-w-7xl mx-auto px-6 pb-10">${renderTournamentTab(t)}</main></div>`;
}
function renderTournamentTab(t){
    if(state.tournamentTab==="general"){ return `<div class="bg-white border border-gray-200 rounded p-4"><h2 class="font-medium mb-3">General</h2><div class="grid grid-cols-1 md:grid-cols-2 gap-3"><div><label class="text-sm">Název turnaje</label><input id="g-name" class="w-full border rounded px-2 py-1.5" value="${escapeAttr(t.name)}"></div><div><label class="text-sm">Datum</label><input id="g-date" type="date" class="w-full border rounded px-2 py-1.5" value="${escapeAttr(t.date||"")}"></div><div><label class="text-sm">Lokace</label><input id="g-location" class="w-full border rounded px-2 py-1.5" value="${escapeAttr(t.location||"")}"></div><div><label class="text-sm">Divize</label><input id="g-division" class="w-full border rounded px-2 py-1.5" value="${escapeAttr(t.division||"")}"></div><div><label class="text-sm">Jazyk</label><select id="g-lang" class="w-full border rounded px-2 py-1.5"><option value="cs" ${t.language==="cs"?"selected":""}>Čeština</option><option value="de" ${t.language==="de"?"selected":""}>Němčina</option><option value="en" ${t.language==="en"?"selected":""}>Angličtina</option></select></div></div><div class="mt-3"><button id="g-save" class="bg-blue-600 text-white px-3 py-1.5 rounded">Uložit</button></div></div>`; }
    if(state.tournamentTab==="participants") return renderParticipants(t);
    if(state.tournamentTab==="format") return renderFormat(t);
    if(state.tournamentTab==="schedule") return renderSchedule(t);
    if(state.tournamentTab==="results") return `<div class="flex flex-col gap-4"><div class="bg-white border border-gray-200 rounded p-4"><h2 class="font-medium mb-2">Výsledky zápasů</h2><div id="results-matches" class="flex flex-col gap-2"></div></div><div class="bg-white border border-gray-200 rounded p-4"><h2 class="font-medium mb-2">Tabulky</h2><div id="standings-list" class="flex flex-col gap-3"></div></div></div>`;
    return `<div class="bg-white border border-gray-200 rounded p-4 text-gray-500">Presentation - zatím prázdné</div>`;
}

function renderParticipants(t){
    if(!t.participants) t.participants={show:{logo:true,players:false,country:true,dressingRoom:true,name:true},playersConfig:{name:true,dob:false,number:false}};
    const show=t.participants.show, pcfg=t.participants.playersConfig;
    return `<div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div class="bg-white border border-gray-200 rounded p-4 lg:col-span-1"><h2 class="font-medium mb-2">Zobrazená pole</h2>
            <label class="flex items-center gap-2 text-sm mb-1"><input type="checkbox" data-pshow="logo" ${show.logo?"checked":""}> Logo</label>
            <label class="flex items-center gap-2 text-sm mb-1"><input type="checkbox" data-pshow="players" ${show.players?"checked":""}> Players</label>
            <label class="flex items-center gap-2 text-sm mb-1"><input type="checkbox" data-pshow="country" ${show.country?"checked":""}> Country</label>
            <label class="flex items-center gap-2 text-sm mb-1"><input type="checkbox" data-pshow="dressingRoom" ${show.dressingRoom?"checked":""}> Dressing room</label>
            <label class="flex items-center gap-2 text-sm mb-3"><input type="checkbox" data-pshow="name" ${show.name?"checked":""}> Název týmu</label>
            <div class="${show.players?"":"hidden"}"><div class="text-sm font-medium mb-1">Players konfigurace</div>
                <label class="flex items-center gap-2 text-sm mb-1"><input type="checkbox" data-pcfg="name" ${pcfg.name?"checked":""}> Jméno</label>
                <label class="flex items-center gap-2 text-sm mb-1"><input type="checkbox" data-pcfg="dob" ${pcfg.dob?"checked":""}> Date of birth</label>
                <label class="flex items-center gap-2 text-sm mb-1"><input type="checkbox" data-pcfg="number" ${pcfg.number?"checked":""}> Number</label>
            </div>
        </div>
        <div class="bg-white border border-gray-200 rounded p-4 lg:col-span-2"><div class="flex items-center justify-between mb-3"><h2 class="font-medium">Týmy</h2><div class="flex gap-2"><button id="team-add-single" class="px-2 py-1 border rounded text-sm">Přidat jeden tým</button><button id="team-add-multi" class="px-2 py-1 border rounded text-sm">Přidat více týmů</button></div></div>
            <div id="team-multi" class="hidden mb-3"><textarea id="team-multi-text" class="w-full border rounded px-2 py-1.5 h-28"></textarea><button id="team-multi-create" class="mt-2 px-2 py-1 bg-blue-600 text-white rounded text-sm">Vytvořit týmy</button></div>
            <div class="overflow-auto"><table class="w-full text-sm"><thead><tr class="text-left border-b"><th class="py-1">Název týmu</th>${show.country?`<th>Country</th>`:""}${show.logo?`<th>Logo</th>`:""}${show.dressingRoom?`<th>Dressing room</th>`:""}<th></th></tr></thead><tbody>${(t.teams||[]).map((team,idx)=>`<tr class="border-b"><td class="py-1">${escapeHtml(team.name)}</td>${show.country?`<td>${escapeHtml(team.country||"")}</td>`:""}${show.logo?`<td>${team.logo?`<img src="${escapeAttr(team.logo)}" class="h-6 object-contain">`:"-"}</td>`:""}${show.dressingRoom?`<td>${escapeHtml(team.dressingRoom||"")}</td>`:""}<td class="text-right"><button data-team-edit="${idx}" class="text-blue-600">Edit</button></td></tr>`).join("")}</tbody></table>${(t.teams||[]).length===0?`<div class="text-gray-500 py-2">Žádné týmy</div>`:""}</div>
        </div>
    </div>
    <div id="team-modal" class="hidden fixed inset-0 bg-black/40 flex items-center justify-center z-50"><div class="bg-white rounded w-full max-w-md p-4"><h3 class="font-medium mb-2" id="team-modal-title">Přidat tým</h3><label class="block text-sm mb-1">Název týmu</label><input id="tm-name" class="w-full border rounded px-2 py-1.5 mb-2"><label class="block text-sm mb-1">Country</label><select id="tm-country" class="w-full border rounded px-2 py-1.5 mb-2"><option value="">-- země --</option>${COUNTRIES.map(c=>`<option value="${escapeAttr(c)}">${escapeHtml(c)}</option>`).join("")}</select><label class="block text-sm mb-1">Dressing room</label><input id="tm-room" class="w-full border rounded px-2 py-1.5 mb-2"><label class="block text-sm mb-1">Logo (URL)</label><input id="tm-logo" class="w-full border rounded px-2 py-1.5 mb-3"><div class="flex justify-end gap-2"><button id="tm-cancel" class="px-2 py-1 border rounded">Zrušit</button><button id="tm-save" class="px-2 py-1 bg-blue-600 text-white rounded">Uložit</button></div></div></div>`;
}

function attachParticipantsEvents(t){
    if(!t.participants) t.participants={show:{logo:true,players:false,country:true,dressingRoom:true,name:true},playersConfig:{name:true,dob:false,number:false}};
    document.querySelectorAll("[data-pshow]").forEach(cb=>{ cb.onchange=()=>{t.participants.show[cb.getAttribute("data-pshow")]=cb.checked; saveCurrent(t); render();}; });
    document.querySelectorAll("[data-pcfg]").forEach(cb=>{ cb.onchange=()=>{t.participants.playersConfig[cb.getAttribute("data-pcfg")]=cb.checked; saveCurrent(t); render();}; });
    document.getElementById("team-add-single").onclick=()=>openTeamModal(t,null);
    document.getElementById("team-add-multi").onclick=()=>{ const el=document.getElementById("team-multi"); if(el) el.classList.toggle("hidden"); };
    document.getElementById("team-multi-create").onclick=()=>{ const te=document.getElementById("team-multi-text"); if(!te)return; const lines=te.value.split(/\n/).map(x=>x.trim()).filter(x=>x); if(!lines.length)return; t.teams=t.teams||[]; for(const name of lines) t.teams.push({id:uid(),name,country:"",dressingRoom:"",logo:"",players:[]}); saveCurrent(t); te.value=""; const el=document.getElementById("team-multi"); if(el) el.classList.add("hidden"); render(); };
    document.querySelectorAll("[data-team-edit]").forEach(btn=>{ btn.onclick=()=>openTeamModal(t,parseInt(btn.getAttribute("data-team-edit"))); });
}
function openTeamModal(t,idx){
    const modal=document.getElementById("team-modal"), title=document.getElementById("team-modal-title"), name=document.getElementById("tm-name"), country=document.getElementById("tm-country"), room=document.getElementById("tm-room"), logo=document.getElementById("tm-logo");
    if(!modal)return; modal.classList.remove("hidden"); if(title) title.textContent = idx===null?"Přidat tým":"Edit team";
    if(idx===null){ if(name)name.value=""; if(country)country.value=""; if(room)room.value=""; if(logo)logo.value=""; document.getElementById("tm-save").onclick=()=>{ t.teams=t.teams||[]; t.teams.push({id:uid(),name:name&&name.value.trim()?name.value.trim():"Tým",country:country?country.value:"",dressingRoom:room?room.value.trim():"",logo:logo?logo.value.trim():"",players:[]}); saveCurrent(t); modal.classList.add("hidden"); render(); }; }
    else { const team=(t.teams||[])[idx]; if(!team){modal.classList.add("hidden");return;} if(name)name.value=team.name||""; if(country)country.value=team.country||""; if(room)room.value=team.dressingRoom||""; if(logo)logo.value=team.logo||""; document.getElementById("tm-save").onclick=()=>{ team.name=name&&name.value.trim()?name.value.trim():team.name; if(country)team.country=country.value; if(room)team.dressingRoom=room.value.trim(); if(logo)team.logo=logo.value.trim(); saveCurrent(t); modal.classList.add("hidden"); render(); }; }
    document.getElementById("tm-cancel").onclick=()=>modal.classList.add("hidden");
}

function renderFormat(t){
    if(!t.format) t.format={type:"groups_only",groupsCount:2,teamsPerGroup:4,advanceCount:2};
    if(!t.bracket) t.bracket={matches:[]};
    return `<div class="flex flex-col gap-4"><div class="bg-white border border-gray-200 rounded p-4"><h2 class="font-medium mb-2">Typ formátu</h2><div class="flex gap-6"><label class="flex items-center gap-2"><input type="radio" name="ftype" value="groups_only" ${t.format.type==="groups_only"?"checked":""}> Group phase only</label><label class="flex items-center gap-2"><input type="radio" name="ftype" value="groups_knockout" ${t.format.type==="groups_knockout"?"checked":""}> Group phase and knockout phase</label></div><div class="mt-3 ${t.format.type==="groups_knockout"?"":"hidden"}"><div class="flex flex-wrap gap-4 items-end"><div><div class="text-sm mb-1">Počet skupin</div><input id="f-gcount" type="number" min="1" class="w-20 border rounded px-2 py-1.5" value="${t.format.groupsCount||2}"></div><div><div class="text-sm mb-1">Počet týmů ve skupině</div><input id="f-tpg" type="number" min="1" class="w-20 border rounded px-2 py-1.5" value="${t.format.teamsPerGroup||4}"></div><div><div class="text-sm mb-1">Kolik postupuje</div><input id="f-adv" type="number" min="1" class="w-20 border rounded px-2 py-1.5" value="${t.format.advanceCount||2}"></div><button id="f-build" class="px-2 py-1 bg-blue-600 text-white rounded text-sm">Vytvořit skupiny</button></div></div><div class="mt-3 ${t.format.type==="groups_only"?"":"hidden"}"><div class="flex flex-wrap gap-4 items-end"><div><div class="text-sm mb-1">Počet skupin</div><input id="f-gcount2" type="number" min="1" class="w-20 border rounded px-2 py-1.5" value="${t.format.groupsCount||2}"></div><div><div class="text-sm mb-1">Počet týmů ve skupině</div><input id="f-tpg2" type="number" min="1" class="w-20 border rounded px-2 py-1.5" value="${t.format.teamsPerGroup||4}"></div><button id="f-build2" class="px-2 py-1 bg-blue-600 text-white rounded text-sm">Vytvořit skupiny</button></div></div></div><div class="grid grid-cols-1 lg:grid-cols-2 gap-4"><div class="bg-white border border-gray-200 rounded p-4"><h2 class="font-medium mb-2">Rozdělení do skupin</h2><div id="groups-list" class="flex flex-col gap-3"></div></div><div class="bg-white border border-gray-200 rounded p-4"><div class="flex items-center justify-between mb-2"><h2 class="font-medium">Knockout phase</h2><button id="bracket-add-pre" class="px-2 py-1 border rounded text-sm ${t.format.type==="groups_knockout"?"":"hidden"}">+ Přidat zápas před semifinále</button></div><div id="bracket-list" class="flex flex-col gap-2"></div><div id="bracket-empty" class="text-gray-500">Vytvoř skupiny a nastav počet postupujících.</div></div></div></div>`;
}
function attachFormatEvents(t){
    if(!t.format) t.format={type:"groups_only",groupsCount:2,teamsPerGroup:4,advanceCount:2};
    if(!t.bracket) t.bracket={matches:[]};
    document.querySelectorAll("input[name=ftype]").forEach(r=>{ r.onchange=()=>{t.format.type=r.value; saveCurrent(t); render();}; });
    const b1=document.getElementById("f-build"); if(b1) b1.onclick=()=>buildGroups(t,false);
    const b2=document.getElementById("f-build2"); if(b2) b2.onclick=()=>buildGroups(t,true);
    const ap=document.getElementById("bracket-add-pre"); if(ap) ap.onclick=()=>{ if(!t.bracket) t.bracket={matches:[]}; if(!t.bracket.matches) t.bracket.matches=[]; const slots=getGroupSlots(t); t.bracket.matches.push({id:uid(),name:"Předsemifinále",isPre:true,teams:[null,null],sources:[slots,slots]}); saveCurrent(t); render(); };
    renderGroups(t);
}
function getGroupSlots(t){ const slots=[]; (t.groups||[]).forEach(g=>{ for(let r=1;r<=(t.format&&t.format.advanceCount?t.format.advanceCount:2);r++){ slots.push({label:r+". "+g.name,value:"pos:"+r+":"+g.name}); } }); return slots; }
function buildGroups(t,onlyGroups){
    t.teams=t.teams||[]; if(t.teams.length===0){alert("Přidej týmy v Participants");return;}
    let gcount,tpg; if(onlyGroups){ const gc2=document.getElementById("f-gcount2"), tp2=document.getElementById("f-tpg2"); gcount=gc2?parseInt(gc2.value)||1:1; tpg=tp2?parseInt(tp2.value)||t.teams.length:t.teams.length; } else { const gc=document.getElementById("f-gcount"), tp=document.getElementById("f-tpg"), adv=document.getElementById("f-adv"); gcount=gc?parseInt(gc.value)||1:1; tpg=tp?parseInt(tp.value)||t.teams.length:t.teams.length; if(adv) t.format.advanceCount=parseInt(adv.value)||2; }
    t.format.groupsCount=gcount; t.format.teamsPerGroup=tpg; const groups=[]; for(let i=0;i<gcount;i++) groups.push({name:"Group "+String.fromCharCode(65+i),teams:Array(tpg).fill(null)}); t.groups=groups; if(!t.bracket) t.bracket={matches:[]}; if(t.format.type==="groups_knockout"){ const advance=t.format.advanceCount||2; const slots=[]; (t.groups||[]).forEach(g=>{ for(let r=1;r<=advance;r++) slots.push({label:r+". "+g.name,value:"pos:"+r+":"+g.name}); }); const matches=(t.bracket.matches||[]).filter(m=>m.isPre); if(slots.length>=4){ matches.push({id:uid(),name:"Semifinal 1",isSemi:true,teams:[null,null],sources:[slots,slots]}); matches.push({id:uid(),name:"Semifinal 2",isSemi:true,teams:[null,null],sources:[slots,slots]}); matches.push({id:uid(),name:"Final A",isFinal:true,teams:[null,null],sources:["Winner of semifinal 1","Winner of semifinal 2"]}); matches.push({id:uid(),name:"Final B",isFinal:true,teams:[null,null],sources:["Loser of semifinal 1","Loser of semifinal 2"]}); } else if(slots.length===2){ matches.push({id:uid(),name:"Final",isFinal:true,teams:[null,null],sources:[slots,slots]}); } t.bracket.matches=matches; } else { t.bracket.matches=[]; } saveCurrent(t); render();
}
function getUsedTeamIds(t){ const used=new Set(); (t.groups||[]).forEach(g=>{ (g.teams||[]).forEach(tid=>{ if(tid) used.add(tid); }); }); return used; }
function renderGroups(t){
    const list=document.getElementById("groups-list"); if(!list)return; const used=getUsedTeamIds(t);
    list.innerHTML=(t.groups||[]).map((g,gi)=>`<div class="border rounded p-2"><div class="font-medium mb-1">${escapeHtml(g.name)}</div><div class="flex flex-col gap-1">${(g.teams||[]).map((teamId,ti)=>`<select data-gsel="${gi}" data-gti="${ti}" class="border rounded px-2 py-1.5"><option value="">Empty spot</option>${(t.teams||[]).map(tm=>{ if(used.has(tm.id)&&teamId!==tm.id)return ""; return `<option value="${escapeAttr(tm.id)}" ${teamId===tm.id?"selected":""}>${escapeHtml(tm.name)}</option>`; }).join("")}</select>`).join("")}</div></div>`).join("");
    document.querySelectorAll("[data-gsel]").forEach(sel=>{ sel.onchange=()=>{ const gi=parseInt(sel.getAttribute("data-gsel")), ti=parseInt(sel.getAttribute("data-gti")); if(!t.groups[gi])return; t.groups[gi].teams[ti]=sel.value||null; saveCurrent(t); /*if(t.format&&t.format.type==="groups_knockout"){ buildGroups(t,false); } else { render(); }*/ render(); }; });
    if(t.format&&t.format.type==="groups_knockout"){ renderBracket(t); } else { renderBracket(t); }
}
function renderBracket(t){
    const list=document.getElementById("bracket-list"), empty=document.getElementById("bracket-empty"); if(!list)return;
    const matches=(t.bracket&&t.bracket.matches)?t.bracket.matches:[]; if(matches.length===0){ list.innerHTML=""; if(empty) empty.classList.remove("hidden"); return; } if(empty) empty.classList.add("hidden");
    const slots=getGroupSlots(t);
    list.innerHTML=matches.map((m,mi)=>{
        if(m.isFinal){ return `<div class="border rounded p-2"><div class="font-medium mb-1">${escapeHtml(m.name)}</div><div class="grid grid-cols-2 gap-2">${(m.teams||[null,null]).map((tid,ti)=>`<div><div class="text-xs text-gray-500 mb-1">${escapeHtml(m.sources[ti]||"")}</div><div class="border rounded px-2 py-1.5 bg-gray-50 text-gray-500">Automaticky</div></div>`).join("")}</div></div>`; }
        return `<div class="border rounded p-2"><div class="font-medium mb-1">${escapeHtml(m.name)}</div><div class="grid grid-cols-2 gap-2">${(m.teams||[null,null]).map((tid,ti)=>{ const src=m.sources&&m.sources[ti]; return `<div><div class="text-xs text-gray-500 mb-1">${Array.isArray(src)?"Zvol pozici":""}</div>${Array.isArray(src)?`<select data-bm="${mi}" data-bti="${ti}" class="w-full border rounded px-2 py-1.5"><option value="">-- vyber --</option>${src.map(s=>`<option value="${escapeAttr(s.value)}" ${tid===s.value?"selected":""}>${escapeHtml(s.label)}</option>`).join("")}</select>`:`<div class="border rounded px-2 py-1.5 bg-gray-50 text-gray-500">${escapeHtml(src||"")}</div>`}</div>`; }).join("")}</div></div>`;
    }).join("");
    document.querySelectorAll("[data-bm]").forEach(sel=>{ sel.onchange=()=>{ const mi=parseInt(sel.getAttribute("data-bm")), ti=parseInt(sel.getAttribute("data-bti")); if(!t.bracket||!t.bracket.matches[mi])return; t.bracket.matches[mi].teams[ti]=sel.value||null; saveCurrent(t); render(); }; });
}

function attachTournamentEvents(){
    const t=getCurrent(); if(!t)return;
    document.getElementById("t-home").onclick=()=>navigate("home");
    document.querySelectorAll("[data-tab]").forEach(btn=>{ btn.onclick=()=>{state.tournamentTab=btn.getAttribute("data-tab"); render();}; });
    if(state.tournamentTab==="general"){ document.getElementById("g-save").onclick=()=>{ const gname=document.getElementById("g-name"), gdate=document.getElementById("g-date"), gloc=document.getElementById("g-location"), gdiv=document.getElementById("g-division"), glang=document.getElementById("g-lang"); if(gname) t.name=gname.value.trim()||t.name; if(gdate) t.date=gdate.value; if(gloc) t.location=gloc.value.trim(); if(gdiv) t.division=gdiv.value.trim(); if(glang) t.language=glang.value; saveCurrent(t); alert("Uloženo"); render(); }; }
    else if(state.tournamentTab==="participants") attachParticipantsEvents(t);
    else if(state.tournamentTab==="format") attachFormatEvents(t);
    else if(state.tournamentTab==="schedule") attachScheduleEvents(t);
    else if(state.tournamentTab==="results"){ setTimeout(()=>fillResults(t),0); }
}

function renderSchedule(t){
    if(!t.scheduleMap) t.scheduleMap={};
    if(!t.scheduleConfig) t.scheduleConfig={matchDuration:60,gapDuration:10};
    return `<div class="grid grid-cols-1 lg:grid-cols-3 gap-4"><div class="flex flex-col gap-4 lg:col-span-1"><div class="bg-white border border-gray-200 rounded p-4"><h2 class="font-medium mb-2">Herní plochy</h2><div class="flex flex-col gap-2 mb-2"><input id="field-name" class="border rounded px-2 py-1.5" placeholder="Název plochy"><input id="field-time" type="time" class="border rounded px-2 py-1.5" value="12:00"><button id="field-add" class="px-2 py-1 bg-blue-600 text-white rounded">Přidat herní plochu</button></div><div class="text-sm mb-1">Délka zápasu (min)</div><input id="match-dur" type="number" class="w-24 border rounded px-2 py-1.5 mb-2" value="${t.scheduleConfig.matchDuration}"><div class="text-sm mb-1">Čas mezi zápasy (min)</div><input id="gap-dur" type="number" class="w-24 border rounded px-2 py-1.5 mb-3" value="${t.scheduleConfig.gapDuration}"><div id="fields-list" class="flex flex-col gap-1"></div></div><div class="bg-white border border-gray-200 rounded p-4"><h2 class="font-medium mb-2">Rozdělit skupiny na herní plochy</h2><div id="schedule-map" class="flex flex-col gap-1"></div></div></div><div class="bg-white border border-gray-200 rounded p-4 lg:col-span-2"><h2 class="font-medium mb-2">Plán</h2><div class="text-xs text-gray-500 mb-2">1) Klikni na blok (zápas/pauza/událost) - označí se modře. 2) Klikni kamkoliv do sloupce vybrané herní plochy - blok se tam přesune, časy se přepočítají.</div><div class="flex flex-wrap gap-2 mb-3"><select id="sched-select" class="border rounded px-2 py-1.5"><option value="">-- vybrat skupinu/bracket --</option>${(t.groups||[]).map((g,i)=>`<option value="g:${i}">${escapeHtml(g.name)}</option>`).join("")}${t.bracket&&t.bracket.matches&&t.bracket.matches.length?`<option value="b:all">Bracket</option>`:""}</select><button id="sched-draw" class="px-2 py-1 border rounded">Rozlosovat do plánu</button><button id="sched-clear" class="px-2 py-1 border rounded">Smazat rozlosování</button></div><div id="schedule-board" class="grid grid-cols-1 md:grid-cols-2 gap-3"></div></div></div>`;
}
function attachScheduleEvents(t){
    if(!t.scheduleConfig) t.scheduleConfig={matchDuration:60,gapDuration:10};
    if(!t.schedule) t.schedule=[]; if(!t.fields) t.fields=[]; if(!t.scheduleMap) t.scheduleMap={};
    document.getElementById("match-dur").onchange=e=>{t.scheduleConfig.matchDuration=parseInt(e.target.value)||60; saveCurrent(t);};
    document.getElementById("gap-dur").onchange=e=>{t.scheduleConfig.gapDuration=parseInt(e.target.value)||10; saveCurrent(t);};
    document.getElementById("field-add").onclick=()=>{ const fname=document.getElementById("field-name"), ftime=document.getElementById("field-time"); const name=fname?fname.value.trim():""; if(!name){alert("Zadej název");return;} t.fields.push({id:uid(),name,startTime:ftime?ftime.value:"12:00"}); if(fname) fname.value=""; saveCurrent(t); render(); };
    renderFields(t); renderScheduleMap(t);
    document.getElementById("sched-draw").onclick=()=>drawSchedule(t);
    document.getElementById("sched-clear").onclick=()=>{ if(confirm("Smazat rozlosování?")){ t.schedule=[]; saveCurrent(t); render(); } };
    renderScheduleBoard(t);
}
function renderFields(t){
    const list=document.getElementById("fields-list"); if(!list)return;
    list.innerHTML=(t.fields||[]).map((f,fi)=>`<div class="border rounded p-2 bg-white"><div class="flex items-center justify-between mb-1"><div class="text-sm font-medium">${escapeHtml(f.name)} · ${escapeHtml(f.startTime||"12:00")}</div><button data-fdel="${fi}" class="text-red-600 text-sm">Smazat</button></div><div class="flex gap-1"><button data-fbreak="${fi}" class="px-1.5 py-0.5 border rounded text-xs">Přidat break</button><button data-fevent="${fi}" class="px-1.5 py-0.5 border rounded text-xs">Přidat event</button></div></div>`).join("");
    document.querySelectorAll("[data-fdel]").forEach(btn=>{ btn.onclick=()=>{ const fi=parseInt(btn.getAttribute("data-fdel")); const field=t.fields[fi]; if(!field)return; if(confirm("Smazat plochu a vše na ní?")){ t.fields.splice(fi,1); t.schedule=(t.schedule||[]).filter(s=>s.fieldId!==field.id); saveCurrent(t); render(); } }; });
    document.querySelectorAll("[data-fbreak]").forEach(btn=>{ btn.onclick=()=>{ const fi=parseInt(btn.getAttribute("data-fbreak")); const field=t.fields[fi]; if(!field)return; const name=prompt("Název pauzy","Pauza"); if(!name)return; const dur=parseInt(prompt("Délka (min)","15"))||15; if(!t.schedule) t.schedule=[]; t.schedule.push({id:uid(),fieldId:field.id,type:"break",label:name,startMin:0,duration:dur}); recomputeTimes(t); render(); }; });
    document.querySelectorAll("[data-fevent]").forEach(btn=>{ btn.onclick=()=>{ const fi=parseInt(btn.getAttribute("data-fevent")); const field=t.fields[fi]; if(!field)return; const name=prompt("Název události"); if(!name)return; const dur=parseInt(prompt("Délka (min)","30"))||30; if(!t.schedule) t.schedule=[]; t.schedule.push({id:uid(),fieldId:field.id,type:"event",label:name,startMin:0,duration:dur}); recomputeTimes(t); render(); }; });
}
function renderScheduleMap(t){
    const wrap=document.getElementById("schedule-map"); if(!wrap)return; if(!t.scheduleMap) t.scheduleMap={}; const groups=t.groups||[]; if(groups.length===0){wrap.innerHTML=`<div class="text-gray-500 text-sm">Nejsou skupiny</div>`;return;} if(!t.fields||t.fields.length===0){wrap.innerHTML=`<div class="text-gray-500 text-sm">Přidej plochy</div>`;return;}
    wrap.innerHTML=groups.map((g,gi)=>`<div class="flex items-center justify-between text-sm border rounded px-2 py-1"><div>${escapeHtml(g.name)}</div><select data-smap="${gi}" class="border rounded px-2 py-1">${t.fields.map(f=>`<option value="${escapeAttr(f.id)}" ${t.scheduleMap[gi]===f.id?"selected":""}>${escapeHtml(f.name)}</option>`).join("")}</select></div>`).join("");
    document.querySelectorAll("[data-smap]").forEach(sel=>{ sel.onchange=()=>{ const gi=parseInt(sel.getAttribute("data-smap")); if(!t.scheduleMap) t.scheduleMap={}; t.scheduleMap[gi]=sel.value; saveCurrent(t); }; });
}
function getTeamName(t,tid){ if(!tid)return"-"; const team=(t.teams||[]).find(x=>x.id===tid); return team?team.name:tid; }
function timeToMin(s){ if(!s)return 720; const p=s.split(":"); return (parseInt(p[0])||0)*60+(parseInt(p[1])||0); }
function minToTime(m){ m=((m||0)%(24*60)+24*60)%(24*60); const h=Math.floor(m/60).toString().padStart(2,"0"); const mm=(m%60).toString().padStart(2,"0"); return h+":"+mm; }
function recomputeTimes(t){
    if(!t.schedule||!t.fields)return; if(!t.scheduleConfig) t.scheduleConfig={matchDuration:60,gapDuration:10};
    t.fields.forEach(f=>{
        const items=[];
        (t.schedule||[]).forEach(s=>{ if(s.fieldId===f.id) items.push(s); });
        let cur=timeToMin(f.startTime||"12:00");
        items.forEach(it=>{ it.startMin=cur; cur+=(it.duration||0)+t.scheduleConfig.gapDuration; });
    });
    saveCurrent(t);
}
function drawSchedule(t){
    const sel=document.getElementById("sched-select"); if(!sel)return; const val=sel.value; if(!val){alert("Vyber skupinu/bracket");return;}
    t.fields=t.fields||[]; if(t.fields.length===0){alert("Přidej plochy");return;} if(!t.schedule) t.schedule=[]; if(!t.scheduleConfig) t.scheduleConfig={matchDuration:60,gapDuration:10}; if(!t.scheduleMap) t.scheduleMap={};
    let list=[], targetFieldId=t.fields[0].id;
    if(val.startsWith("g:")){ const gi=parseInt(val.split(":")[1]); const g=t.groups&&t.groups[gi]; if(!g){alert("Skupina nenalezena");return;} targetFieldId=t.scheduleMap[gi]||t.fields[0].id; const teams=(g.teams||[]).filter(x=>x); for(let i=0;i<teams.length;i++){ for(let j=i+1;j<teams.length;j++){ list.push({type:"match",teamA:teams[i],teamB:teams[j],label:g.name+": "+getTeamName(t,teams[i])+" - "+getTeamName(t,teams[j])}); } } }
    else if(val==="b:all"){ (t.bracket&&t.bracket.matches?t.bracket.matches:[]).forEach(m=>{ if(m.teams&&m.teams[0]&&m.teams[1]) list.push({type:"match",teamA:m.teams[0],teamB:m.teams[1],label:(m.name||"Match")+": "+getTeamName(t,m.teams[0])+" - "+getTeamName(t,m.teams[1])}); }); targetFieldId=t.fields[0].id; }
    const field=t.fields.find(f=>f.id===targetFieldId)||t.fields[0];
    const itemsOnField=(t.schedule||[]).filter(s=>s.fieldId===field.id).sort((a,b)=>(a.startMin||0)-(b.startMin||0));
    let cur=itemsOnField.length===0?timeToMin(field.startTime||"12:00"):(itemsOnField[itemsOnField.length-1].startMin+itemsOnField[itemsOnField.length-1].duration+t.scheduleConfig.gapDuration);
    for(let k=0;k<list.length;k++){ t.schedule.push({id:uid(),fieldId:field.id,type:"match",teamA:list[k].teamA,teamB:list[k].teamB,label:list[k].label,startMin:cur,duration:t.scheduleConfig.matchDuration}); cur+=t.scheduleConfig.matchDuration+t.scheduleConfig.gapDuration; }
    recomputeTimes(t); render();
}
let scheduleMoveState = { sid: null };

function getScheduleConflicts(t){
    const conflicts = new Set();
    if(!t.schedule) return conflicts;
    const items = (t.schedule||[]).filter(s=>s.type==="match" && s.teamA && s.teamB);
    const byTeam = {};
    items.forEach(it=>{
        const end = (it.startMin||0) + (it.duration||t.scheduleConfig&&t.scheduleConfig.matchDuration||60);
        [it.teamA,it.teamB].forEach(tid=>{
            if(!tid) return;
            if(!byTeam[tid]) byTeam[tid]=[];
            byTeam[tid].push({id:it.id, startMin:it.startMin||0, end, fieldId:it.fieldId});
        });
    });
    Object.values(byTeam).forEach(list=>{
        for(let i=0;i<list.length;i++){
            for(let j=i+1;j<list.length;j++){
                const a=list[i], b=list[j];
                if(a.id===b.id) continue;
                if(a.end > b.startMin && b.end > a.startMin){
                    conflicts.add(a.id); conflicts.add(b.id);
                }else if(a.startMin===b.startMin){
                    conflicts.add(a.id); conflicts.add(b.id);
                }
            }
        }
    });
    return conflicts;
}

function renderScheduleBoard(t){
    const board=document.getElementById("schedule-board"); if(!board)return; t.fields=t.fields||[];
    if(!t.schedule) t.schedule=[];
    if(!scheduleMoveState) scheduleMoveState={sid:null};
    if(!t.scheduleConfig) t.scheduleConfig={matchDuration:60,gapDuration:10};
    recomputeTimes(t);
    const conflicts = getScheduleConflicts(t);
    
    board.innerHTML=t.fields.map(f=>{
        const items=(t.schedule||[]).filter(s=>s.fieldId===f.id);
        return `<div class="border rounded"><div class="bg-gray-50 px-2 py-1 border-b font-medium">${escapeHtml(f.name)} (${escapeHtml(f.startTime||"12:00")})</div><div class="p-2 flex flex-col gap-1 min-h-[80px]" data-field="${escapeAttr(f.id)}">${items.map(it=>{ const end=(it.startMin||0)+(it.duration||0); const sel = scheduleMoveState.sid===it.id ? "ring-2 ring-blue-500" : ""; const bad = conflicts.has(it.id) ? "border-red-500 bg-red-50" : "bg-white"; return `<div data-sid="${escapeAttr(it.id)}" data-field="${escapeAttr(f.id)}" class="border rounded px-2 py-1 text-sm cursor-pointer select-none ${bad} ${sel}"><div class="font-medium">${escapeHtml(it.label||it.type)}</div><div class="text-xs text-gray-500">${minToTime(it.startMin)} - ${minToTime(end)} (${it.duration} min)</div></div>`; }).join("")}<div class="h-6" data-empty-slot="${escapeAttr(f.id)}"></div></div></div>`;
    }).join("");
    
    document.querySelectorAll("#schedule-board [data-sid]").forEach(el=>{
        el.onclick=(e)=>{
            e.stopPropagation();
            const sid=el.getAttribute("data-sid");
            if(scheduleMoveState.sid && scheduleMoveState.sid===sid){
                scheduleMoveState.sid=null;
            }else{
                scheduleMoveState.sid=sid;
            }
            renderScheduleBoard(t);
        };
    });
    
    document.querySelectorAll("#schedule-board [data-empty-slot]").forEach(slot=>{
        slot.onclick=(e)=>{
            e.stopPropagation();
            if(!scheduleMoveState.sid) return;
            const fieldId=slot.getAttribute("data-empty-slot");
            const moving=(t.schedule||[]).find(x=>x.id===scheduleMoveState.sid);
            if(!moving) return;
            const idx=t.schedule.findIndex(x=>x.id===moving.id);
            if(idx>=0) t.schedule.splice(idx,1);
            moving.fieldId=fieldId;
            t.schedule.push(moving);
            scheduleMoveState.sid=null;
            recomputeTimes(t);
            render();
        };
    });
    
    document.querySelectorAll("#schedule-board [data-sid]").forEach(el=>{
        el.onclick=(e)=>{
            e.stopPropagation();
            const sid=el.getAttribute("data-sid");
            if(scheduleMoveState.sid && scheduleMoveState.sid===sid){
                scheduleMoveState.sid=null;
                renderScheduleBoard(t);
                return;
            }
            if(scheduleMoveState.sid && scheduleMoveState.sid!==sid){
                // insert before target
                const moving=(t.schedule||[]).find(x=>x.id===scheduleMoveState.sid);
                const targetId=sid;
                if(!moving || moving.id===targetId) { scheduleMoveState.sid=null; renderScheduleBoard(t); return; }
                const mIdx=t.schedule.findIndex(x=>x.id===moving.id);
                if(mIdx>=0) t.schedule.splice(mIdx,1);
                const tIdx=t.schedule.findIndex(x=>x.id===targetId);
                if(tIdx>=0){
                    moving.fieldId=el.getAttribute("data-field");
                    t.schedule.splice(tIdx,0,moving);
                }else{
                    moving.fieldId=el.getAttribute("data-field");
                    t.schedule.push(moving);
                }
                scheduleMoveState.sid=null;
                recomputeTimes(t);
                render();
                return;
            }
            scheduleMoveState.sid=sid;
            renderScheduleBoard(t);
        };
    });
}

function openResultModal(t, key, ra, rb, res){
    const modal=document.createElement("div"); modal.className="fixed inset-0 bg-black/40 flex items-center justify-center z-50";
    modal.innerHTML=`<div class="bg-white rounded w-full max-w-sm p-4"><h3 class="font-medium mb-2">${res && (res.a!==""||res.b!=="")?"Upravit výsledek":"Zadat výsledek"}</h3><div class="text-sm mb-2">${escapeHtml(ra)} - ${escapeHtml(rb)}</div><div class="flex items-center gap-2 mb-3"><input id="res-ma" class="w-16 border rounded px-2 py-1 text-center" value="${escapeAttr(res&&res.a||"")}"><span>:</span><input id="res-mb" class="w-16 border rounded px-2 py-1 text-center" value="${escapeAttr(res&&res.b||"")}"></div><div class="flex justify-end gap-2"><button id="res-cancel" class="px-2 py-1 border rounded">Zrušit</button><button id="res-ok" class="px-2 py-1 bg-blue-600 text-white rounded">Uložit</button></div></div>`;
    document.body.appendChild(modal);
    modal.querySelector("#res-cancel").onclick=()=>modal.remove();
    modal.querySelector("#res-ok").onclick=()=>{
        const va=modal.querySelector("#res-ma").value, vb=modal.querySelector("#res-mb").value;
        t.results=t.results||{}; t.results[key]={a:va,b:vb}; saveCurrent(t); modal.remove(); computeStandings(t); setTimeout(()=>fillResults(t),0);
    };
}

function fillResults(t){
    if(!t.results) t.results={};
    if(!t.schedule) t.schedule=[];
    const matchesDivEl = document.getElementById("results-matches");
    const standingsDivEl = document.getElementById("standings-list");
    const items=[];
    const seen=new Set();
    (t.schedule||[]).filter(s=>s.type==="match"&&s.teamA&&s.teamB).forEach(s=>{
        const key="sch:"+s.id; if(seen.has(key))return; seen.add(key);
        items.push({id:key, group: s.label||"", a:s.teamA, b:s.teamB, time:s.startMin});
    });
    items.sort((a,b)=>(a.time||0)-(b.time||0));
    if(items.length===0){
        (t.groups||[]).forEach((g,gi)=>{ const teams=(g.teams||[]).filter(x=>x); for(let i=0;i<teams.length;i++){ for(let j=i+1;j<teams.length;j++){ items.push({id:"m:"+gi+":"+teams[i]+":"+teams[j],group:g.name,a:teams[i],b:teams[j]}); } } });
        (t.bracket&&t.bracket.matches?t.bracket.matches:[]).forEach((m,mi)=>{ if(m.teams&&m.teams[0]&&m.teams[1]) items.push({id:"bm:"+mi,name:m.name,a:m.teams[0],b:m.teams[1]}); });
    }
    if(matchesDivEl){
        matchesDivEl.innerHTML=items.length===0?`<div class="text-gray-500">Žádné zápasy</div>`:items.map(it=>{
            const key=it.id, res=t.results[key]||{}, timeLabel=it.time!=null?minToTime(it.time):"";
            const raName = getTeamName(t,it.a)||"-", rbName = getTeamName(t,it.b)||"-";
            if(res.a!==undefined && res.a!=="" && res.b!==undefined && res.b!==""){
                return `<button data-res-edit="${escapeAttr(key)}" data-ra="${escapeAttr(raName)}" data-rb="${escapeAttr(rbName)}" class="border rounded p-2 hover:bg-gray-50 w-full text-left"><div class="text-xs text-gray-500 mb-1">${timeLabel||""}</div><div class="grid grid-cols-[1fr_auto_1fr] items-center gap-2"><div class="text-sm font-medium text-right">${escapeHtml(raName)}</div><div class="font-medium text-center">${escapeHtml(String(res.a))} : ${escapeHtml(String(res.b))}</div><div class="text-sm font-medium text-left">${escapeHtml(rbName)}</div></div></button>`;
            }
            return `<div class="border rounded p-2"><div class="text-xs text-gray-500 mb-1">${timeLabel||""}</div><div class="grid grid-cols-[1fr_auto_1fr] items-center gap-2"><div class="text-sm font-medium text-right">${escapeHtml(raName)}</div><div class="flex items-center gap-1 justify-center"><input data-res-inp-a="${escapeAttr(key)}" class="w-10 border rounded px-1 py-1 text-center text-sm" placeholder="0"><span>:</span><input data-res-inp-b="${escapeAttr(key)}" class="w-10 border rounded px-1 py-1 text-center text-sm" placeholder="0"></div><div class="flex items-center gap-2"><div class="text-sm font-medium text-left flex-1">${escapeHtml(rbName)}</div><button data-res-save="${escapeAttr(key)}" class="px-2 py-1 bg-blue-600 text-white rounded text-sm">Uložit</button></div></div></div>`;
        }).join("");
        matchesDivEl.querySelectorAll("[data-res-save]").forEach(btn=>{
            btn.onclick=()=>{
                const key=btn.getAttribute("data-res-save");
                const ia=matchesDivEl.querySelector(`[data-res-inp-a="${key}"]`);
                const ib=matchesDivEl.querySelector(`[data-res-inp-b="${key}"]`);
                const va=ia?ia.value:"", vb=ib?ib.value:"";
                t.results=t.results||{}; t.results[key]={a:va,b:vb}; saveCurrent(t); computeStandings(t); setTimeout(()=>fillResults(t),0);
            };
        });
        matchesDivEl.querySelectorAll("[data-res-edit]").forEach(btn=>{
            btn.onclick=()=>{
                const key=btn.getAttribute("data-res-edit"), ra=btn.getAttribute("data-ra")||"", rb=btn.getAttribute("data-rb")||"";
                openResultModal(t,key,ra,rb,t.results[key]||{});
            };
        });
    }
    computeStandings(t);
    if(!standingsDivEl)return;
    standingsDivEl.innerHTML=(t.groups||[]).map((g,gi)=>{ const st=t.standings&&t.standings[gi]?t.standings[gi]:[]; if(st.length===0)return""; return `<div class="border rounded"><div class="bg-gray-50 px-2 py-1 border-b font-medium">${escapeHtml(g.name)}</div><div class="overflow-auto"><table class="w-full text-sm"><thead><tr class="border-b"><th class="text-left p-1">Tým</th><th class="text-center p-1">Z</th><th class="text-center p-1">V</th><th class="text-center p-1">R</th><th class="text-center p-1">P</th><th class="text-center p-1">Skóre</th><th class="text-center p-1">+/-</th><th class="text-center p-1">B</th><th class="text-center p-1">Poř.</th></tr></thead><tbody>${st.map(row=>`<tr class="border-b"><td class="p-1">${escapeHtml(row.name)}</td><td class="text-center p-1">${row.gp||0}</td><td class="text-center p-1">${row.w||0}</td><td class="text-center p-1">${row.d||0}</td><td class="text-center p-1">${row.l||0}</td><td class="text-center p-1">${row.gf||0}:${row.ga||0}</td><td class="text-center p-1">${row.gd>=0?"+"+row.gd:row.gd}</td><td class="text-center p-1">${row.pts||0}</td><td class="text-center p-1">${row.pos||""}</td></tr>`).join("")}</tbody></table></div></div>`; }).join("")||`<div class="text-gray-500">Žádné tabulky</div>`;
}
function renderResults(t){ fillResults(t); }

function computeStandings(t){
    if(!t.standings) t.standings={};
    (t.groups||[]).forEach((g,gi)=>{
        const teams=(g.teams||[]).filter(x=>x);
        const table=teams.map(tid=>({tid,name:getTeamName(t,tid),gp:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,pts:0}));
        for(let i=0;i<teams.length;i++){ for(let j=i+1;j<teams.length;j++){
            const key1="m:"+gi+":"+teams[i]+":"+teams[j];
            let res=t.results&&t.results[key1];
            if(!res){ const sched=(t.schedule||[]).find(s=>s.type==="match"&&((s.teamA===teams[i]&&s.teamB===teams[j])||(s.teamA===teams[j]&&s.teamB===teams[i]))); if(sched) res=t.results&&t.results["sch:"+sched.id]; }
            if(!res) continue;
            const a=parseInt(res.a), b=parseInt(res.b); if(isNaN(a)||isNaN(b)) continue;
            const ra=table.find(x=>x.tid===teams[i]), rb=table.find(x=>x.tid===teams[j]); if(!ra||!rb) continue;
            ra.gp++; rb.gp++; ra.gf+=a; ra.ga+=b; rb.gf+=b; rb.ga+=a;
            if(a>b){ ra.w++; rb.l++; ra.pts+=3; } else if(b>a){ rb.w++; ra.l++; rb.pts+=3; } else { ra.d++; rb.d++; ra.pts+=1; rb.pts+=1; }
        }}
        table.forEach(x=>{x.gd=x.gf-x.ga;});
        table.sort((a,b)=>{ if(b.pts!==a.pts)return b.pts-a.pts; if(b.gd!==a.gd)return b.gd-a.gd; if(b.gf!==a.gf)return b.gf-a.gf; return 0; });
        table.forEach((x,idx)=>{x.pos=idx+1;});
        t.standings[gi]=table;
    });
    saveCurrent(t);
}

try{ if(typeof render==="function") render(); }catch(e){ const app=document.getElementById("app"); if(app) app.innerHTML='<div class="p-6 text-red-600">Chyba: '+(e&&e.message?e.message:e)+'</div>'; }
