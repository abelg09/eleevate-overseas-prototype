/* MVP behaviour + inner-page router.
   Adds interactivity and real inner screens WITHOUT changing the dashboard markup.
   The finalized dashboard is captured at load and restored exactly when you return to it.
   Shared by desktop.html and mobile.html (both share the same CSS class vocabulary). */
(function(){
  var F="Poppins,system-ui,sans-serif", HEAD="'Exo 2',system-ui,sans-serif";
  var G="linear-gradient(90deg,#3AAA35,#009FE3)";

  /* ---------- toast ---------- */
  var tw=document.createElement('div');
  tw.style.cssText="position:fixed;left:50%;bottom:26px;transform:translateX(-50%);z-index:99999;display:flex;flex-direction:column;gap:8px;align-items:center;pointer-events:none";
  document.body.appendChild(tw);
  function toast(m){var t=document.createElement('div');t.textContent=m;t.style.cssText="background:#1C2442;color:#fff;padding:10px 16px;border-radius:10px;font:600 12.5px "+F+";box-shadow:0 8px 24px rgba(0,0,0,.28);opacity:0;transform:translateY(8px);transition:.2s;max-width:90vw;text-align:center";tw.appendChild(t);requestAnimationFrame(function(){t.style.opacity=1;t.style.transform='none';});setTimeout(function(){t.style.opacity=0;setTimeout(function(){t.remove();},250);},2000);}
  window.__toast=toast;
  function on(sel,fn){document.querySelectorAll(sel).forEach(function(el){el.style.cursor='pointer';el.addEventListener('click',function(e){e.stopPropagation();fn(el,e);});});}
  function txt(el){return (el&&el.textContent||'').replace(/\s+/g,' ').trim();}

  /* ---------- host + captured dashboard ---------- */
  var host=document.querySelector('.mc')||document.querySelector('.appbody');
  if(!host)return;
  var HOME=host.innerHTML;
  var current='dashboard';

  /* ---------- data / state ---------- */
  var UNIS=[
    {id:0,flag:'🇬🇧',name:'University of Manchester',prog:'MSc Computer Science',fees:'£21,000/yr',match:94},
    {id:1,flag:'🇬🇧',name:'University College London',prog:'MSc Artificial Intelligence',fees:'£28,500/yr',match:88},
    {id:2,flag:'🇬🇧',name:'University of Edinburgh',prog:'MSc Data Science',fees:'£19,800/yr',match:91},
    {id:3,flag:'🇨🇦',name:'University of Toronto',prog:'MCS Computer Science',fees:'CA$28,000/yr',match:85},
    {id:4,flag:'🇦🇺',name:'University of Melbourne',prog:'Master of CS',fees:'AU$42,000/yr',match:89},
    {id:5,flag:'🇺🇸',name:'Carnegie Mellon University',prog:'MSCS',fees:'US$58,000/yr',match:72}
  ];
  var applied={0:'Offer Received',1:'Docs Missing',3:'Under Review'}, shortl={2:1}, uSearch='';
  var SCHOL=[
    {id:0,name:'Chevening Scholarship',amt:'£18,000',dl:'Nov 2026',match:92},
    {id:1,name:'GREAT Scholarship',amt:'£10,000',dl:'Apr 2027',match:88},
    {id:2,name:'Manchester Excellence',amt:'£5,000',dl:'Aug 2026',match:95},
    {id:3,name:'Charles Wallace Trust',amt:'£3,000',dl:'Jan 2027',match:78}
  ], scholAp={2:1};
  var DOCS=[
    {n:'Passport Copy',s:'v'},{n:'IELTS Score Card',s:'v'},{n:'Degree Certificate',s:'v'},{n:'Academic Transcripts',s:'v'},
    {n:'Statement of Purpose',s:'v'},{n:'CV / Resume',s:'v'},{n:'Bank Statement (Updated)',s:'p'},{n:'Health Surcharge Receipt',s:'p'},{n:'Biometrics Confirmation',s:'p'}
  ];
  var VISA=[
    {n:'CAS Letter',s:'d'},{n:'Financial Evidence',s:'d'},{n:'ATAS Certificate',s:'d'},{n:'IHS Surcharge',s:'a'},
    {n:'Visa Application (Online)',s:'a'},{n:'Biometrics Appointment',s:'l'},{n:'Document Upload',s:'l'},{n:'Visa Decision',s:'l'}
  ];

  /* ---------- ui helpers ---------- */
  function hdr(t,s,act){return '<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px;margin-bottom:12px;flex-wrap:wrap"><div><div style="font-family:'+HEAD+';font-size:18px;font-weight:700;color:#1C2442">'+t+'</div><div style="font-size:11px;color:#888;margin-top:2px">'+(s||'')+'</div></div>'+(act||'')+'</div>';}
  function btn(l,oc,k){var b="border:none;border-radius:9px;padding:8px 14px;font:600 12px "+F+";cursor:pointer;white-space:nowrap;";var s=k==='ghost'?"background:#fff;border:1px solid #E5E5E5;color:#1C2442;":k==='soft'?"background:#EAF6FF;color:#0369a1;":"background:"+G+";color:#fff;";return '<button style="'+b+s+'" onclick="'+oc+'">'+l+'</button>';}
  function card(inner,extra){return '<div class="card"'+(extra||'')+'><div class="cb">'+inner+'</div></div>';}
  function grid(min,inner){return '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax('+min+'px,1fr));gap:12px">'+inner+'</div>';}
  var STB={'Offer Received':'bg2','Under Review':'bb2','Docs Missing':'br2','Applying':'bb2'};

  /* ---------- pages ---------- */
  function uCards(){var q=uSearch.trim().toLowerCase();var list=UNIS.filter(function(u){return !q||u.name.toLowerCase().indexOf(q)>=0||u.prog.toLowerCase().indexOf(q)>=0;});
    if(!list.length)return '<div style="padding:24px;color:#aaa;font-size:13px">No universities match your search.</div>';
    return grid(230,list.map(function(u){var ap=applied[u.id],sh=shortl[u.id];return card(
      '<div style="display:flex;align-items:flex-start;gap:10px;margin-bottom:10px"><div style="font-size:26px">'+u.flag+'</div><div><div style="font-weight:700;color:#1C2442;font-size:13px">'+u.name+'</div><div style="font-size:10.5px;color:#888;margin-top:2px">'+u.prog+'</div></div></div>'
      +'<div style="display:flex;gap:6px;margin-bottom:12px"><span class="bdg" style="background:#F5F5F5;color:#555">💰 '+u.fees+'</span><span class="bdg bg2">🎯 '+u.match+'%</span></div>'
      +'<div style="display:flex;gap:6px">'+(ap?'<span class="bdg '+(STB[ap]||'bb2')+'" style="padding:8px 12px">✓ '+ap+'</span>':btn('Apply','uApply('+u.id+')'))+btn(sh?'♥ Saved':'♡ Save','uSave('+u.id+')',sh?'soft':'ghost')+'</div>'
    );}).join(''));}
  window.uApply=function(id){applied[id]=applied[id]||'Applying';delete shortl[id];toast('Application started · '+UNIS[id].name);var g=document.getElementById('uGrid');if(g)g.innerHTML=uCards();};
  window.uSave=function(id){if(shortl[id])delete shortl[id];else shortl[id]=1;toast(shortl[id]?'Saved · '+UNIS[id].name:'Removed from saved');var g=document.getElementById('uGrid');if(g)g.innerHTML=uCards();};
  window.uFilter=function(v){uSearch=v;var g=document.getElementById('uGrid');if(g)g.innerHTML=uCards();};
  PAGE_universities=function(){return hdr('Universities','450+ programmes matched to your profile',btn('🤖 Let Elee shortlist','__toast(\'Elee is shortlisting your best matches…\')'))
    +'<div style="display:flex;align-items:center;gap:9px;background:#fff;border:1px solid #E5E5E5;border-radius:11px;padding:10px 14px;margin-bottom:14px;max-width:440px"><span style="color:#aaa">🔍</span><input placeholder="Search a university or programme" oninput="uFilter(this.value)" style="border:none;outline:none;font:400 13px '+F+';flex:1;background:none"></div>'
    +'<div id="uGrid">'+uCards()+'</div>';};

  PAGE_applications=function(){var ids=Object.keys(applied);var offers=ids.filter(function(i){return applied[i]==='Offer Received';}).length;
    return hdr('My Applications',ids.length+' live · '+Object.keys(shortl).length+' saved',btn('+ Add application','__render(\'universities\')'))
    +'<div class="kg" style="margin-bottom:12px"><div class="kc"><div>Live</div><div class="kv">'+ids.length+'</div><div class="ks" style="color:#059669">of 5 free slots</div></div><div class="kc"><div>Offers</div><div class="kv">'+offers+'</div><div class="ks" style="color:#2563EB">received</div></div><div class="kc"><div>Saved</div><div class="kv">'+Object.keys(shortl).length+'</div><div class="ks" style="color:#DB2777">shortlisted</div></div><div class="kc"><div>Visa</div><div class="kv">50%</div><div class="ks" style="color:var(--org)">in progress</div></div></div>'
    +card('<strong>Applications</strong>'+ids.map(function(id){var u=UNIS[id];return '<div class="ar2"><span>'+u.flag+' '+u.name+'</span><span class="bdg '+(STB[applied[id]]||'bb2')+'">'+applied[id]+'</span></div>';}).join(''))
    +(Object.keys(shortl).length?card('<strong>Saved</strong>'+Object.keys(shortl).map(function(id){var u=UNIS[id];return '<div class="ar2"><span>'+u.flag+' '+u.name+'</span>'+btn('Apply now','uApply('+id+');__render(\'applications\')')+'</div>';}).join('')):'');};

  window.schApply=function(id){scholAp[id]=1;toast('🏆 Applied · '+SCHOL[id].name);__render('scholarships');};
  window.schSave=function(id){toast('Saved · '+SCHOL[id].name);};
  PAGE_scholarships=function(){return hdr('Scholarships','Elee found '+SCHOL.length+' scholarships · ₹36L potential',btn('🤖 Auto-apply','__toast(\'Elee is auto-applying to your top matches…\')'))
    +grid(240,SCHOL.map(function(s){var ap=scholAp[s.id];return card(
      '<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px"><div style="font-weight:700;color:#1C2442;font-size:13px">'+s.name+'</div><span class="bdg '+(ap?'bg2':'bb2')+'">'+(ap?'Applied':s.match+'%')+'</span></div>'
      +'<div style="display:flex;gap:16px;margin-bottom:12px"><div><div style="font-size:9px;color:#888">Amount</div><div style="font-family:'+HEAD+';font-weight:700;color:#3AAA35">'+s.amt+'</div></div><div><div style="font-size:9px;color:#888">Deadline</div><div style="font-family:'+HEAD+';font-weight:700;color:#1C2442">'+s.dl+'</div></div></div>'
      +'<div style="display:flex;gap:6px">'+(ap?'<span class="bdg bg2" style="padding:8px 12px">✓ Applied</span>':btn('Apply','schApply('+s.id+')'))+btn('Save','schSave('+s.id+')','ghost')+'</div>'
    );}).join(''));};

  window.docUp=function(i){DOCS[i].s='v';toast('📤 '+DOCS[i].n+' uploaded & verified');__render('documents');};
  PAGE_documents=function(){var v=DOCS.filter(function(d){return d.s==='v';}).length,p=DOCS.length-v;
    return hdr('Documents',v+' of '+DOCS.length+' verified · '+p+' pending',btn('📤 Upload document','__toast(\'Opening file picker…\')'))
    +'<div class="kg" style="margin-bottom:12px"><div class="kc"><div>Verified</div><div class="kv">'+v+'</div><div class="ks" style="color:#059669">complete</div></div><div class="kc"><div>Pending</div><div class="kv">'+p+'</div><div class="ks" style="color:var(--org)">action needed</div></div><div class="kc"><div>Completion</div><div class="kv">'+Math.round(v/DOCS.length*100)+'%</div><div class="ks" style="color:#2563EB">of your file</div></div><div class="kc"><div>Size</div><div class="kv">11MB</div><div class="ks">all docs</div></div></div>'
    +card('<strong>All documents</strong>'+DOCS.map(function(d,i){return '<div class="ar2"><span>'+(d.s==='v'?'✅':'⚠️')+' '+d.n+'</span>'+(d.s==='v'?'<span class="bdg bg2">Verified</span>':btn('Upload','docUp('+i+')'))+'</div>';}).join(''));};

  window.visaDo=function(i){VISA[i].s='d';for(var j=i+1;j<VISA.length;j++){if(VISA[j].s==='l'){VISA[j].s='a';break;}}toast('✅ Step complete · '+VISA[i].n);__render('visa');};
  PAGE_visa=function(){var d=VISA.filter(function(s){return s.s==='d';}).length,pr=VISA.filter(function(s){return s.s==='a';}).length,pct=Math.round((d+pr*0.5)/VISA.length*100);var ic={d:'✅',a:'🔄',l:'🔒'};
    return hdr('Visa Tracker','UK Student Visa · University of Manchester · Sep 2026',btn('🤖 Elee: complete visa','__toast(\'Elee is completing your pending visa steps…\')'))
    +card('<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px"><strong>UK Student Visa — Progress</strong><span class="bdg bg2">'+pct+'%</span></div><div class="pb" style="height:9px"><div class="pf" style="width:'+pct+'%;background:'+G+'"></div></div><div style="font-size:11px;color:#888;margin-top:6px">'+d+' of '+VISA.length+' steps done</div>')
    +card('<strong>Visa Checklist</strong>'+VISA.map(function(s,i){return '<div class="ar2"><span>'+ic[s.s]+' Step '+(i+1)+': '+s.n+'</span>'+(s.s==='a'?btn('Mark complete','visaDo('+i+')'):s.s==='d'?'<span class="bdg bg2">Done</span>':'<span class="bdg" style="background:#F0F0F0;color:#999">Locked</span>')+'</div>';}).join(''));};

  window.emiCalc=function(){var P=+val('ea')||2000000,n=+val('et')||120,rt=+val('er')||10.5,r=rt/1200,e=r>0?P*r*Math.pow(1+r,n)/(Math.pow(1+r,n)-1):P/n,tot=e*n;set('eaV','₹'+Math.round(P).toLocaleString('en-IN'));set('etV',n+' months');set('erV',rt+'%');set('eOut','₹'+Math.round(e).toLocaleString('en-IN'));set('eInt','₹'+Math.round(tot-P).toLocaleString('en-IN'));set('eTot','₹'+Math.round(tot).toLocaleString('en-IN'));};
  function val(id){var e=document.getElementById(id);return e?e.value:'';}
  function set(id,v){var e=document.getElementById(id);if(e)e.textContent=v;}
  PAGE_finance=function(){return hdr('Loans & Finance','Elee-powered loan matching · EMI planner',btn('🤖 Find best loan','__toast(\'Elee is comparing 12 lenders…\')'))
    +'<div style="background:'+G+';border-radius:14px;padding:18px 20px;color:#fff;margin-bottom:12px"><div style="font-size:10px;opacity:.85;text-transform:uppercase;font-weight:700">Elee\'s recommendation</div><div style="font-family:'+HEAD+';font-size:22px;font-weight:800;margin:4px 0">You qualify for up to ₹45,00,000</div><div style="font-size:12px;opacity:.9">HDFC Credila · 10.5% p.a. · no collateral for UK</div></div>'
    +card('<strong>🧮 EMI Calculator</strong><div style="display:grid;grid-template-columns:1fr;gap:2px">'
      +'<div style="display:flex;justify-content:space-between;font-size:12px;color:#555;margin-bottom:4px"><span>Loan amount</span><b id="eaV">₹20,00,000</b></div><input id="ea" type="range" min="100000" max="10000000" step="100000" value="2000000" oninput="emiCalc()" style="width:100%;accent-color:#3AAA35;margin-bottom:12px">'
      +'<div style="display:flex;justify-content:space-between;font-size:12px;color:#555;margin-bottom:4px"><span>Tenure</span><b id="etV">120 months</b></div><input id="et" type="range" min="12" max="180" step="6" value="120" oninput="emiCalc()" style="width:100%;accent-color:#3AAA35;margin-bottom:12px">'
      +'<div style="display:flex;justify-content:space-between;font-size:12px;color:#555;margin-bottom:4px"><span>Interest rate</span><b id="erV">10.5%</b></div><input id="er" type="range" min="7" max="15" step="0.25" value="10.5" oninput="emiCalc()" style="width:100%;accent-color:#3AAA35">'
      +'</div><div style="display:flex;gap:10px;margin-top:14px;text-align:center"><div style="flex:1;background:#EAF6EF;border-radius:10px;padding:12px"><div style="font-size:10px;color:#0d7548;text-transform:uppercase;font-weight:700">Monthly EMI</div><div id="eOut" style="font-family:'+HEAD+';font-size:20px;font-weight:800;color:#0d7548">₹26,987</div></div><div style="flex:1;background:#FAFAFA;border:1px solid #EEE;border-radius:10px;padding:12px"><div style="font-size:10px;color:#888;text-transform:uppercase;font-weight:700">Total interest</div><div id="eInt" style="font-family:'+HEAD+';font-size:16px;font-weight:700;color:#1C2442;margin-top:2px">₹12.4L</div></div><div style="flex:1;background:#FAFAFA;border:1px solid #EEE;border-radius:10px;padding:12px"><div style="font-size:10px;color:#888;text-transform:uppercase;font-weight:700">Total payable</div><div id="eTot" style="font-family:'+HEAD+';font-size:16px;font-weight:700;color:#1C2442;margin-top:2px">₹32.4L</div></div></div>');};
  PAGE_loans=PAGE_finance;

  PAGE_profile=function(){return hdr('My Profile','Your student file — used across applications, visa &amp; counselling',btn('Edit profile','__toast(\'Opening profile editor…\')'))
    +'<div class="stucard" style="margin-bottom:12px"><div class="stucard-top"><div class="stucard-avring"><img src="https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=160&h=160&fit=crop&crop=faces" alt="Arjun"></div><div class="stucard-info"><div class="stucard-nm">Arjun Sharma</div><div class="stucard-id">ELV-2026-04817 · MSc CS · UK Sep 2026</div><div class="stucard-loc">📍 Gurugram, Haryana</div></div><div class="stucard-badge">Aspiring MSc in<br>Computer Science</div></div><div class="stucard-plbl">Profile completeness</div><div class="stucard-prow"><div class="stucard-pbar"><div class="stucard-pfill" style="width:78%"></div></div><div class="stucard-ppct">78%</div></div></div>'
    +'<div class="kg" style="margin-bottom:12px"><div class="kc"><div>Academic</div><div class="kv">90%</div><div class="ks" style="color:#059669">strong</div></div><div class="kc"><div>Test Scores</div><div class="kv">85%</div><div class="ks" style="color:#2563EB">IELTS 7.5</div></div><div class="kc"><div>SOP &amp; LOR</div><div class="kv">70%</div><div class="ks" style="color:var(--org)">in review</div></div><div class="kc"><div>Work</div><div class="kv">65%</div><div class="ks">add projects</div></div></div>'
    +card('<strong>🎓 Education</strong><div class="ar2"><span>B.Tech · Computer Science · VTU</span><span class="bdg bg2">8.2 CGPA · 2024</span></div>')
    +card('<strong>🗣 Test scores</strong><div class="ar2"><span>IELTS</span><span class="bdg bg2">7.5 overall</span></div><div class="ar2"><span>GRE</span><span class="bdg" style="background:#F5F5F5;color:#888">Not added</span></div>');};

  function simple(title,sub,icon,pts,action){return hdr(title,sub,action?btn(action,'__toast(\''+action+'…\')'):'')
    +card('<div style="text-align:center;padding:14px 8px"><div style="font-size:36px;margin-bottom:8px">'+icon+'</div><div style="font-family:'+HEAD+';font-size:15px;font-weight:700;color:#1C2442;margin-bottom:6px">'+title+'</div><div style="font-size:12px;color:#888;max-width:420px;margin:0 auto;line-height:1.6">'+sub+'</div></div>')
    +grid(180,pts.map(function(p){return card('<div style="font-weight:700;color:#1C2442;font-size:12.5px;margin-bottom:4px">'+p[0]+'</div><div style="font-size:11px;color:#888;line-height:1.5">'+p[1]+'</div>');}).join(''));}
  PAGE_psychometric=function(){return simple('Psychometric Test','Your personality and aptitude profile guides university and career fit.','🧪',[['Result','Analytical · Investigative'],['Best-fit fields','CS, Data, AI/ML'],['Work style','Independent, detail-led']],'Retake test');};
  PAGE_testprep=function(){return simple('Test Prep','Structured IELTS, GRE &amp; GMAT courses with AI feedback on writing and speaking.','📘',[['IELTS','Completed · 7.5'],['GRE Verbal','20% complete'],['Mock tests','Take a timed mock']],'Open exam prep');};
  PAGE_sop=function(){return simple('SOP &amp; LOR','Draft, review and finalise your statement of purpose and recommendation letters with Elee.','✍',[['Manchester SOP','Final draft ready'],['UCL SOP','In review'],['LORs','2 of 2 received']],'Review SOP');};
  PAGE_interview=function(){return simple('Interview Prep','Practise common admission and visa interview questions with AI mock interviews.','🎤',[['Mock interviews','2 completed'],['Confidence score','82%'],['Next','Visa interview drill']],'Start mock interview');};
  PAGE_accommodation=function(){return simple('Accommodation','Student housing near your university — halls, studios, shared flats and homestays.','🏠',[['Options near you','120+ · Manchester'],['From','£110 / week'],['Saved','2 shortlisted']],'Find my match');};
  PAGE_upskilling=function(){return simple('Upskilling','Short courses in analytics, coding and communication to strengthen your profile.','🚀',[['Recommended','Python for Data'],['Certificates','Shareable on LinkedIn'],['Language lab','Live speaking practice']],'Browse programs');};
  PAGE_career=function(){return simple('Career &amp; Jobs','Explore careers, connect with alumni and find jobs &amp; internships abroad.','🎯',[['Alumni','Connect at Manchester'],['Job board','3 new matches'],['Internships','Apply from your profile']],'Explore careers');};
  PAGE_counsellor=function(){return hdr('My Counsellor','Your dedicated study-abroad expert')
    +'<div class="ccc"><div class="cct"><div style="font-size:9px;opacity:.8;text-transform:uppercase">Next session</div><div style="font-size:17px;font-weight:700">Thursday, 3 Jul · 3:00 PM</div><div style="font-size:11px;opacity:.8">45 min · Video Call</div></div><div class="ccbd"><div><strong>Priya Kapoor</strong><div style="font-size:10px;color:#888">Senior Counsellor · UK Specialist · 6 yrs</div></div><div class="ccst"><div class="ccsv"><strong>12</strong><div style="font-size:9px">Sessions</div></div><div class="ccsv"><strong>3</strong><div style="font-size:9px">Tasks</div></div><div class="ccsv"><strong>4.9★</strong><div style="font-size:9px">Rating</div></div></div><div class="ccbs"><button class="ccbj" onclick="__toast(\'Joining call…\')">Join Call</button><button class="ccbm" onclick="__toast(\'Messaging Priya…\')">Message</button></div></div></div>';};
  PAGE_more=function(){var items=[['profile','🧩','My Profile'],['universities','🏫','Universities'],['applications','📋','Applications'],['scholarships','🏆','Scholarships'],['visa','🛂','Visa Tracker'],['documents','📁','Documents'],['loans','💳','Loans & Finance'],['career','🎯','Career & Jobs'],['accommodation','🏠','Accommodation'],['upskilling','🚀','Upskilling']];
    return hdr('More','All your Eleevate tools')+card(items.map(function(it){return '<div class="ar2" style="cursor:pointer" onclick="__render(\''+it[0]+'\')"><span>'+it[1]+' '+it[2]+'</span><span style="color:#ccc">›</span></div>';}).join(''));};

  var PAGES={universities:PAGE_universities,applications:PAGE_applications,scholarships:PAGE_scholarships,documents:PAGE_documents,visa:PAGE_visa,finance:PAGE_finance,loans:PAGE_loans,profile:PAGE_profile,psychometric:PAGE_psychometric,testprep:PAGE_testprep,sop:PAGE_sop,interview:PAGE_interview,accommodation:PAGE_accommodation,upskilling:PAGE_upskilling,career:PAGE_career,counsellor:PAGE_counsellor,more:PAGE_more};

  /* ---------- render / router ---------- */
  function render(v){
    current=v;
    if(v==='dashboard'){host.innerHTML=HOME;wireDash();}
    else if(PAGES[v]){host.innerHTML=PAGES[v]();if(v==='finance'||v==='loans')emiCalc();}
    else{toast('Opening '+v+'…');return;}
    (host.scrollTo?host.scrollTo(0,0):0);
  }
  window.__render=render;
  function isM(){return !!document.querySelector('.appbody');}

  /* ---------- nav wiring ---------- */
  var NAVMAP={'dashboard':'dashboard','my profile':'profile','psychometric test':'psychometric','universities':'universities','applications':'applications','scholarships':'scholarships','test prep':'testprep','sop & lor':'sop','interview prep':'interview','visa tracker':'visa','documents':'documents','loan assistance':'loans','finance & forex':'finance','accommodation':'accommodation','upskilling':'upskilling','career & jobs':'career'};
  on('.ni',function(el){
    var t=(txt(el.querySelector('.nit'))||txt(el)).toLowerCase();
    if(/sign out/i.test(t)){toast('Signing out…');return;}
    if(/settings/i.test(t)){toast('Opening Settings…');return;}
    var v=NAVMAP[t];if(!v){toast('Opening…');return;}
    document.querySelectorAll('.ni').forEach(function(n){n.classList.remove('act');});el.classList.add('act');
    render(v);
  });
  var TABMAP={'home':'dashboard','application':'applications','docs':'documents','counsellor':'counsellor','more':'more'};
  on('.tabitem',function(el){
    document.querySelectorAll('.tabitem').forEach(function(n){n.classList.remove('act');});el.classList.add('act');
    var key=(txt(el)||'home').toLowerCase();render(TABMAP[key]||'dashboard');
  });

  /* ---------- persistent buttons ---------- */
  on('.refbtn,.icbtn.ref',function(){toast('🎁 Refer & Earn — your code: ARJUN2026');});
  on('.icbtn:not(.ref)',function(){toast('🔔 3 new notifications');});
  on('.sbcc-b',function(){toast('📞 Joining counsellor call…');});

  /* ---------- dashboard-internal element toasts (re-run on each dashboard view) ---------- */
  function wireDash(){
    on('.ubb,.ub-btn',function(el){toast(/upgrade/i.test(txt(el))?'Upgrade to Pro — ₹999/mo':'On it — opening…');});
    on('.nud button',function(){render('documents');});
    on('.btn',function(el){toast(txt(el).replace(/^[^A-Za-z]+/,''));});
    on('.ccbj',function(){toast('📞 Joining counsellor call…');});
    on('.ccbm',function(){toast('💬 Messaging Priya Kapoor…');});
    on('.kc',function(el){var k=txt(el.querySelector('div'));var m={'applications':'applications','documents':'documents','visa progress':'visa','scholarships':'scholarships'};var v=m[(k||'').toLowerCase()];if(v)render(v);else toast('Opening '+k+'…');});
    on('.ai',function(el){toast(txt(el.querySelector('strong'))||'Action started');});
    on('.ar2',function(el){render('applications');});
    on('.dr',function(el){var s=txt(el.querySelector('span'));toast(s?('Opening '+s+'…'):'Opening…');});
  }
  wireDash();

  /* ---------- Elee chat ---------- */
  var chip="background:#fff;border:1px solid #E5E5E5;border-radius:999px;padding:6px 11px;font:600 11px "+F+";cursor:pointer;color:#1C2442";
  var replies={shortlist:"🎓 Based on your profile (IELTS 7.5, B.Tech, 8.2 GPA) I've shortlisted 5 top MSc CS programmes in the UK. Want me to start applications?",visa:"🛂 Your UK visa is 50% complete. Pending: IHS payment, updated bank statement and biometrics. Shall I book your biometrics slot?",loan:"💰 You qualify for up to ₹45L via HDFC Credila at 10.5% p.a. Want me to begin the pre-approval?",docs:"📁 You have 3 documents pending for UCL — bank statement and IELTS scorecard are the priority. Upload now?"};
  var panel;
  function bubble(who,text){var b=document.createElement('div');b.textContent=text;b.style.cssText=who==='ai'?"align-self:flex-start;max-width:82%;background:#fff;border:1px solid #ECECEC;color:#333;padding:9px 12px;border-radius:12px 12px 12px 4px;font:400 12.5px "+F+";line-height:1.5":"align-self:flex-end;max-width:82%;background:#009FE3;color:#fff;padding:9px 12px;border-radius:12px 12px 4px 12px;font:500 12.5px "+F;var body=document.getElementById('eleeBody');body.appendChild(b);body.scrollTop=body.scrollHeight;}
  function buildPanel(){panel=document.createElement('div');panel.style.cssText="position:fixed;right:24px;bottom:100px;width:334px;max-width:calc(100vw - 24px);background:#fff;border-radius:18px;box-shadow:0 18px 50px rgba(0,0,0,.28);overflow:hidden;display:none;z-index:99998;font-family:"+F;
    panel.innerHTML='<div style="background:linear-gradient(135deg,#00A699,#009FE3,#7C3AED);color:#fff;padding:13px 15px;display:flex;align-items:center;justify-content:space-between"><div style="display:flex;align-items:center;gap:9px"><div style="width:30px;height:30px;border-radius:50%;background:rgba(255,255,255,.2);display:flex;align-items:center;justify-content:center;font-size:16px">🤖</div><div><div style="font-weight:700;font-size:14px">Elee</div><div style="font-size:10px;opacity:.85">Your AI counsellor · online</div></div></div><button id="eleeX" style="background:rgba(255,255,255,.16);border:none;color:#fff;width:26px;height:26px;border-radius:7px;cursor:pointer;font-size:14px">✕</button></div><div id="eleeBody" style="padding:14px;height:280px;overflow-y:auto;display:flex;flex-direction:column;gap:9px;background:#F6F7FA"></div><div style="padding:9px 12px;display:flex;gap:6px;flex-wrap:wrap;border-top:1px solid #EEE;background:#fff"><button class="eq" data-q="shortlist" style="'+chip+'">🎓 Shortlist</button><button class="eq" data-q="visa" style="'+chip+'">🛂 Visa</button><button class="eq" data-q="loan" style="'+chip+'">💰 Loan</button><button class="eq" data-q="docs" style="'+chip+'">📁 Documents</button></div><div style="padding:10px 12px;display:flex;gap:8px;border-top:1px solid #EEE;background:#fff"><input id="eleeIn" placeholder="Ask Elee anything…" style="flex:1;border:1px solid #E5E5E5;border-radius:9px;padding:9px 12px;font:400 13px '+F+';outline:none"><button id="eleeSend" style="background:#009FE3;border:none;color:#fff;width:40px;border-radius:9px;cursor:pointer;font-size:15px">➤</button></div>';
    document.body.appendChild(panel);bubble('ai',"Hi Arjun! I'm Elee, your AI counsellor. I can shortlist universities, track your visa, arrange loans and check documents. What would you like to do?");
    panel.querySelector('#eleeX').addEventListener('click',toggleElee);
    panel.querySelectorAll('.eq').forEach(function(b){b.addEventListener('click',function(){bubble('user',b.textContent.trim());setTimeout(function(){bubble('ai',replies[b.dataset.q]);},450);});});
    var input=panel.querySelector('#eleeIn');function send(){var v=input.value.trim();if(!v)return;bubble('user',v);input.value='';setTimeout(function(){bubble('ai','⚡ On it — working on that for you now. Give me a moment…');},500);}
    panel.querySelector('#eleeSend').addEventListener('click',send);input.addEventListener('keydown',function(e){if(e.key==='Enter')send();});}
  function toggleElee(){if(!panel)buildPanel();panel.style.display=panel.style.display==='none'?'block':'none';}
  var fab=document.querySelector('.elee-fab')||document.querySelector('.fab');if(fab)fab.addEventListener('click',toggleElee);
})();
