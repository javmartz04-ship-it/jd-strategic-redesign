(function(){
  'use strict';
  var RM = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* arrival is sequenced off the webfonts so a mask reveal never plays against a fallback face */
  function ready(){ document.body.classList.add('ready'); }
  if (RM) { ready(); }
  else if (document.fonts && document.fonts.ready) { document.fonts.ready.then(function(){ requestAnimationFrame(ready); }); setTimeout(ready, 1800); }
  else { requestAnimationFrame(ready); }

  /* nav: transparent island over the page, condenses on scroll, reads the ground under it (the real element, never a blend mode) */
  var nav=document.getElementById('nav'), prog=document.getElementById('navProg'), tick=false;
  function groundAt(y){
    var els=document.elementsFromPoint(Math.round(window.innerWidth/2), Math.round(y));
    for(var i=0;i<els.length;i++){
      var e=els[i];
      if(e.closest('.nav')||e.closest('.mmenu')) continue;
      return !!e.closest('.dark,.page-head,.cred');
    }
    return false;
  }
  function onScroll(){
    var y=window.pageYOffset||document.documentElement.scrollTop;
    if(nav){
      nav.classList.toggle('stuck', y>10);
      var box=nav.firstElementChild.getBoundingClientRect();
      nav.classList.toggle('on-dark', groundAt(box.top+box.height/2));
    }
    if(prog){ var h=document.documentElement.scrollHeight-window.innerHeight; prog.style.transform='scaleX('+(h>0?Math.min(y/h,1):0)+')'; }
    tick=false;
  }
  window.addEventListener('scroll',function(){ if(!tick){tick=true;requestAnimationFrame(onScroll);} },{passive:true});
  window.addEventListener('resize',function(){ if(!tick){tick=true;requestAnimationFrame(onScroll);} },{passive:true});
  onScroll();

  /* mobile menu */
  var bg=document.getElementById('burger'), mm=document.getElementById('mmenu');
  if(bg&&mm){
    bg.addEventListener('click',function(){ var o=mm.classList.toggle('open'); bg.setAttribute('aria-expanded',o?'true':'false'); bg.setAttribute('aria-label',o?'Close menu':'Open menu'); document.documentElement.style.overflow=o?'hidden':''; });
    mm.addEventListener('click',function(e){ if(e.target.closest('a')){ mm.classList.remove('open'); bg.setAttribute('aria-expanded','false'); document.documentElement.style.overflow=''; } });
  }

  /* reveals: text blocks and the clip-veil photographs, with a failsafe */
  var rev=[].slice.call(document.querySelectorAll('[data-r],[data-bleed]'));
  function revealAll(){ rev.forEach(function(el){ el.classList.add('in'); }); }
  if(RM || !('IntersectionObserver' in window)){ revealAll(); }
  else {
    var io=new IntersectionObserver(function(en){ en.forEach(function(e){ if(e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target); } }); },{rootMargin:'0px 0px -8% 0px',threshold:.06});
    rev.forEach(function(el){ io.observe(el); });
    setTimeout(revealAll,3500);
  }

  /* count up */
  var cs=[].slice.call(document.querySelectorAll('[data-count]'));
  function run(el){
    var t=parseFloat(el.getAttribute('data-count'))||0, comma=el.getAttribute('data-fmt')==='comma';
    if(RM){ el.textContent=comma?t.toLocaleString('en-US'):String(t); return; }
    var d=1500,t0=null;
    function step(ts){ if(t0===null)t0=ts; var p=Math.min((ts-t0)/d,1), e=1-Math.pow(1-p,3), v=Math.round(t*e); el.textContent=comma?v.toLocaleString('en-US'):String(v); if(p<1) requestAnimationFrame(step); }
    requestAnimationFrame(step);
  }
  if('IntersectionObserver' in window){ var cio=new IntersectionObserver(function(en){ en.forEach(function(e){ if(e.isIntersecting){ run(e.target); cio.unobserve(e.target); } }); },{threshold:.4}); cs.forEach(function(el){ cio.observe(el); }); setTimeout(function(){ cs.forEach(run); },3500); } else { cs.forEach(run); }

  /* the guest belt on the podcast page */
  var GUESTS=[['Doc Cohen','First franchisee, Great American Cookies. Former IFA chairman'],['Eric Martin','SVP of franchise development, Happinest Brands'],['Sandler’s Executive Chairman','Sales success strategies'],['Andy Fuller','Founder and CEO, Mosquito Hunters'],['Jolita Brilliant','Founder, Brilliant Massage and Skin'],['A Franchise Hall of Famer','250+ franchisees, scaled'],['Multi-unit operators','On what year five actually looks like']];
  function guestHTML(){ return GUESTS.map(function(g){ return '<span class="gitem">'+g[0]+'<span>'+g[1]+'</span></span>'; }).join(''); }
  function fill(aId,bId,html,minW){
    var a=document.getElementById(aId), b=document.getElementById(bId); if(!a||!b) return;
    var pass=html, g=0; a.innerHTML=pass;
    while(a.getBoundingClientRect().width<minW && g<6){ pass+=html; a.innerHTML=pass; g++; }
    b.innerHTML=pass;
  }
  fill('gA','gB',guestHTML(),3600);

  /* fit finder: Josh's abbreviated questionnaire ("Find My Franchise Fit"), one step per screen, on the page.
     FIT_ENDPOINT stays empty until the GHL inbound webhook is chosen: with it empty the form validates,
     saves the submission locally and shows the thank-you, and nothing leaves the browser. */
  var FIT_ENDPOINT='';
  var FIT_KEY='jds_fit_v1';
  var fit=document.getElementById('fit'), stage=document.getElementById('fitStage');
  if(fit && stage){
    var ARROW='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';
    var BACK='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 12H5M11 18l-6-6 6-6"/></svg>';
    var OPEN='Open: show me what fits';
    var STEPS=[
      {id:'describe',t:'single',q:'What best describes you?',h:'I tailor your matches to your specific situation.',
       o:[['Corporate executive','considering a transition out of corporate'],['Business owner','expanding or adding a second income stream'],['Recently exited','redeploying capital from a business sale'],['New entrepreneur','recently left a job or looking to start something']]},
      {id:'categories',t:'multi',q:'Which categories interest you?',h:'Select all that apply, or choose "show me what fits" and I will lead with the match.',cols:3,
       o:['Health, Wellness & Beauty','Senior Care','Home Improvement & Services','Cleaning Services','B2B & Business Services','Pet Services','Food & Beverage','Child Services & Education','Fitness & Sports','Automotive','Real Estate & Property','Restoration & Repair',OPEN]},
      {id:'timeline',t:'single',q:'What is your investment timeline?',h:'No wrong answer. This helps me calibrate the approach.',
       o:[['Ready now','let’s move'],['1 to 3 months','almost there'],['3 to 6 months','still evaluating'],['6 to 12 months','long-range planning']]},
      {id:'capital',t:'single',q:'How much liquid capital do you have available to invest?',h:'Liquid capital is money you can access quickly without selling long-term investments or major assets: cash, savings, money market. Not home equity or retirement funds.',cols:3,
       o:['$50K to $75K','$75K to $100K','$100K to $150K','$150K to $200K','$200K to $250K','$250K to $500K','$500K to $1M','$1M to $2M','$2M+'],foot:'Most opportunities I work with start around $50K liquid.'},
      {id:'tailor',t:'group',q:'A few last things to tailor your matches.',h:'Optional. The more I know, the sharper your matches.',skip:true,
       groups:[{id:'role',l:'What role do you picture?',o:['Owner-operator, hands-on day to day','Executive, managing a team while you focus on growth','Not sure yet']},
               {id:'scale',l:'Do you want to scale?',o:['A single unit is fine','Grow into multiple units or territories','Not sure yet']},
               {id:'setting',l:'What kind of setting do you picture?',o:['Home-based','Office-based','Brick-and-mortar or retail','No preference']},
               {id:'matters',l:'What matters most to you?',o:['Recession-resistant, stable demand','Recurring revenue','Being able to scale and build something bigger']}],
       texts:[{id:'background',l:'Your current or most recent role, and the skills you want to bring into a business',ph:'A sentence or two'},{id:'notes',l:'Anything else that would help me tailor your options?',ph:'Optional'}]},
      {id:'contact',t:'contact',q:'Almost done. Where should I reach you?',h:'I review your answers personally and follow up within one business day.'}
    ];
    var A={}, idx=0;
    try{ A=JSON.parse(localStorage.getItem(FIT_KEY)||'{}')||{}; }catch(e){ A={}; }
    if(A.__done){ A={}; }
    try{ var qc=new URLSearchParams(location.search).get('cat'); if(qc){ var allc=STEPS[1].o; if(allc.indexOf(qc)>-1){ A.categories=[qc]; A.__cat=qc; save(); } } }catch(e){}
    function save(){ try{ localStorage.setItem(FIT_KEY,JSON.stringify(A)); }catch(e){} }
    function esc(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
    function answered(s){
      if(s.t==='single') return !!A[s.id];
      if(s.t==='multi') return Array.isArray(A[s.id]) && A[s.id].length>0;
      return true;
    }
    var stepEl=fit.querySelector('.fitstep'), bar=fit.querySelector('.fitbar');
    function head(){
      if(stepEl) stepEl.textContent='Step '+(idx+1)+' of '+STEPS.length;
      if(bar) [].slice.call(bar.children).forEach(function(i,k){ i.classList.toggle('on',k<=idx); });
    }
    function opt(s,label,sub,on,multi){
      return '<button type="button" class="fitopt'+(multi?' multi':'')+'" data-v="'+esc(label)+'" '+(multi?'aria-pressed="'+on+'"':'role="radio" aria-checked="'+on+'"')+'><b>'+esc(label)+'</b>'+(sub?'<span>'+esc(sub)+'</span>':'')+'</button>';
    }
    function chips(){
      var out=[];
      if(A.describe) out.push(A.describe);
      if(Array.isArray(A.categories)&&A.categories.length){ var c=A.categories.slice(0,2).join(' · '); if(A.categories.length>2) c+=' +'+(A.categories.length-2); out.push(c); }
      if(A.timeline) out.push(A.timeline);
      if(A.capital) out.push(A.capital);
      return out.length?'<div class="chips" aria-label="Your answers so far">'+out.map(function(x){ return '<span>'+esc(x)+'</span>'; }).join('')+'</div>':'';
    }
    function field(id,label,req,opts){
      opts=opts||{};
      var v=A[id]?esc(A[id]):'';
      var inner;
      if(opts.select){ inner='<select name="'+id+'"><option value="">Select a range</option>'+opts.select.map(function(o){ return '<option value="'+esc(o)+'"'+(A[id]===o?' selected':'')+'>'+esc(o)+'</option>'; }).join('')+'</select>'; }
      else if(opts.area){ inner='<textarea name="'+id+'" placeholder="'+esc(opts.ph||'')+'">'+v+'</textarea>'; }
      else { inner='<input name="'+id+'" type="'+(opts.type||'text')+'" value="'+v+'" placeholder="'+esc(opts.ph||'')+'" autocomplete="'+(opts.ac||'off')+'"'+(opts.im?' inputmode="'+opts.im+'"':'')+'>'; }
      return '<label class="fitfield'+(opts.wide?' wide':'')+'"><span class="fl">'+esc(label)+(req?' <em aria-hidden="true">*</em>':'')+'</span>'+inner+'<span class="fiterr">'+esc(opts.err||'Please fill this in.')+'</span></label>';
    }
    function nav(s){
      var h='<div class="fitnav">';
      if(idx>0) h+='<button type="button" class="btn btn-ghost" data-act="back">'+BACK+'Back</button>';
      if(s.t==='multi'||s.t==='group') h+='<button type="button" class="btn btn-accent" data-act="next">Continue'+ARROW+'</button>';
      if(s.t==='contact') h+='<button type="button" class="btn btn-accent" data-act="submit">Get My Matches'+ARROW+'</button>';
      if(s.skip) h+='<button type="button" class="fitskip" data-act="skip">Skip to contact</button>';
      if(s.t==='single') h+='<p class="reassure">Pick one to continue. About two minutes, and it saves as you go.</p>';
      if(s.t==='contact') h+='<p class="reassure">Confidential. Josh only, never a franchisor.</p>';
      return h+'</div>';
    }
    function render(){
      var s=STEPS[idx], h=(A.__cat&&idx===0?'<div class="chips" aria-label="Industry"><span>'+esc(A.__cat)+'</span></div>':'')+'<h3 class="fitq" id="fitQ">'+esc(s.q)+'</h3>'+(s.h?'<p class="fithint">'+esc(s.h)+'</p>':'');
      if(s.t==='single'){
        h+='<div class="fitopts'+(s.cols===3?' cols-3':'')+'" role="radiogroup" aria-labelledby="fitQ">'+s.o.map(function(o){ var l=Array.isArray(o)?o[0]:o, sub=Array.isArray(o)?o[1]:''; return opt(s,l,sub,A[s.id]===l,false); }).join('')+'</div>';
        if(s.foot) h+='<p class="fitfoot">'+esc(s.foot)+'</p>';
      } else if(s.t==='multi'){
        var cur=A[s.id]||[];
        h+='<div class="fitopts'+(s.cols===3?' cols-3':'')+'" aria-labelledby="fitQ">'+s.o.map(function(o){ return opt(s,o,'',cur.indexOf(o)>-1,true); }).join('')+'</div>';
      } else if(s.t==='group'){
        h+='<div class="fitgroups">'+s.groups.map(function(g){ return '<div class="fitgroup"><span class="gl">'+esc(g.l)+'</span><div class="fitrow" role="radiogroup" aria-label="'+esc(g.l)+'" data-g="'+g.id+'">'+g.o.map(function(o){ return opt(s,o,'',A[g.id]===o,false).replace('class="fitopt"','class="fitopt" data-g="'+g.id+'"'); }).join('')+'</div></div>'; }).join('')+
           '<div class="fitgroup"><div class="fitfields">'+s.texts.map(function(t){ return field(t.id,t.l,false,{area:true,wide:true,ph:t.ph}); }).join('')+'</div></div></div>';
      } else if(s.t==='contact'){
        h+=chips()+'<div class="fitfields">'+
          field('first','First name',true,{ac:'given-name',ph:'First'})+field('last','Last name',true,{ac:'family-name',ph:'Last'})+
          field('email','Email',true,{type:'email',ac:'email',ph:'you@company.com',err:'Enter a valid email address.'})+field('phone','Phone',true,{type:'tel',ac:'tel',im:'tel',ph:'(555) 000-0000',err:'Enter a 10-digit phone number.'})+
          field('markets','Target markets',true,{wide:true,ph:'Town or city and zip code(s), e.g. Naples, FL 34102, open to nearby'})+
          field('networth','Net worth (approximate)',false,{wide:true,select:['Under $250K','$250K to $500K','$500K to $1M','$1M to $2M','$2M to $5M','$5M+']})+
          '</div><label class="consent"><input type="checkbox" name="consent"'+(A.consent?' checked':'')+'><span>I agree to be contacted by JD Strategic Franchising. By providing my phone number, I agree to receive text messages from the business.</span></label>';
      }
      h+=nav(s);
      stage.innerHTML=h; head();
    }
    function go(n){
      if(RM){ idx=n; render(); return; }
      stage.classList.add('out');
      setTimeout(function(){ idx=n; render(); stage.classList.remove('out'); var top=fit.querySelector('.fitbox').getBoundingClientRect().top; if(top<70) window.scrollBy({top:top-100,behavior:'smooth'}); },220);
    }
    function done(){
      A.__done=true; save();
      stage.innerHTML='<div class="fitdone"><div class="mark"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg></div><h3>Thanks, '+esc(A.first||'')+'. Your answers are in.</h3><p>I’ll review them and reach out within one business day with your top matches. If you would rather talk first, book a call and we will start there.</p><a class="btn btn-ghost" href="contact.html">Book a Call'+ARROW+'</a></div>';
      if(stepEl) stepEl.textContent='Done'; if(bar) [].slice.call(bar.children).forEach(function(i){ i.classList.add('on'); });
      try{ localStorage.removeItem(FIT_KEY); }catch(e){}
    }
    function submit(){
      var ok=true, box=stage;
      var req={first:/\S/,last:/\S/,email:/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/,phone:/^\d{10}$/,markets:/\S/};
      Object.keys(req).forEach(function(k){
        var el=box.querySelector('[name="'+k+'"]'), wrap=el.closest('.fitfield'); var v=el.value.trim(); if(k==='phone') v=v.replace(/\D/g,'');
        var good=req[k].test(v); wrap.classList.toggle('err',!good); if(!good) ok=false; else A[k]=(k==='phone')?v:el.value.trim();
      });
      var nw=box.querySelector('[name="networth"]'); if(nw&&nw.value) A.networth=nw.value;
      var c=box.querySelector('[name="consent"]'); var cl=c.closest('.consent'); cl.classList.toggle('err',!c.checked); if(!c.checked) ok=false; else A.consent=true;
      if(!ok){ var f=box.querySelector('.err'); if(f) f.scrollIntoView({block:'center',behavior:RM?'auto':'smooth'}); return; }
      delete A.__cat; A.submitted_at=new Date().toISOString(); A.source=location.pathname.indexOf('contact')>-1?'jdfranchising.com/contact':'jdfranchising.com/#fit';
      var payload=JSON.stringify(A);
      try{ localStorage.setItem('jds_fit_last',payload); }catch(e){}
      if(FIT_ENDPOINT){
        var b=box.querySelector('[data-act="submit"]'); if(b){ b.disabled=true; b.style.opacity='.6'; }
        fetch(FIT_ENDPOINT,{method:'POST',headers:{'Content-Type':'application/json'},body:payload}).then(function(){ done(); }).catch(function(){ done(); });
      } else { done(); }
    }
    stage.addEventListener('click',function(e){
      var b=e.target.closest('button'); if(!b) return;
      var s=STEPS[idx], act=b.getAttribute('data-act');
      if(act==='back'){ go(idx-1); return; }
      if(act==='skip'){ go(idx+1); return; }
      if(act==='next'){ if(!answered(s)){ var first=stage.querySelector('.fitopts'); if(first){ first.style.outline='1px solid #FFB27A'; setTimeout(function(){ first.style.outline=''; },900); } return; } go(idx+1); return; }
      if(act==='submit'){ submit(); return; }
      if(!b.classList.contains('fitopt')) return;
      var v=b.getAttribute('data-v');
      if(s.t==='single'){
        [].slice.call(stage.querySelectorAll('.fitopt')).forEach(function(x){ x.setAttribute('aria-checked','false'); });
        b.setAttribute('aria-checked','true'); A[s.id]=v; save();
        setTimeout(function(){ go(idx+1); },RM?0:360);
      } else if(s.t==='multi'){
        var list=A[s.id]||[];
        if(v===OPEN){ list=(list.indexOf(OPEN)>-1)?[]:[OPEN]; }
        else { list=list.filter(function(x){ return x!==OPEN; }); var at=list.indexOf(v); if(at>-1) list.splice(at,1); else list.push(v); }
        A[s.id]=list; save();
        [].slice.call(stage.querySelectorAll('.fitopt')).forEach(function(x){ x.setAttribute('aria-pressed',String(list.indexOf(x.getAttribute('data-v'))>-1)); });
      } else if(s.t==='group'){
        var g=b.getAttribute('data-g'); if(!g) return;
        [].slice.call(stage.querySelectorAll('.fitopt[data-g="'+g+'"]')).forEach(function(x){ x.setAttribute('aria-checked','false'); });
        b.setAttribute('aria-checked','true'); A[g]=v; save();
      }
    });
    stage.addEventListener('input',function(e){ var el=e.target; if(el.name && (el.tagName==='INPUT'||el.tagName==='TEXTAREA'||el.tagName==='SELECT')){ if(el.type==='checkbox'){ A.consent=el.checked; } else { A[el.name]=el.value; } save(); var w=el.closest('.fitfield'); if(w) w.classList.remove('err'); var c=el.closest('.consent'); if(c) c.classList.remove('err'); } });
    stage.addEventListener('keydown',function(e){ if(e.key==='Enter' && e.target.tagName==='INPUT' && STEPS[idx].t==='contact'){ e.preventDefault(); submit(); } });
    /* resume where they left off */
    for(var i=0;i<STEPS.length;i++){ if(STEPS[i].t==='single'||STEPS[i].t==='multi'){ if(!answered(STEPS[i])){ idx=i; break; } } idx=i; }
    if(idx>=STEPS.length) idx=STEPS.length-1;
    render();
  }

  /* category strip: native scroll-snap, arrows just nudge it */
  var strip=document.getElementById('strip');
  function nudge(dir){ if(!strip) return; var w=strip.querySelector('.cat'); var step=w?w.getBoundingClientRect().width+3:400; strip.scrollBy({left:dir*step,behavior:RM?'auto':'smooth'}); }
  var sp=document.getElementById('stripPrev'), sn=document.getElementById('stripNext');
  if(sp) sp.addEventListener('click',function(){ nudge(-1); });
  if(sn) sn.addEventListener('click',function(){ nudge(1); });

  /* faq */
  [].slice.call(document.querySelectorAll('.faq-q')).forEach(function(btn){
    var item=btn.parentNode, ans=item.querySelector('.faq-a');
    btn.addEventListener('click',function(){
      var open=item.classList.contains('open');
      [].slice.call(document.querySelectorAll('.faq-i.open')).forEach(function(o){ o.classList.remove('open'); o.querySelector('.faq-a').style.height='0px'; o.querySelector('.faq-q').setAttribute('aria-expanded','false'); });
      if(!open){ item.classList.add('open'); ans.style.height=ans.scrollHeight+'px'; btn.setAttribute('aria-expanded','true'); }
    });
  });
  window.addEventListener('resize',function(){ var o=document.querySelector('.faq-i.open'); if(o){ var a=o.querySelector('.faq-a'); a.style.height='auto'; a.style.height=a.scrollHeight+'px'; } });
})();

