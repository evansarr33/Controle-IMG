const steps = [
  ['Identité', identityStep], ['Situation au CFA', cfaStep], ['Poursuite d’études', studyStep], ['Besoin informatique', needStep], ['Votre équipement', equipmentStep], ['Situation financière', financeStep], ['Situation personnelle', personalStep], ['Engagement associatif', associationStep], ['Motivation', motivationStep], ['Attestation', attestationStep],
];

const defaultData = { status:'Apprenti actuellement', level:'BTS', continues:'Non', nextLevel:'BTS', computerRequired:'Non', hasComputer:'Non', computerWorks:'Oui', computerAge:'moins de 2 ans', salary:0, scholarship:'Non', familyIssue:'Non', disability:'Non', cfaLife:'Non', truth:false, rules:false, date:new Date().toLocaleDateString('fr-FR') };
let data = { ...defaultData, ...JSON.parse(localStorage.getItem('aae-application') || '{}') };
let currentStep = Number(localStorage.getItem('aae-step') || 0);
let criteria = JSON.parse(localStorage.getItem('aae-criteria') || 'null') || [
  { id:'continues', label:'Poursuite d’études', points:30, active:true },
  { id:'higher', label:'Entrée BTS/BUT/Licence/Bachelor/Master', points:20, active:true },
  { id:'required', label:'Formation nécessitant un ordinateur', points:15, active:true },
  { id:'noComputer', label:'Aucun ordinateur', points:25, active:true },
  { id:'oldComputer', label:'Ordinateur de plus de 6 ans', points:10, active:true },
  { id:'scholarship', label:'Boursier', points:20, active:true },
  { id:'lowSalary', label:'Salaire < 1000 €', points:15, active:true },
  { id:'midSalary', label:'Salaire entre 1000 € et 1400 €', points:10, active:true },
  { id:'familyIssue', label:'Situation familiale difficile', points:15, active:true },
  { id:'disability', label:'Handicap ou besoin spécifique', points:15, active:true },
  { id:'cfaLife', label:'Participation à la vie du CFA', points:10, active:true },
];

const sampleRequests = [
  ['Lina Moreau','BTS SIO',105,'P1','16/07/2026','En attente'], ['Adam Burel','BUT GEA',90,'P2','15/07/2026','Validée'], ['Sarah Petit','Licence Pro',75,'P2','14/07/2026','En attente'], ['Mehdi Laurent','CAP Cuisine',45,'P4','12/07/2026','Refusée'], ['Zoé Martin','Master RH',110,'P1','10/07/2026','En attente']
];

