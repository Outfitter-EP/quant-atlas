/* Inflation article: interactive labs. Needs inflation-core.js and site.js. */
const S={q:PRESETS['Steady'].slice(),step:10,amp:1,nom:3.5,slope:0.5,T:10,pi:3,preset:'Steady'};
const xs=[...Array(30)].map((_,i)=>i+1);
function resizePlots(){['p1','p2','p3','p4','p5'].forEach(id=>{try{Plotly.Plots.resize($(id));}catch(e){}});}
function renderAll(){
  if(typeof Plotly==='undefined') return;
  const t=th(), c=build(S);
  // chart 1
  const z=xs.map(T=>c.b[T]*100), f=xs.map(T=>c.f1[T]*100);
  Plotly.react('p1',[
    {x:xs,y:z,name:'Zero rate',mode:'lines',line:{color:t.c1,width:3},hovertemplate:'%{y:.2f}%'},
    {x:xs,y:f,name:'1Y forward',mode:'lines',line:{color:t.acc,width:2,shape:'hv'},hovertemplate:'%{y:.2f}%'},
    {x:TEN,y:S.q,name:'Your quotes',mode:'markers',marker:{symbol:'diamond',size:11,color:t.c2,line:{color:t.surface,width:1.5}},hovertemplate:'%{y:.2f}%'}
  ],L2(t,{xaxis:{title:{text:'Maturity (years)',font:{size:11}},gridcolor:t.line,linecolor:t.line,fixedrange:true,tickfont:{color:t.muted}}}),CFG);
  $('ro1').innerHTML='<span class="ro">5Y zero <b>'+pct(c.b[5])+'</b></span><span class="ro">10Y zero <b>'+pct(c.b[10])+'</b></span><span class="ro">5y5y forward <b>'+pct(c.fwd(5,5))+'</b></span>';
  // chart 2
  const N=S.step, bx=[...Array(N+1)].map((_,i)=>i), by=bx.map(T=>c.I[T]);
  const fullx=[0,...xs], fully=fullx.map(T=>c.I[T]);
  Plotly.react('p2',[
    {x:fullx,y:fully,name:'Full curve',mode:'lines',line:{color:t.line,width:2,dash:'dot'},hoverinfo:'skip'},
    {x:bx,y:by,name:'Built so far',mode:'lines+markers',line:{color:t.acc,width:3},marker:{size:6,color:t.acc},hovertemplate:'CPI %{y:.1f}'},
    {x:[N],y:[c.I[N]],name:'Newest point',mode:'markers',marker:{size:13,color:t.c2,line:{color:t.surface,width:2}},hoverinfo:'skip'}
  ],L2(t,{yaxis:{gridcolor:t.line,linecolor:t.line,fixedrange:true,tickfont:{color:t.muted},range:[300,Math.max(420,c.I[30]*1.03)]},xaxis:{title:{text:'Years from base',font:{size:11}},gridcolor:t.line,linecolor:t.line,fixedrange:true,tickfont:{color:t.muted},range:[-0.5,30.5]}}),CFG);
  $('stepO').textContent=N;
  if(N===0) $('calc2').innerHTML='Year 0: <b>I(0) = '+I0.toFixed(2)+'</b> (the base CPI). Move the slider to add years.';
  else $('calc2').innerHTML='Quote b<sub>'+N+'</sub> = <b>'+pct(c.b[N])+'</b><br>I('+N+') = '+I0.toFixed(2)+' × (1 + '+pct(c.b[N])+')<sup>'+N+'</sup> = <b>'+c.I[N].toFixed(2)+'</b><br>Forward for year '+N+' = '+c.I[N].toFixed(2)+' / '+c.I[N-1].toFixed(2)+' − 1 = <b>'+pct(c.f1[N])+'</b>';
  // chart 3
  const m=monthly(c,S.amp,36), lab=m.map(r=>r.label);
  Plotly.react('p3',[
    {x:lab,y:m.map(r=>r.trend*100),name:'Trend only',mode:'lines',line:{color:t.c1,width:3,shape:'hv'},hovertemplate:'%{y:.3f}%'},
    {x:lab,y:m.map(r=>r.seas*100),name:'With seasonality',mode:'lines+markers',line:{color:t.acc,width:2},marker:{size:4},hovertemplate:'%{y:.3f}%'}
  ],L2(t,{yaxis:{gridcolor:t.line,linecolor:t.line,fixedrange:true,ticksuffix:'%',tickformat:'.2f',tickfont:{color:t.muted},title:{text:'CPI change per month',font:{size:11}}},xaxis:{gridcolor:t.line,linecolor:t.line,fixedrange:true,tickangle:-60,nticks:12,tickfont:{color:t.muted,size:10}},margin:{l:56,r:12,t:10,b:60},legend:{orientation:'h',y:-0.38,x:0,font:{color:t.ink,size:11}}}),CFG);
  $('ampO').textContent=S.amp.toFixed(1)+'×';
  // chart 4
  const sx=[...Array(21)].map((_,i)=>i), sy=[...Array(10)].map((_,i)=>i+1);
  const sz=sy.map(Lg=>sx.map(s=>c.fwd(s,Lg)*100));
  const ax=(ttl,extra)=>Object.assign({title:{text:ttl,font:{size:11,color:t.muted}},gridcolor:t.line,zerolinecolor:t.line,linecolor:t.line,backgroundcolor:'rgba(0,0,0,0)',showbackground:false,tickfont:{color:t.muted,size:10}},extra||{});
  Plotly.react('p4',[{type:'surface',x:sx,y:sy,z:sz,colorscale:[[0,t.c3],[0.5,t.c1],[1,t.acc]],cmin:0,cmax:6,showscale:false,
    contours:{z:{show:true,usecolormap:true,project:{z:false}}},hovertemplate:'start %{x}y, length %{y}y<br>forward %{z:.2f}%<extra></extra>'}],
    {margin:{l:0,r:0,t:0,b:0},paper_bgcolor:'rgba(0,0,0,0)',font:{family:"IBM Plex Mono, monospace",color:t.muted},
     scene:{xaxis:ax('Start (yrs)'),yaxis:ax('Length (yrs)'),zaxis:ax('Fwd %',{range:[0,6]}),camera:{eye:{x:1.55,y:-1.6,z:0.85}},aspectratio:{x:1.2,y:1,z:0.7}}},CFG);
  // chart 5
  Plotly.react('p5',[
    {x:xs,y:xs.map(T=>c.n[T]*100),name:'Nominal',mode:'lines',line:{color:t.c3,width:3},hovertemplate:'%{y:.2f}%'},
    {x:xs,y:xs.map(T=>c.r[T]*100),name:'Real',mode:'lines',line:{color:t.c1,width:3},hovertemplate:'%{y:.2f}%'},
    {x:xs,y:xs.map(T=>c.b[T]*100),name:'Breakeven (zero)',mode:'lines',line:{color:t.acc,width:3},hovertemplate:'%{y:.2f}%'},
    {x:xs,y:xs.map(T=>c.yoy[T]*100),name:'YoY swap rate',mode:'lines',line:{color:t.c2,width:2,dash:'dash'},hovertemplate:'%{y:.2f}%'}
  ],L2(t,{xaxis:{title:{text:'Maturity (years)',font:{size:11}},gridcolor:t.line,linecolor:t.line,fixedrange:true,tickfont:{color:t.muted}},legend:{orientation:'h',y:-0.3,x:0,font:{color:t.ink,size:11}},margin:{l:46,r:12,t:10,b:60}}),CFG);
  $('nomO').textContent=S.nom.toFixed(1)+'%'; $('slopeO').textContent=(S.slope>=0?'+':'')+S.slope.toFixed(1)+'%';
  const n10=c.n[10],r10=c.r[10],pvPer=10000000*(c.I[10]/I0-1)*c.DF[10];
  $('calc5').innerHTML='10Y nominal <b>'+pct(n10)+'</b> − breakeven <b>'+pct(c.b[10])+'</b> ≈ real <b>'+pct(r10)+'</b><br>CPI curve unchanged: I(10) = <b>'+c.I[10].toFixed(2)+'</b><br>PV of the 10Y inflation leg per 10m: <b>'+Math.round(pvPer).toLocaleString('en-US')+'</b>';
  // inspector
  const T=S.T, N0=10000000, pi=S.pi/100;
  const fixed=N0*(Math.pow(1+c.b[T],T)-1), infl=N0*(c.I[T]/I0-1), df=c.DF[T];
  const real=N0*(Math.pow(1+pi,T)-Math.pow(1+c.b[T],T));
  const fm=x=>Math.round(x).toLocaleString('en-US');
  $('tTO').textContent=T+'Y'; $('piO').textContent=(S.pi).toFixed(2)+'%';
  $('insp').innerHTML=
   '<span>Breakeven b</span><span>'+pct(c.b[T])+'</span>'+
   '<span>Fixed leg at maturity</span><span>'+fm(fixed)+'</span>'+
   '<span>Expected inflation leg</span><span>'+fm(infl)+'</span>'+
   '<span>Discount factor</span><span>'+df.toFixed(4)+'</span>'+
   '<span>PV fixed leg</span><span>'+fm(fixed*df)+'</span>'+
   '<span>PV inflation leg</span><span>'+fm(infl*df)+'</span>'+
   '<span>Swap value today</span><span>'+fm((infl-fixed)*df)+'</span>'+
   '<span>If inflation averages '+S.pi.toFixed(2)+'%: payoff to receiver</span><span>'+fm(real)+'</span>'+
   '<span>Its PV today</span><span>'+fm(real*df)+'</span>';
}