/* ================= podcast: every episode plays in the one stage, nothing links out ================= */
(function(){
  'use strict';
  var stage=document.getElementById('vstage'); if(!stage) return;
  var RM=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var run=document.getElementById('vRun'), title=document.getElementById('vTitle'), guest=document.getElementById('vGuest'), meta=document.getElementById('vMeta');
  function play(b){
    var id=b.getAttribute('data-play'); if(!id) return;
    var n=b.getAttribute('data-n'), t=b.getAttribute('data-t'), g=b.getAttribute('data-g')||'';
    var f=document.createElement('iframe');
    f.src='https://www.youtube-nocookie.com/embed/'+encodeURIComponent(id)+'?autoplay=1&rel=0&modestbranding=1&playsinline=1';
    f.title='Conquer the Mind, episode '+n+': '+t; f.allow='autoplay; encrypted-media; picture-in-picture; fullscreen'; f.setAttribute('allowfullscreen','');
    f.setAttribute('referrerpolicy','strict-origin-when-cross-origin');
    stage.innerHTML=''; stage.appendChild(f);
    if(run) run.textContent='Now playing · Episode '+n; if(title) title.textContent=t; if(guest) guest.innerHTML=g;
    var bl=document.getElementById('vBlurb'); if(bl && b.getAttribute('data-b')) bl.textContent=b.getAttribute('data-b');
    if(meta){ var mm=b.getAttribute('data-m'); meta.textContent=mm?(mm+' minutes'):''; }
    var top=stage.getBoundingClientRect().top+window.pageYOffset-100;
    if(!b.closest('#vstage')) window.scrollTo({top:top,behavior:RM?'auto':'smooth'});
  }
  document.addEventListener('click',function(e){ var b=e.target.closest('[data-play]'); if(b){ e.preventDefault(); play(b); } });
})();