document.addEventListener('DOMContentLoaded', () => { bind(); renderAll(); });
function bind(){
  document.getElementById('themeToggle').onclick = () => document.documentElement.classList.toggle('dark');
  document.getElementById('prevStep').onclick = () => move(-1);
  document.getElementById('nextStep').onclick = () => currentStep === steps.length - 1 ? submitApplication() : move(1);
  document.getElementById('downloadPdf').onclick = () => window.print();
  document.getElementById('exportCsv').onclick = exportCsv;
  document.getElementById('addCriterion').onclick = addCriterion;
  document.getElementById('adminSearch').oninput = renderRequests;
  document.getElementById('statusFilter').onchange = renderRequests;
  document.getElementById('priorityFilter').onchange = renderRequests;
}
function renderAll(){ renderSteps(); renderStep(); renderScore(); renderAdmin(); }
function save(){ localStorage.setItem('aae-application', JSON.stringify(data)); localStorage.setItem('aae-step', currentStep); const s=document.getElementById('saveState'); s.textContent='Sauvé'; document.getElementById('autosavePill').textContent='Sauvegardé automatiquement'; setTimeout(()=>s.textContent='À jour',700); }
function move(delta){ currentStep = Math.max(0, Math.min(steps.length-1, currentStep + delta)); save(); renderAll(); document.getElementById('application').scrollIntoView({behavior:'smooth'}); }
function field(name, value){ data[name] = value; save(); renderAll(); }
function input(name, label, type='text', extra=''){ return `<label>${label}<input name="${name}" type="${type}" value="${data[name]||''}" ${extra}></label>`; }
function textarea(name,label,min=''){ return `<label class="full">${label}<textarea name="${name}" ${min} rows="6">${data[name]||''}</textarea></label>`; }
function radio(name,label,opts){ return `<fieldset><legend>${label}</legend><div class="choice-grid">${opts.map(o=>`<label class="choice"><input type="radio" name="${name}" value="${o}" ${data[name]===o?'checked':''}>${o}</label>`).join('')}</div></fieldset>`; }
function select(name,label,opts){ return `<label>${label}<select name="${name}">${opts.map(o=>`<option ${data[name]===o?'selected':''}>${o}</option>`).join('')}</select></label>`; }
function files(name,label){ return `<label class="dropzone full">⇧ ${label}<input name="${name}" type="file" multiple><small>Glisser-déposer ou cliquer pour ajouter les pièces.</small></label>`; }
function identityStep(){ return [input('lastName','Nom'),input('firstName','Prénom'),input('birthDate','Date de naissance','date'),input('phone','Téléphone','tel'),input('email','Email','email'),input('address','Adresse'),input('zip','Code postal'),input('city','Ville')].join(''); }
function cfaStep(){ return radio('status','Êtes-vous :',['Apprenti actuellement','Ancien apprenti'])+input('formation','Formation actuelle')+select('level','Niveau',['CAP','Bac Pro','BTS','BUT','Licence','Bachelor','Master','Autre'])+input('company','Entreprise')+input('year','Année de formation'); }
function studyStep(){ return radio('continues','Allez-vous poursuivre vos études à la prochaine rentrée ?',['Oui','Non'])+(data.continues==='Oui' ? select('nextLevel','Formation prévue',['BTS','BUT','Licence','Bachelor','Master','École spécialisée','Autre'])+input('school','Établissement')+files('admissionDocs','Certificat d’admission, Parcoursup ou certificat de scolarité') : '<div class="info-box">Si vous êtes en recherche d’emploi, précisez le besoin informatique à l’étape suivante.</div>'); }
function needStep(){ return radio('computerRequired','Votre future formation ou recherche d’emploi nécessite-t-elle un ordinateur personnel ?',['Oui','Non'])+textarea('softwareNeeds','Logiciels, plateformes ou usages prévus'); }
function equipmentStep(){ return radio('hasComputer','Possédez-vous actuellement un ordinateur personnel ?',['Oui','Non'])+(data.hasComputer==='Non' ? '<div class="success-box">Vous obtenez automatiquement les points liés à l’absence d’ordinateur.</div>' : radio('computerWorks','L’ordinateur fonctionne-t-il ?',['Oui','Non'])+select('computerAge','Quel âge a-t-il ?',['moins de 2 ans','2 à 4 ans','4 à 6 ans','plus de 6 ans'])+files('computerPhoto','Photo de l’ordinateur ou justificatif de panne')); }
function financeStep(){ return `<label class="full">Salaire mensuel net <strong>${data.salary} €</strong><input name="salary" type="range" min="0" max="2000" step="50" value="${data.salary}"></label>`+radio('scholarship','Êtes-vous boursier ?',['Oui','Non'])+files('salaryDocs','3 derniers bulletins de salaire')+files('scholarshipDoc','Attestation de bourse (facultatif si non concerné)'); }
function personalStep(){ return radio('familyIssue','Disposez-vous d’une situation familiale difficile ?',['Oui','Non'])+(data.familyIssue==='Oui'?textarea('familyText','Décrivez la situation')+files('familyDoc','Justificatif familial'):'')+radio('disability','Êtes-vous reconnu en situation de handicap ou avez-vous un besoin spécifique ?',['Oui','Non'])+(data.disability==='Oui'?textarea('disabilityText','Décrivez le besoin spécifique')+files('disabilityDoc','Justificatif handicap ou besoin'):''); }
function associationStep(){ return radio('cfaLife','Avez-vous participé à la vie du CFA ou d’une association ?',['Oui','Non'])+(data.cfaLife==='Oui'?textarea('cfaLifeText','Décrire votre implication'):''); }
function motivationStep(){ return textarea('motivation','Pourquoi souhaitez-vous bénéficier d’un ordinateur portable ?','minlength="300"')+`<div class="char-count">${(data.motivation||'').length}/300 caractères minimum</div>`; }
function attestationStep(){ return `<label class="check full"><input type="checkbox" name="truth" ${data.truth?'checked':''}> Je certifie sur l’honneur que toutes les informations communiquées sont exactes.</label><label class="check full"><input type="checkbox" name="rules" ${data.rules?'checked':''}> J’accepte le règlement d’attribution.</label>${input('signature','Signature électronique')}<label>Date automatique<input name="date" readonly value="${data.date}"></label>`; }
function renderStep(){ const [title, tpl]=steps[currentStep]; document.getElementById('stepTitle').textContent=`Étape ${currentStep+1} — ${title}`; document.getElementById('heroStep').textContent=`${currentStep+1} / ${steps.length}`; document.getElementById('stepContent').innerHTML=`<div class="field-grid">${tpl()}</div>`; document.getElementById('prevStep').disabled=currentStep===0; document.getElementById('nextStep').textContent=currentStep===steps.length-1?'Envoyer la demande':'Suivant'; document.querySelectorAll('#stepContent input,#stepContent select,#stepContent textarea').forEach(el=>el.addEventListener('input', e=> field(e.target.name, e.target.type==='checkbox'?e.target.checked:e.target.value))); }
function renderSteps(){ const pct=Math.round((currentStep)/(steps.length-1)*100); document.getElementById('progressPercent').textContent=pct+'%'; document.getElementById('progressFill').style.width=pct+'%'; document.getElementById('stepList').innerHTML=steps.map((s,i)=>`<li class="${i===currentStep?'active':''} ${i<currentStep?'done':''}"><span>${i+1}</span>${s[0]}</li>`).join(''); }
function score(){ const tests={continues:data.continues==='Oui', higher:data.continues==='Oui'&&['BTS','BUT','Licence','Bachelor','Master'].includes(data.nextLevel), required:data.computerRequired==='Oui', noComputer:data.hasComputer==='Non', oldComputer:data.computerAge==='plus de 6 ans'||data.computerWorks==='Non', scholarship:data.scholarship==='Oui', lowSalary:+data.salary<1000, midSalary:+data.salary>=1000&&+data.salary<=1400, familyIssue:data.familyIssue==='Oui', disability:data.disability==='Oui', cfaLife:data.cfaLife==='Oui'}; return criteria.filter(c=>c.active&&tests[c.id]).reduce((a,c)=>({total:a.total+c.points, lines:[...a.lines,c]}),{total:0,lines:[]}); }
function priority(){ if(data.continues==='Oui'&&data.hasComputer==='Non') return 'Priorité 1'; if(data.continues==='Oui'&&(data.computerAge==='plus de 6 ans'||data.computerWorks==='Non')) return 'Priorité 2'; if(data.continues==='Non'&&data.computerRequired==='Oui') return 'Priorité 3'; return 'Priorité 4'; }
function renderScore(){ const s=score(), p=priority(); ['scoreValue','heroScore'].forEach(id=>document.getElementById(id).textContent=s.total); document.getElementById('priorityBadge').textContent=p; document.getElementById('heroPriority').textContent=`${p} · score ${s.total}`; document.getElementById('scoreDetails').innerHTML=s.lines.map(l=>`<li><span>${l.label}</span><strong>+${l.points}</strong></li>`).join('')||'<li>Aucun critère déclenché pour le moment.</li>'; }
function submitApplication(){ if(!data.truth||!data.rules||!data.signature) return toast('Attestation et signature obligatoires.'); if((data.motivation||'').length<300) return toast('La motivation doit contenir au moins 300 caractères.'); toast('Demande envoyée : email de réception simulé.'); }
function renderAdmin(){ renderRequests(); renderCriteria(); }
function renderRequests(){ const q=document.getElementById('adminSearch').value.toLowerCase(), st=document.getElementById('statusFilter').value, pr=document.getElementById('priorityFilter').value; const rows=sampleRequests.filter(r=>(st==='all'||r[5]===st)&&(pr==='all'||r[3]===pr)&&r.join(' ').toLowerCase().includes(q)).sort((a,b)=>b[2]-a[2]); document.getElementById('requestsTable').innerHTML=rows.map((r,i)=>`<tr><td>${r[0]}</td><td>${r[1]}</td><td>${r[2]}</td><td><span class="prio ${r[3].toLowerCase()}">${r[3]}</span></td><td>${r[4]}</td><td>${r[5]}</td><td><button onclick="showDetail(${i})">Voir</button> <button>Valider</button> <button>Refuser</button></td></tr>`).join(''); showDetail(0); }
window.showDetail=(i)=>{ const r=sampleRequests[i]||sampleRequests[0]; document.getElementById('requestDetail').innerHTML=`<h4>${r[0]}</h4><p>${r[1]} · ${r[2]} points · ${r[3]}</p><p>Pièces : identité, salaire, admission, justificatifs.</p><textarea placeholder="Commentaires internes"></textarea><div class="history">Historique : dépôt, scoring, notification email.</div>`; };
function renderCriteria(){ document.getElementById('criteriaList').innerHTML=criteria.map((c,i)=>`<div><input type="checkbox" ${c.active?'checked':''} onchange="toggleCriterion(${i},this.checked)"><span>${c.label}</span><input type="number" value="${c.points}" onchange="setCriterion(${i},this.value)"><button onclick="deleteCriterion(${i})">×</button></div>`).join(''); localStorage.setItem('aae-criteria',JSON.stringify(criteria)); }
window.toggleCriterion=(i,v)=>{criteria[i].active=v; renderAll();}; window.setCriterion=(i,v)=>{criteria[i].points=+v; renderAll();}; window.deleteCriterion=(i)=>{criteria.splice(i,1); renderAll();};
function addCriterion(){ criteria.push({id:'custom'+Date.now(),label:'Nouveau critère manuel',points:5,active:true}); renderAll(); }
function exportCsv(){ const csv='Nom,Formation,Score,Priorité,Date,Statut\n'+sampleRequests.map(r=>r.join(',')).join('\n'); const a=document.createElement('a'); a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv'})); a.download='demandes-aae.csv'; a.click(); }
function toast(msg){ const t=document.getElementById('toast'); t.textContent=msg; t.hidden=false; setTimeout(()=>t.hidden=true,3000); }
