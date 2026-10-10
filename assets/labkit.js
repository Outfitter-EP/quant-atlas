/* Lab kit: shared helpers and the generic lab builder (sliders, chip groups, buttons, charts, readouts).
   A lab is a spec in LABSPEC[key]; put <div class="lab" data-lab="key"></div> in a page. See CLAUDE.md. Needs site.js and Plotly. */
/* ---------- options labs: helpers ---------- */
const F0=v=>v.toFixed(0), F1=v=>v.toFixed(1), F2=v=>v.toFixed(2);
const FP0=v=>v.toFixed(0)+'%', FP1=v=>v.toFixed(1)+'%';
const FY=v=>v.toFixed(2)+' y';
const FS1=v=>(v>=0?'+':'')+v.toFixed(1);
const sld=(k,label,min,max,step,v,fmt)=>({k,label,min,max,step,v,fmt:fmt||F0});
const fx=(x,d)=>{d=d===undefined?2:d;return (Math.abs(x)<0.5*Math.pow(10,-d)?0:x).toFixed(d);};
const ro=(l,v,col)=>'<span class="ro">'+l+' <b'+(col?' style="color:'+col+'"':'')+'>'+v+'</b></span>';
const rg=(h,a)=>{const c=hex(h);return 'rgba('+c[0]+','+c[1]+','+c[2]+','+a+')';};
const vl=(x,col,dash)=>({type:'line',x0:x,x1:x,yref:'paper',y0:0,y1:1,line:{color:col,width:1.5,dash:dash||'dot'}});
const hl=(y,col,dash)=>({type:'line',y0:y,y1:y,xref:'paper',x0:0,x1:1,line:{color:col,width:1.5,dash:dash||'dot'}});
function A2(t,title,o){return Object.assign({title:{text:title||'',font:{size:11}},gridcolor:t.line,zerolinecolor:t.line,linecolor:t.line,fixedrange:true,tickfont:{color:t.muted}},o||{});}
function P2(c,i,traces,xt,yt,o){
  const t=c.t, op=Object.assign({},o||{}), xe=op.xe||{}, ye=op.ye||{}; delete op.xe; delete op.ye;
  const lay=L2(t,Object.assign({xaxis:A2(t,xt,xe),yaxis:A2(t,yt,ye),margin:{l:62,r:14,t:op.showlegend===false?12:38,b:56},legend:{orientation:'h',xref:'container',yref:'container',x:0,y:1,xanchor:'left',yanchor:'top',font:{color:t.ink,size:11}}},op));
  c.plot(i,traces,lay);
}
function scene(t,xt,yt,zt,o){
  const ax=(ttl,e)=>Object.assign({title:{text:ttl,font:{size:11,color:t.muted}},gridcolor:t.line,zerolinecolor:t.line,linecolor:t.line,showbackground:false,tickfont:{color:t.muted,size:10}},e||{});
  return {margin:{l:0,r:0,t:0,b:0},paper_bgcolor:'rgba(0,0,0,0)',font:{family:"IBM Plex Mono, monospace",color:t.muted},
    scene:Object.assign({xaxis:ax(xt),yaxis:ax(yt),zaxis:ax(zt),camera:{eye:{x:1.6,y:-1.7,z:0.9}},aspectratio:{x:1.2,y:1,z:0.75}},o||{})};
}
const cscale=t=>[[0,t.c3],[0.5,t.c1],[1,t.acc]];

/* ---------- options labs: generic lab builder ---------- */
const LABSPEC={}, LABST={};
function mkLab(el,key){
  const sp=LABSPEC[key]; if(!sp) return;
  const st=Object.assign({},sp.init||{}); LABST[key]=st;
  let h='<h3>'+sp.title+'</h3>';
  if(sp.intro) h+='<p class="hint">'+sp.intro+'</p>';
  (sp.chips||[]).forEach(g=>{
    st[g.k]=g.v;
    h+='<div class="grp">'+(g.label?'<span class="gl">'+g.label+'</span>':'')+'<div class="presets" data-k="'+g.k+'">'+
      g.opts.map(o=>'<button type="button" class="chip'+(o[0]===g.v?' on':'')+'" data-v="'+o[0]+'">'+o[1]+'</button>').join('')+'</div></div>';
  });
  h+='<div class="sliders">'+(sp.sliders||[]).map(s=>{
    st[s.k]=s.v;
    return '<div class="sl"><label for="'+key+'-'+s.k+'">'+s.label+' <output id="'+key+'-'+s.k+'-o">'+s.fmt(s.v)+'</output></label>'+
      '<input id="'+key+'-'+s.k+'" type="range" min="'+s.min+'" max="'+s.max+'" step="'+s.step+'" value="'+s.v+'"></div>';
  }).join('')+'</div>';
  if(sp.buttons) h+='<div class="presets">'+sp.buttons.map((b,i)=>'<button type="button" class="chip" data-b="'+i+'">'+b.label+'</button>').join('')+'</div>';
  h+='<div class="readouts" id="'+key+'-ro"></div>';
  sp.plots.forEach((ht,i)=>{
    h+='<div id="'+key+'-p'+i+'" class="plot" style="height:'+ht+'px"></div>';
    if(sp.captions&&sp.captions[i]) h+='<p class="hint">'+sp.captions[i]+'</p>';
  });
  if(sp.calc) h+='<div class="calc" id="'+key+'-calc"></div>';
  if(sp.hint) h+='<p class="hint">'+sp.hint+'</p>';
  el.innerHTML=h;
  const set=(k,v)=>{
    st[k]=v; const s=(sp.sliders||[]).find(x=>x.k===k), inp=$(key+'-'+k);
    if(s&&inp){inp.value=v; $(key+'-'+k+'-o').textContent=s.fmt(v);}
  };
  (sp.sliders||[]).forEach(s=>{
    $(key+'-'+s.k).addEventListener('input',e=>{st[s.k]=+e.target.value; $(key+'-'+s.k+'-o').textContent=s.fmt(st[s.k]); labRender(key);});
  });
  el.querySelectorAll('.presets[data-k]').forEach(g=>{
    g.addEventListener('click',e=>{
      const b=e.target.closest('.chip'); if(!b) return;
      st[g.dataset.k]=b.dataset.v;
      g.querySelectorAll('.chip').forEach(x=>x.classList.toggle('on',x===b));
      labRender(key);
    });
  });
  el.querySelectorAll('[data-b]').forEach(b=>{
    b.addEventListener('click',()=>{sp.buttons[+b.dataset.b].fn(st,set); labRender(key);});
  });
}
function labRender(key){
  const sp=LABSPEC[key], st=LABST[key];
  if(!sp||!st||typeof Plotly==='undefined') return;
  const t=th();
  const c={t,
    ro:h=>{const e=$(key+'-ro'); if(e) e.innerHTML=h;},
    calc:h=>{const e=$(key+'-calc'); if(e) e.innerHTML=h;},
    plot:(i,tr,lay)=>Plotly.react(key+'-p'+i,tr,lay,CFG)};
  try{sp.render(st,c);}catch(e){console.error('lab '+key,e);}
}
function renderLabs(){
  document.querySelectorAll('.lab[data-lab]').forEach(el=>labRender(el.dataset.lab));
  document.querySelectorAll('.plot').forEach(p=>{try{Plotly.Plots.resize(p);}catch(e){}});
}
function initLabs(){document.querySelectorAll('.lab[data-lab]').forEach(el=>mkLab(el,el.dataset.lab));}