/* ================= request an introduction: validates, stores locally until RFI_ENDPOINT is set ================= */
(function(){
  'use strict';
  var RFI_ENDPOINT='';
  var form=document.getElementById('rform'); if(!form) return;
  var RM=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var done=document.getElementById('rfDone');
  form.addEventListener('input',function(e){ var w=e.target.closest('.rf-f'); if(w) w.classList.remove('err'); var c=e.target.closest('.consent'); if(c) c.classList.remove('err'); });
  form.addEventListener('submit',function(e){
    e.preventDefault();
    var ok=true, data={};
    [].slice.call(form.querySelectorAll('input,select,textarea')).forEach(function(el){
      if(!el.name) return;
      var w=el.closest('.rf-f'); var v=(el.type==='checkbox')?el.checked:el.value.trim();
      if(el.type==='checkbox'){ data[el.name]=v; return; }
      var good=true;
      if(el.hasAttribute('data-req') && !v) good=false;
      if(el.name==='email' && v && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) good=false;
      if(el.name==='phone'){ var d=v.replace(/\D/g,''); if(!/^\d{10}$/.test(d)) good=false; else v=d; }
      if(w) w.classList.toggle('err',!good);
      if(!good) ok=false; else if(v) data[el.name]=v;
    });
    var c=form.querySelector('[name="consent"]'); var cl=c.closest('.consent'); cl.classList.toggle('err',!c.checked); if(!c.checked) ok=false;
    if(!ok){ var f=form.querySelector('.err'); if(f) f.scrollIntoView({block:'center',behavior:RM?'auto':'smooth'}); return; }
    data.submitted_at=new Date().toISOString(); data.source='jdfranchising.com/request'; data.tag='direct-intro-request';
    var payload=JSON.stringify(data);
    try{ localStorage.setItem('jds_rfi_last',payload); }catch(err){}
    function finish(){
      form.hidden=true; done.hidden=false;
      var h=document.getElementById('rfDoneH'); if(h && data.first) h.textContent='Thanks, '+data.first+'. Your request is in.';
      done.scrollIntoView({block:'start',behavior:RM?'auto':'smooth'});
    }
    if(RFI_ENDPOINT){ var b=form.querySelector('[type="submit"]'); if(b){ b.disabled=true; b.style.opacity='.6'; } fetch(RFI_ENDPOINT,{method:'POST',headers:{'Content-Type':'application/json'},body:payload}).then(finish).catch(finish); }
    else finish();
  });
})();


