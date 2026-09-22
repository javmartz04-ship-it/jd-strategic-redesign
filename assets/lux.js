/* JD Strategic redesign: the few behaviours the new pages add on top of site.js */
(function(){
  'use strict';
  var RM=window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* industries rail: arrows nudge by one card */
  var rail=document.getElementById('xRail');
  function nudge(d){ if(!rail) return; var c=rail.querySelector('.x-card'); rail.scrollBy({left:d*(c?c.getBoundingClientRect().width+18:380),behavior:RM?'auto':'smooth'}); }
  var p=document.getElementById('xPrev'), n=document.getElementById('xNext');
  if(p) p.addEventListener('click',function(){ nudge(-1); });
  if(n) n.addEventListener('click',function(){ nudge(1); });

  /* the sieve narrows once it is on screen */
  var sv=document.getElementById('sieve');
  if(sv){
    if(RM||!('IntersectionObserver' in window)) sv.classList.add('in');
    else { var io=new IntersectionObserver(function(e){ if(e[0].isIntersecting){ sv.classList.add('in'); io.disconnect(); } },{threshold:.35}); io.observe(sv); setTimeout(function(){ sv.classList.add('in'); },6000); }
  }

  /* the hero frame eases from 1.0 to 1.06 as it scrolls away (scroll-linked, never scroll-jacked) */
  var film=document.getElementById('film');
  if(film && !RM){
    var img=film.querySelector('img'), t=false;
    function f(){ var r=film.getBoundingClientRect(), vh=window.innerHeight; var k=Math.min(Math.max((vh-r.top)/(vh+r.height),0),1); img.style.setProperty('--fs',(1+k*0.07).toFixed(4)); t=false; }
    window.addEventListener('scroll',function(){ if(!t){ t=true; requestAnimationFrame(f); } },{passive:true});
    document.body.addEventListener('transitionend',function once(e){ if(e.target===img){ img.style.transition='none'; document.body.removeEventListener('transitionend',once); } });
  }
})();
