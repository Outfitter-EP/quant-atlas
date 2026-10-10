/* Home page and category pages. Needs registry.js, inflation-core.js (for the hero surface) and site.js. */
(function(){
const page=document.body.dataset.page;

function renderHome(filter){
  const grid=$('catGrid'); grid.innerHTML='';
  CATEGORIES.forEach(c=>{
    const n=inCat(c.id).length;
    const b=document.createElement('a'); b.className='cat'+(n?'':' empty'); b.href=curl(c.id);
    b.innerHTML='<b>'+c.name+'</b><span class="d">'+c.blurb+'</span><span class="n">'+(n?n+' article'+(n>1?'s':''):'no articles yet')+'</span>';
    grid.appendChild(b);
  });
  const list=$('homeList'); list.innerHTML='';
  const f=(filter||'').toLowerCase().trim();
  const items=ARTICLES.filter(a=>!f||(a.title+' '+a.summary+' '+a.tags.join(' ')).toLowerCase().includes(f));
  $('listTitle').textContent=f?'Search results':'Latest articles';
  if(!items.length){const d=document.createElement('div');d.className='empty-note';d.textContent='Nothing matches yet. Ask this question in chat and it becomes an article.';list.appendChild(d);}
  items.forEach(a=>list.appendChild(artCard(a)));
}

function initCategory(){
  const c=catById(new URLSearchParams(location.search).get('c'));
  if(!c){ $('catTitle').textContent='Category not found'; $('catBlurb').innerHTML='<a href="'+ROOT+'index.html">Back to all categories</a>'; return; }
  document.title=c.name+' · Quant Atlas';
  $('catTitle').textContent=c.name; $('catBlurb').textContent=c.blurb;
  const items=inCat(c.id), list=$('catList'); list.innerHTML='';
  if(items.length) items.forEach(a=>list.appendChild(artCard(a)));
  else { const d=document.createElement('div'); d.className='empty-note'; d.textContent='No articles here yet. Ask a question on this topic in chat and it is added to this category.'; list.appendChild(d); }
}

/* ---------- hero wireframe ---------- */
function initHero(){
  let HC={a:[0,0,0],b:[0,0,0],bg:'#fff',ln:'#ccc'};
  function heroColors(){const t=th();HC={a:hex(t.c1),b:hex(t.acc),bg:t.bg,ln:t.line};}
  const hero=$('hero'), hctx=hero.getContext('2d');
  const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
  let HP=null;
  function heroPrep(){
    const c=build({q:PRESETS['Steady'],nom:3.5,slope:0.5}), N=16, g=[]; let mn=1e9,mx=-1e9;
    for(let i=0;i<=N;i++){g[i]=[];for(let j=0;j<=N;j++){const v=c.fwd(Math.round(i*20/N),1+Math.round(j*9/N)); g[i][j]=v; mn=Math.min(mn,v);mx=Math.max(mx,v);}}
    for(let i=0;i<=N;i++)for(let j=0;j<=N;j++)g[i][j]=(g[i][j]-mn)/(mx-mn||1);
    HP={g,N};
  }
  function heroDraw(ts){
    if(!HP) heroPrep();
    const dpr=Math.min(devicePixelRatio||1,2), w=hero.clientWidth, h=hero.clientHeight;
    if(!w) return;
    if(hero.width!==Math.round(w*dpr)){hero.width=Math.round(w*dpr);hero.height=Math.round(h*dpr);}
    hctx.setTransform(dpr,0,0,dpr,0,0); hctx.clearRect(0,0,w,h);
    const {g,N}=HP, ang=reduce?0.6:ts*0.00022, ca=Math.cos(ang), sa=Math.sin(ang);
    const sc=Math.min(w,h*1.5)*0.52, cx=w/2, cy=h*0.62, zh=h*0.5;
    const P=(i,j)=>{const x=i/N-0.5,y=j/N-0.5,X=x*ca-y*sa,Y=x*sa+y*ca;return {sx:cx+(X-Y)*sc*0.8,sy:cy+(X+Y)*sc*0.42-g[i][j]*zh,d:X+Y,v:g[i][j]};};
    const quads=[];
    for(let i=0;i<N;i++)for(let j=0;j<N;j++){const p=[P(i,j),P(i+1,j),P(i+1,j+1),P(i,j+1)];quads.push({p,d:(p[0].d+p[2].d)/2,v:(p[0].v+p[2].v)/2});}
    quads.sort((a,b)=>a.d-b.d);
    quads.forEach(q=>{
      const m=q.v, r=HC.a[0]+(HC.b[0]-HC.a[0])*m, gg=HC.a[1]+(HC.b[1]-HC.a[1])*m, b=HC.a[2]+(HC.b[2]-HC.a[2])*m;
      hctx.beginPath(); q.p.forEach((pt,k)=>k?hctx.lineTo(pt.sx,pt.sy):hctx.moveTo(pt.sx,pt.sy)); hctx.closePath();
      hctx.fillStyle=HC.bg; hctx.fill();
      hctx.fillStyle='rgba('+(r|0)+','+(gg|0)+','+(b|0)+',0.16)'; hctx.fill();
      hctx.strokeStyle='rgb('+(r|0)+','+(gg|0)+','+(b|0)+')'; hctx.lineWidth=1; hctx.stroke();
    });
  }
  function loop(ts){ heroDraw(ts); requestAnimationFrame(loop); }
  heroColors();
  if(reduce){heroDraw(0);} else requestAnimationFrame(loop);
  onThemeChange(()=>{heroColors(); heroDraw(performance.now());});
  window.addEventListener('resize',()=>heroDraw(performance.now()));
}

if(page==='home'){ renderHome(); $('q').addEventListener('input',e=>renderHome(e.target.value)); initHero(); }
else if(page==='category'){ initCategory(); }
})();