/* ================= the library: search, and mark what is playing ================= */
(function(){
  'use strict';
  var list=document.getElementById('ixList'); if(!list) return;
  var q=document.getElementById('ixQ'), meta=document.getElementById('ixMeta'), none=document.getElementById('ixNone');
  var rows=[].slice.call(list.querySelectorAll('.vc')), base=meta?meta.textContent:'';
  if(q) q.addEventListener('input',function(){
    var v=q.value.trim().toLowerCase(), shown=0;
    rows.forEach(function(r){ var hit=!v || r.getAttribute('data-q').indexOf(v)>-1; r.hidden=!hit; if(hit) shown++; });
    if(none) none.hidden=shown>0;
    if(meta) meta.textContent=v?(shown+' of '+rows.length+' episodes'):base;
  });
  document.addEventListener('click',function(e){ var b=e.target.closest('[data-play]'); if(!b) return; var n=b.getAttribute('data-n');
    rows.forEach(function(r){ r.classList.toggle('playing', r.querySelector('button').getAttribute('data-n')===n); }); });
})();

/* ================= phones: the action bar shows after the first screen, and steps aside for forms, the calendar and the footer ================= */
(function(){
  'use strict';
  var bar=document.getElementById('mbar'); if(!bar || !('IntersectionObserver' in window)) return;
  var blockers=[].slice.call(document.querySelectorAll('#fit,#book,#rform,#rsForm,.bk,.foot,.x-close,#cta,.mmenu.open')), blocked=0, past=false;
  function sync(){ bar.classList.toggle('on', past && blocked===0); }
  var io=new IntersectionObserver(function(en){ en.forEach(function(x){ x.target.__in=x.isIntersecting; }); blocked=blockers.filter(function(b){ return b.__in; }).length; sync(); },{threshold:0,rootMargin:'0px 0px -12% 0px'});
  blockers.forEach(function(b){ io.observe(b); });
  window.addEventListener('scroll',function(){ var p=(window.pageYOffset||0)>560; if(p!==past){ past=p; sync(); } },{passive:true});
})();


