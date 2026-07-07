/* MVP behaviour layer — adds interactivity without changing the design.
   Shared by desktop.html and mobile.html. */
(function(){
  var F="Poppins,system-ui,sans-serif";

  /* ---- toast ---- */
  var tw=document.createElement('div');
  tw.style.cssText="position:fixed;left:50%;bottom:26px;transform:translateX(-50%);z-index:99999;display:flex;flex-direction:column;gap:8px;align-items:center;pointer-events:none";
  document.body.appendChild(tw);
  function toast(m){
    var t=document.createElement('div');t.textContent=m;
    t.style.cssText="background:#1C2442;color:#fff;padding:10px 16px;border-radius:10px;font:600 12.5px "+F+";box-shadow:0 8px 24px rgba(0,0,0,.28);opacity:0;transform:translateY(8px);transition:.2s;max-width:90vw;text-align:center";
    tw.appendChild(t);requestAnimationFrame(function(){t.style.opacity=1;t.style.transform='none';});
    setTimeout(function(){t.style.opacity=0;t.style.transform='translateY(6px)';setTimeout(function(){t.remove();},250);},2100);
  }
  window.__toast=toast;

  function on(sel,fn){document.querySelectorAll(sel).forEach(function(el){el.style.cursor='pointer';el.addEventListener('click',function(e){e.stopPropagation();fn(el,e);});});}
  function txt(el){return (el&&el.textContent||'').replace(/\s+/g,' ').trim();}

  /* ---- desktop sidebar nav ---- */
  on('.ni',function(el){
    var t=txt(el.querySelector('.nit'))||txt(el);
    if(/sign out/i.test(t)){toast('Signing out…');return;}
    if(el.classList.contains('sb-acct')||/settings/i.test(t)){toast('Opening Settings…');return;}
    document.querySelectorAll('.ni').forEach(function(n){n.classList.remove('act');});
    el.classList.add('act');
    toast(/dashboard/i.test(t)?'Dashboard':'Opening '+t+'…');
    var mc=document.querySelector('.mc');if(mc)mc.scrollTo({top:0,behavior:'smooth'});
  });

  /* ---- mobile bottom tabs ---- */
  on('.tabitem',function(el){
    document.querySelectorAll('.tabitem').forEach(function(n){n.classList.remove('act');});
    el.classList.add('act');
    var t=txt(el);toast(t||'Home');
    var ab=document.querySelector('.appbody');if(ab)ab.scrollTo({top:0,behavior:'smooth'});
  });

  /* ---- buttons & tiles ---- */
  on('.refbtn,.icbtn.ref',function(){toast('🎁 Refer & Earn — your code: ARJUN2026');});
  on('.icbtn:not(.ref)',function(){toast('🔔 3 new notifications');});
  on('.ubb,.ub-btn',function(el){toast(/upgrade/i.test(txt(el))?'Upgrade to Pro — ₹999/mo':'On it — opening…');});
  on('.nud button',function(){toast('Opening document upload…');});
  on('.btn',function(el){toast(txt(el).replace(/^[^A-Za-z]+/,''));});
  on('.ccbj,.sbcc-b',function(){toast('📞 Joining counsellor call…');});
  on('.ccbm',function(){toast('💬 Messaging Priya Kapoor…');});
  on('.kc',function(el){toast('Opening '+(txt(el.querySelector('div'))||'details')+'…');});
  on('.ai',function(el){toast(txt(el.querySelector('strong'))||'Action started');});
  on('.ar2,.dr',function(el){var s=txt(el.querySelector('span'));toast(s?('Opening '+s+'…'):'Opening…');});

  /* ---- Elee chat (desktop .elee-fab / mobile .fab) ---- */
  var chip="background:#fff;border:1px solid #E5E5E5;border-radius:999px;padding:6px 11px;font:600 11px "+F+";cursor:pointer;color:#1C2442";
  var replies={
    shortlist:"🎓 Based on your profile (IELTS 7.5, B.Tech, 8.2 GPA) I've shortlisted 5 top MSc CS programmes in the UK. Want me to start applications?",
    visa:"🛂 Your UK visa is 50% complete. Pending: IHS payment, updated bank statement and biometrics. Shall I book your biometrics slot?",
    loan:"💰 You qualify for up to ₹45L via HDFC Credila at 10.5% p.a. Want me to begin the pre-approval?",
    docs:"📁 You have 3 documents pending for UCL — bank statement and IELTS scorecard are the priority. Upload now?"
  };
  var panel;
  function bubble(who,text){
    var b=document.createElement('div');
    b.textContent=text;
    b.style.cssText=who==='ai'
      ? "align-self:flex-start;max-width:82%;background:#fff;border:1px solid #ECECEC;color:#333;padding:9px 12px;border-radius:12px 12px 12px 4px;font:400 12.5px "+F+";line-height:1.5"
      : "align-self:flex-end;max-width:82%;background:#009FE3;color:#fff;padding:9px 12px;border-radius:12px 12px 4px 12px;font:500 12.5px "+F+"";
    var body=document.getElementById('eleeBody');body.appendChild(b);body.scrollTop=body.scrollHeight;
  }
  function buildPanel(){
    panel=document.createElement('div');
    panel.style.cssText="position:fixed;right:24px;bottom:100px;width:334px;max-width:calc(100vw - 24px);background:#fff;border-radius:18px;box-shadow:0 18px 50px rgba(0,0,0,.28);overflow:hidden;display:none;z-index:99998;font-family:"+F;
    panel.innerHTML=
      '<div style="background:linear-gradient(135deg,#00A699,#009FE3,#7C3AED);color:#fff;padding:13px 15px;display:flex;align-items:center;justify-content:space-between">'
      +'<div style="display:flex;align-items:center;gap:9px"><div style="width:30px;height:30px;border-radius:50%;background:rgba(255,255,255,.2);display:flex;align-items:center;justify-content:center;font-size:16px">🤖</div><div><div style="font-weight:700;font-size:14px">Elee</div><div style="font-size:10px;opacity:.85">Your AI counsellor · online</div></div></div>'
      +'<button id="eleeX" style="background:rgba(255,255,255,.16);border:none;color:#fff;width:26px;height:26px;border-radius:7px;cursor:pointer;font-size:14px">✕</button></div>'
      +'<div id="eleeBody" style="padding:14px;height:280px;overflow-y:auto;display:flex;flex-direction:column;gap:9px;background:#F6F7FA"></div>'
      +'<div style="padding:9px 12px;display:flex;gap:6px;flex-wrap:wrap;border-top:1px solid #EEE;background:#fff">'
        +'<button class="eq" data-q="shortlist" style="'+chip+'">🎓 Shortlist</button>'
        +'<button class="eq" data-q="visa" style="'+chip+'">🛂 Visa</button>'
        +'<button class="eq" data-q="loan" style="'+chip+'">💰 Loan</button>'
        +'<button class="eq" data-q="docs" style="'+chip+'">📁 Documents</button></div>'
      +'<div style="padding:10px 12px;display:flex;gap:8px;border-top:1px solid #EEE;background:#fff"><input id="eleeIn" placeholder="Ask Elee anything…" style="flex:1;border:1px solid #E5E5E5;border-radius:9px;padding:9px 12px;font:400 13px '+F+';outline:none"><button id="eleeSend" style="background:#009FE3;border:none;color:#fff;width:40px;border-radius:9px;cursor:pointer;font-size:15px">➤</button></div>';
    document.body.appendChild(panel);
    bubble('ai',"Hi Arjun! I'm Elee, your AI counsellor. I can shortlist universities, track your visa, arrange loans and check documents. What would you like to do?");
    panel.querySelector('#eleeX').addEventListener('click',toggleElee);
    panel.querySelectorAll('.eq').forEach(function(b){b.addEventListener('click',function(){bubble('user',b.textContent.trim());setTimeout(function(){bubble('ai',replies[b.dataset.q]);},450);});});
    var input=panel.querySelector('#eleeIn');
    function send(){var v=input.value.trim();if(!v)return;bubble('user',v);input.value='';setTimeout(function(){bubble('ai','⚡ On it — I\'m working on that for you right now. Give me a moment…');},500);}
    panel.querySelector('#eleeSend').addEventListener('click',send);
    input.addEventListener('keydown',function(e){if(e.key==='Enter')send();});
  }
  function toggleElee(){if(!panel)buildPanel();panel.style.display=panel.style.display==='none'?'block':'none';}
  var fab=document.querySelector('.elee-fab')||document.querySelector('.fab');
  if(fab)fab.addEventListener('click',toggleElee);
})();
