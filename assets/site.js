/* Quant Atlas shared code: helpers, theme, header, cards. Needs registry.js loaded first. */
const $=id=>document.getElementById(id);
const pct=(x,d=2)=>(x*100).toFixed(d)+'%';
const ROOT=(document.body&&document.body.dataset.root)||'';
const catById=id=>CATEGORIES.find(c=>c.id===id);
const inCat=id=>ARTICLES.filter(a=>a.cat===id||(a.also||[]).includes(id));
const aurl=a=>ROOT+'articles/'+a.id+'.html';
const curl=id=>ROOT+'category.html?c='+id;
const hex=h=>{h=h.replace('#','');if(h.length===3)h=h.split('').map(x=>x+x).join('');return [parseInt(h.slice(0,2),16),parseInt(h.slice(2,4),16),parseInt(h.slice(4,6),16)];};

/* chart theme and layout helpers */
function th(){const cs=getComputedStyle(document.documentElement);const g=n=>cs.getPropertyValue(n).trim();
  return {ink:g('--ink'),muted:g('--muted'),line:g('--line'),acc:g('--accent'),c1:g('--c1'),c2:g('--c2'),c3:g('--c3'),surface:g('--surface'),surface2:g('--surface2')};}
function L2(t,o){ // 2D layout
  return Object.assign({
    margin:{l:46,r:12,t:10,b:44},paper_bgcolor:'rgba(0,0,0,0)',plot_bgcolor:'rgba(0,0,0,0)',
    font:{family:"IBM Plex Mono, monospace",size:11,color:t.muted},dragmode:false,
    xaxis:{gridcolor:t.line,zerolinecolor:t.line,linecolor:t.line,fixedrange:true,tickfont:{color:t.muted}},
    yaxis:{gridcolor:t.line,zerolinecolor:t.line,linecolor:t.line,fixedrange:true,ticksuffix:'%',tickfont:{color:t.muted}},
    legend:{orientation:'h',y:-0.22,x:0,font:{color:t.ink,size:11}},hovermode:'x unified',
    hoverlabel:{bgcolor:t.surface,bordercolor:t.line,font:{color:t.ink}}
  },o||{});
}
const CFG={displayModeBar:false,responsive:true};

/* theme: follows the system unless the visitor picked one; the choice is remembered */
const themeListeners=[];
function onThemeChange(fn){themeListeners.push(fn);}
function effectiveDark(){const t=document.documentElement.getAttribute('data-theme'); if(t) return t==='dark'; return matchMedia('(prefers-color-scheme: dark)').matches;}
function fireTheme(){themeListeners.forEach(fn=>{try{fn();}catch(e){console.error(e);}});}
new MutationObserver(fireTheme).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});
matchMedia('(prefers-color-scheme: dark)').addEventListener('change',fireTheme);

/* article card (a link) */
function artCard(a){
  const el=document.createElement('a'); el.className='art'; el.href=aurl(a);
  const n=ARTICLES.filter(x=>x.cat===a.cat&&x.step).length;
  el.innerHTML='<div class="eyebrow">'+catById(a.cat).name+(a.step?' · Step '+a.step+' of '+n:'')+' · '+a.date+'</div><h3>'+a.title+'</h3><p>'+a.summary+'</p><div class="tags">'+a.tags.map(t=>'<span class="tag">'+t+'</span>').join('')+'</div>';
  return el;
}

/* header with breadcrumbs and theme button */
(function(){
  const host=$('site-header'); if(!host) return;
  const b=document.body.dataset, home='<a href="'+ROOT+'index.html">Home</a>';
  let crumbs='';
  if(b.page==='article'){const a=ARTICLES.find(x=>x.id===b.id); if(a) crumbs=home+'<span>/</span><a href="'+curl(a.cat)+'">'+catById(a.cat).name+'</a>';}
  else if(b.page==='category'){const c=catById(new URLSearchParams(location.search).get('c')); if(c) crumbs=home+'<span>/</span><span>'+c.name+'</span>';}
  host.innerHTML='<header class="top"><div class="wrap"><a class="brand" href="'+ROOT+'index.html" aria-label="Quant Atlas home">'+
    '<svg viewBox="0 0 32 32" fill="none" aria-hidden="true"><rect x="1" y="1" width="30" height="30" rx="8" fill="var(--surface)" stroke="var(--line)"/><path d="M5 24 C10 24 11 13 16 13 S22 8 27 6" stroke="var(--accent)" stroke-width="2.4" stroke-linecap="round"/><path d="M5 26 C11 26 13 19 18 18 S23 14 27 12" stroke="var(--c1)" stroke-width="2" stroke-linecap="round" opacity=".8"/></svg>'+
    '<span>Quant Atlas</span></a><div class="crumbs">'+crumbs+'</div><div class="spacer"></div><button class="iconbtn" id="themeBtn" aria-label="Switch light or dark theme">theme</button></div></header>';
  $('themeBtn').addEventListener('click',()=>{
    const next=effectiveDark()?'light':'dark';
    document.documentElement.setAttribute('data-theme',next);
    try{localStorage.setItem('qa-theme',next);}catch(e){}
  });
})();