/* ================= resales: listings from a sheet or the inline array; request form logs the listing ================= */
(function(){
  'use strict';
  var grid=document.getElementById('rsGrid'); if(!grid) return;
  var RM=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var RESALE_ENDPOINT='';
  var empty=document.getElementById('rsEmpty'), meta=document.getElementById('rsMeta'), form=document.getElementById('rsForm'), done=document.getElementById('rsDone');
  var picked=document.getElementById('rsPicked'), pickedT=document.getElementById('rsPickedT'), hid=document.getElementById('rsListing');
  var ARROW='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';
  function esc(s){ return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
  function band(n){ n=parseFloat(String(n).replace(/[^0-9.]/g,''))||0; if(!n) return 'On request'; var lo=Math.floor(n/25000)*25000, hi=lo+25000; function f(x){ if(x<1e6) return '$'+Math.round(x/1000)+'K'; var m=x/1e6; return '$'+(x%1e6===0?m.toFixed(0):(x%1e5===0?m.toFixed(1):m.toFixed(3).replace(/0+$/,'')))+'M'; } return f(lo)+' to '+f(hi); }
  function card(l){
    return '<li><article class="rs-card"><span class="id">'+esc(l.id)+'</span><span class="k">'+esc(l.industry)+'</span><h3>'+esc(l.model||'Existing franchise location')+'</h3><p class="loc">'+esc([l.city,l.state].filter(Boolean).join(', '))+'</p>'+
      '<div class="rs-nums"><div><span>Revenue</span><b>'+band(l.revenue)+'</b></div><div><span>EBITDA</span><b>'+band(l.ebitda)+'</b></div><div><span>Asking</span><b>'+band(l.price)+'</b></div></div>'+
      (l.note?'<p class="note">'+esc(l.note)+'</p>':'')+'<a class="btn btn-solid" href="#rsform" data-listing="'+esc(l.id)+'" data-label="'+esc(l.industry+' · '+[l.city,l.state].filter(Boolean).join(', ')+' · '+l.id)+'">Request Info'+ARROW+'</a></article></li>';
  }
  function render(list){
    list=(list||[]).filter(function(l){ return !l.status || String(l.status).toLowerCase()==='open'; });
    grid.innerHTML=list.map(card).join('');
    if(empty) empty.hidden=list.length>0;
    if(meta) meta.textContent=list.length?(list.length+' listing'+(list.length===1?'':'s')+' open. Updated as they change.'):'Updated as listings change.';
  }
  function parseCSV(t){
    var rows=[],row=[],cur='',q=false;
    for(var i=0;i<t.length;i++){ var c=t[i]; if(q){ if(c==='"'){ if(t[i+1]==='"'){ cur+='"'; i++; } else q=false; } else cur+=c; }
      else if(c==='"') q=true; else if(c===','){ row.push(cur); cur=''; } else if(c==='\n'||c==='\r'){ if(c==='\r'&&t[i+1]==='\n') i++; row.push(cur); rows.push(row); row=[]; cur=''; } else cur+=c; }
    if(cur.length||row.length){ row.push(cur); rows.push(row); }
    var h=rows.shift().map(function(x){ return x.trim().toLowerCase(); });
    return rows.filter(function(r){ return r.join('').trim(); }).map(function(r){ var o={}; h.forEach(function(k,i){ o[k]=(r[i]||'').trim(); }); return o; });
  }
  render(window.RESALES||[]);
  if(window.RESALES_SHEET_CSV){ fetch(window.RESALES_SHEET_CSV,{cache:'no-store'}).then(function(r){ return r.text(); }).then(function(t){ render(parseCSV(t)); }).catch(function(){}); }
  document.addEventListener('click',function(e){ var a=e.target.closest('[data-listing]'); if(!a) return; hid.value=a.getAttribute('data-listing'); pickedT.textContent=a.getAttribute('data-label'); picked.hidden=false; });
  var clr=document.getElementById('rsClear'); if(clr) clr.addEventListener('click',function(){ hid.value=''; picked.hidden=true; });
  if(!form) return;
  form.addEventListener('input',function(e){ var w=e.target.closest('.rf-f'); if(w) w.classList.remove('err'); var c=e.target.closest('.consent'); if(c) c.classList.remove('err'); });
  form.addEventListener('submit',function(e){
    e.preventDefault(); var ok=true, data={};
    [].slice.call(form.querySelectorAll('input,select,textarea')).forEach(function(el){
      if(!el.name) return; var w=el.closest('.rf-f'); var v=(el.type==='checkbox')?el.checked:el.value.trim();
      if(el.type==='checkbox'){ data[el.name]=v; return; }
      var good=true; if(el.hasAttribute('data-req') && !v) good=false;
      if(el.name==='email' && v && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) good=false;
      if(el.name==='phone'){ var d=v.replace(/\D/g,''); if(!/^\d{10}$/.test(d)) good=false; else v=d; }
      if(w) w.classList.toggle('err',!good); if(!good) ok=false; else if(v) data[el.name]=v;
    });
    var c=form.querySelector('[name="consent"]'); var cl=c.closest('.consent'); cl.classList.toggle('err',!c.checked); if(!c.checked) ok=false;
    if(!ok){ var f=form.querySelector('.err'); if(f) f.scrollIntoView({block:'center',behavior:RM?'auto':'smooth'}); return; }
    data.submitted_at=new Date().toISOString(); data.source='jdfranchising.com/resales'; data.tag='resale-info-request';
    var payload=JSON.stringify(data); try{ localStorage.setItem('jds_resale_last',payload); }catch(err){}
    function finish(){ form.hidden=true; done.hidden=false; var h=document.getElementById('rsDoneH'); if(h&&data.first) h.textContent='Thanks, '+data.first+'. Your request is in.'; done.scrollIntoView({block:'start',behavior:RM?'auto':'smooth'}); }
    if(RESALE_ENDPOINT){ var b=form.querySelector('[type="submit"]'); if(b){ b.disabled=true; b.style.opacity='.6'; } fetch(RESALE_ENDPOINT,{method:'POST',headers:{'Content-Type':'application/json'},body:payload}).then(finish).catch(finish); } else finish();
  });
})();

/* ================= the call widget: Josh's face and the call offer, after the first screen, dismissible for the session ================= */
(function(){
  'use strict';
  if(document.querySelector('.bookpage') || /contact\.html/.test(location.pathname)) return;
  try{ if(sessionStorage.getItem('jds_callw')==='x') return; }catch(e){}
  var w=document.createElement('div'); w.className='callw'; w.setAttribute('aria-label','Start with a call');
  w.innerHTML='<a class="main" href="book.html"><img src="assets/josh/face.jpg" width="48" height="48" alt=""><span><span class="t">Start with a 20-minute call</span><span class="s">Josh DuBois · free, no pitch</span></span><span class="go" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg></span></a><button type="button" class="x" aria-label="Dismiss">&times;</button>';
  document.body.appendChild(w);
  w.querySelector('.x').addEventListener('click',function(){ w.classList.remove('on'); try{ sessionStorage.setItem('jds_callw','x'); }catch(e){} setTimeout(function(){ w.remove(); },600); });
  /* it waits a screen and a half, and steps aside wherever the page already asks for the call */
  var past=false, blocked=0, zones=[].slice.call(document.querySelectorAll('#fit,.x-close,#cta,.foot,.x-foot,form,.bk,#book,.page-head'));
  function sync(){ w.classList.toggle('on',past && blocked===0); }
  if('IntersectionObserver' in window){ var io=new IntersectionObserver(function(en){ en.forEach(function(x){ x.target.__cw=x.isIntersecting; }); blocked=zones.filter(function(z){ return z.__cw; }).length; sync(); },{threshold:0}); zones.forEach(function(z){ io.observe(z); }); }
  function chk(){ var p=(window.pageYOffset||0)>window.innerHeight*1.5; if(p!==past){ past=p; sync(); } }
  window.addEventListener('scroll',chk,{passive:true}); chk();
})();