/* ---------- controls ---------- */
function buildControls(){
  const qs=$('qSliders');
  TEN.forEach((T,i)=>{
    const d=document.createElement('div'); d.className='sl';
    d.innerHTML='<label for="q'+T+'">'+T+'Y quote <output id="q'+T+'O"></output></label><input id="q'+T+'" type="range" min="0" max="6" step="0.05">';
    qs.appendChild(d);
    const inp=d.querySelector('input'); inp.value=S.q[i]; d.querySelector('output').textContent=S.q[i].toFixed(2)+'%';
    inp.addEventListener('input',()=>{S.q[i]=+inp.value; d.querySelector('output').textContent=(+inp.value).toFixed(2)+'%'; S.preset=null; markPreset(); renderAll();});
  });
  const pr=$('presets');
  Object.keys(PRESETS).forEach(k=>{
    const b=document.createElement('button'); b.className='chip'; b.textContent=k; b.dataset.k=k;
    b.addEventListener('click',()=>{S.q=PRESETS[k].slice(); S.preset=k; TEN.forEach((T,i)=>{$('q'+T).value=S.q[i]; $('q'+T+'O').textContent=S.q[i].toFixed(2)+'%';}); markPreset(); renderAll();});
    pr.appendChild(b);
  });
  markPreset();
  $('step').addEventListener('input',e=>{S.step=+e.target.value; renderAll();});
  $('amp').addEventListener('input',e=>{S.amp=+e.target.value; renderAll();});
  $('nom').addEventListener('input',e=>{S.nom=+e.target.value; renderAll();});
  $('slope').addEventListener('input',e=>{S.slope=+e.target.value; renderAll();});
  $('tT').addEventListener('input',e=>{S.T=+e.target.value; renderAll();});
  $('pi').addEventListener('input',e=>{S.pi=+e.target.value; renderAll();});
  let timer=null;
  $('play').addEventListener('click',()=>{
    if(timer){clearInterval(timer);timer=null;$('play').textContent='Play';return;}
    if(S.step>=30) S.step=0;
    $('play').textContent='Pause';
    timer=setInterval(()=>{ if(S.step>=30){clearInterval(timer);timer=null;$('play').textContent='Play';return;} S.step++; $('step').value=S.step; renderAll(); },260);
  });
}
function markPreset(){document.querySelectorAll('#presets .chip').forEach(b=>b.classList.toggle('on',b.dataset.k===S.preset));}

/* ---------- boot ---------- */
buildControls(); renderAll();
onThemeChange(renderAll);
window.addEventListener('resize',resizePlots);
