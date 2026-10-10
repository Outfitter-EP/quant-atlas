/* Option article labs: one spec per lab, plus the options path navigation. Needs options-core.js, labkit.js and site.js. */
const TYPE_CHIPS={k:'type',label:'Option',v:'c',opts:[['c','Call'],['p','Put']]};

function buildNav(){
  const steps=ARTICLES.filter(a=>a.cat==='options'&&a.step);
  document.querySelectorAll('.pathnav').forEach(el=>{
    const cur=+el.dataset.step;
    el.innerHTML='<span class="gl">Options path</span>'+steps.map(a=>'<a class="chip'+(a.step===cur?' on':'')+'" href="'+aurl(a)+'">'+a.step+' · '+a.short+'</a>').join('');
  });
  document.querySelectorAll('.nextrow[data-next]').forEach(el=>{
    const a=ARTICLES.find(x=>x.id===el.dataset.next);
    if(a){const l=document.createElement('div'); l.className='eyebrow'; l.textContent='Next step'; el.appendChild(l); el.appendChild(artCard(a));}
  });
}

/* ---------- lab 1: payoff ---------- */
LABSPEC.payoff={
  title:'Payoff and profit at expiry',
  chips:[{k:'pos',label:'Position',v:'lc',opts:[['lc','Long call'],['lp','Long put'],['sc','Short call'],['sp','Short put']]}],
  sliders:[sld('S','Spot today',60,140,1,100),sld('K','Strike',60,140,1,100),sld('prem','Premium',0.5,30,0.5,6,F2)],
  plots:[330],
  captions:['Dashed: payoff before the premium. Solid: profit or loss after the premium. Dotted vertical line: spot today.'],
  render(st,c){
    const t=c.t, isCall=st.pos[1]==='c', n=st.pos[0]==='l'?1:-1, K=st.K, pr=st.prem, S=st.S;
    const xs=[]; for(let s=30;s<=170;s++) xs.push(s);
    const pay=xs.map(s=>n*(isCall?Math.max(s-K,0):Math.max(K-s,0))), pnl=pay.map(v=>v-n*pr);
    P2(c,0,[
      {x:xs,y:pnl.map(v=>Math.max(v,0)),mode:'lines',line:{width:0},fill:'tozeroy',fillcolor:rg(t.c1,.28),hoverinfo:'skip',showlegend:false},
      {x:xs,y:pnl.map(v=>Math.min(v,0)),mode:'lines',line:{width:0},fill:'tozeroy',fillcolor:rg(t.c2,.28),hoverinfo:'skip',showlegend:false},
      {x:xs,y:pay,name:'Payoff',mode:'lines',line:{color:t.muted,width:2,dash:'dash'},hovertemplate:'%{y:.2f}'},
      {x:xs,y:pnl,name:'Profit / loss',mode:'lines',line:{color:t.acc,width:3.5},hovertemplate:'%{y:.2f}'}
    ],'Price of the underlying at expiry','Profit / loss per unit',{shapes:[vl(S,t.muted)]});
    const be=isCall?K+pr:K-pr, intr=isCall?Math.max(S-K,0):Math.max(K-S,0), tv=pr-intr;
    const itm=isCall?S>K:S<K, where=Math.abs(S-K)<0.5?'at the money':(itm?'in the money':'out of the money');
    let mp,ml;
    if(isCall){ if(n>0){mp='unlimited';ml=fx(pr);} else {mp=fx(pr);ml='unlimited';} }
    else { if(n>0){mp=fx(K-pr);ml=fx(pr);} else {mp=fx(pr);ml=fx(K-pr);} }
    c.ro(ro('Break-even',fx(be))+ro('Max profit',mp)+ro('Max loss',ml)+ro('Today',where)+ro('Intrinsic',fx(intr))+ro('Time value',fx(tv),tv<0?'var(--c2)':null)+
      (tv<0?'<span class="ro" style="color:var(--c2)">Premium below intrinsic value: free money, so real markets do not allow it</span>':''));
  }
};

/* ---------- lab 2: strategies ---------- */
const STRATS={
  'Straddle':(K,w)=>[{t:'c',K:K,n:1},{t:'p',K:K,n:1}],
  'Strangle':(K,w)=>[{t:'p',K:K-w,n:1},{t:'c',K:K+w,n:1}],
  'Bull call spread':(K,w)=>[{t:'c',K:K,n:1},{t:'c',K:K+w,n:-1}],
  'Bear put spread':(K,w)=>[{t:'p',K:K,n:1},{t:'p',K:K-w,n:-1}],
  'Butterfly':(K,w)=>[{t:'c',K:K-w,n:1},{t:'c',K:K,n:-2},{t:'c',K:K+w,n:1}],
  'Covered call':(K,w)=>[{t:'s',n:1},{t:'c',K:K,n:-1}],
  'Protective put':(K,w)=>[{t:'s',n:1},{t:'p',K:K,n:1}],
  'Risk reversal':(K,w)=>[{t:'c',K:K+w,n:1},{t:'p',K:K-w,n:-1}]
};
function stratEval(legs,S0,r,v,T){
  const info=legs.map(l=>l.t==='s'?Object.assign({cost:S0},l):Object.assign({cost:bsPx(S0,l.K,T,r,0,v,l.t==='c')},l));
  const cost=info.reduce((a,l)=>a+(l.t==='s'?0:l.n*l.cost),0);
  const leg=(l,S)=>l.t==='s'?S:(l.t==='c'?Math.max(S-l.K,0):Math.max(l.K-S,0));
  return {cost,
    pnlExp:S=>info.reduce((a,l)=>a+l.n*(leg(l,S)-l.cost),0),
    pnlNow:S=>info.reduce((a,l)=>a+l.n*((l.t==='s'?S:bsPx(S,l.K,T,r,0,v,l.t==='c'))-l.cost),0)};
}
LABSPEC.strat={
  title:'Combine options to shape the payoff',
  chips:[{k:'name',v:'Straddle',opts:Object.keys(STRATS).map(k=>[k,k])}],
  sliders:[sld('K','Centre strike',80,120,1,100),sld('w','Width',5,30,1,10),sld('vol','Volatility',10,60,1,25,FP0),sld('T','Time to expiry',0.1,2,0.05,0.5,FY)],
  plots:[340],
  captions:['Solid: profit or loss at expiry. Dashed: profit or loss today if the spot jumps instantly (time value still alive). Spot is 100, rate 3%, no dividends, options priced with Black-Scholes.'],
  render(st,c){
    const t=c.t, legs=STRATS[st.name](st.K,st.w), E=stratEval(legs,100,0.03,st.vol/100,st.T);
    const xs=[]; for(let s=40;s<=170;s++) xs.push(s);
    const ex=xs.map(E.pnlExp), nw=xs.map(E.pnlNow);
    P2(c,0,[
      {x:xs,y:ex.map(v=>Math.max(v,0)),mode:'lines',line:{width:0},fill:'tozeroy',fillcolor:rg(t.c1,.25),hoverinfo:'skip',showlegend:false},
      {x:xs,y:ex.map(v=>Math.min(v,0)),mode:'lines',line:{width:0},fill:'tozeroy',fillcolor:rg(t.c2,.25),hoverinfo:'skip',showlegend:false},
      {x:xs,y:nw,name:'Today',mode:'lines',line:{color:t.muted,width:2,dash:'dash'},hovertemplate:'%{y:.2f}'},
      {x:xs,y:ex,name:'At expiry',mode:'lines',line:{color:t.acc,width:3.5},hovertemplate:'%{y:.2f}'}
    ],'Price of the underlying','Profit / loss',{shapes:[vl(100,t.muted)]});
    const g=[],pn=[]; for(let s=0.5;s<=250;s+=0.5){g.push(s);pn.push(E.pnlExp(s));}
    const L=pn.length-1; let mx=-1e9,mn=1e9; pn.forEach(v=>{mx=Math.max(mx,v);mn=Math.min(mn,v);});
    const upU=pn[L]>=mx-1e-9&&pn[L]-pn[L-1]>1e-6, dnU=pn[L]<=mn+1e-9&&pn[L]-pn[L-1]<-1e-6;
    const bes=[]; for(let i=1;i<=L;i++){ if(pn[i-1]*pn[i]<0||(pn[i]===0&&pn[i-1]!==0)){const a=pn[i-1],b=pn[i]; bes.push(g[i-1]+(g[i]-g[i-1])*(-a)/(b-a));} }
    const desc=legs.map(l=>(l.n>0?'+':'−')+Math.abs(l.n)+' '+(l.t==='s'?'stock':(l.t==='c'?'call ':'put ')+l.K)).join(',  ');
    c.ro(ro('Legs',desc)+ro(E.cost>=0?'Net cost':'Net credit',fx(Math.abs(E.cost)))+ro('Max profit',upU?'unlimited':fx(mx))+ro('Max loss',dnU?'unlimited':fx(-mn))+ro('Break-even',bes.length?bes.map(b=>fx(b,1)).join(' / '):'none'));
  }
};

/* ---------- lab 3: one-step tree ---------- */
function tree1(st){
  const S=100,K=st.K,r=st.r/100,T=st.T,u=1+st.up/100,d=1-st.dn/100,call=st.type==='c',er=Math.exp(r*T);
  const Su=S*u,Sd=S*d,Vu=call?Math.max(Su-K,0):Math.max(K-Su,0),Vd=call?Math.max(Sd-K,0):Math.max(K-Sd,0);
  const q=(er-d)/(u-d),delta=(Vu-Vd)/(S*(u-d)),B=(u*Vd-d*Vu)/(u-d)/er;
  return {S,K,r,T,u,d,call,er,Su,Sd,Vu,Vd,q,delta,B,price:delta*S+B,priceQ:(q*Vu+(1-q)*Vd)/er};
}
LABSPEC.tree1={
  title:'One step: replicate the option',
  chips:[TYPE_CHIPS],
  sliders:[sld('K','Strike',80,120,1,100),sld('up','Up move',5,40,1,20,FP0),sld('dn','Down move',5,40,1,15,FP0),sld('r','Interest rate',0,10,0.5,5,FP1),sld('T','Time',0.25,2,0.25,1,FY),sld('h','Your hedge: shares held',-1.2,1.2,0.01,0.3,F2)],
  buttons:[{label:'Set hedge to Δ*',fn:(st,set)=>{const a=tree1(st); set('h',Math.max(-1.2,Math.min(1.2,Math.round(a.delta*100)/100)));}}],
  plots:[300,250],
  captions:['Spot is 100. The tree shows the two possible futures and what the option pays in each.','You sell the option at its fair price, buy h shares and park the rest of the cash at the risk-free rate. At h = Δ* both bars are zero: the hedge removes all risk.'],
  calc:true,
  render(st,c){
    const t=c.t, a=tree1(st), h=st.h;
    const nodes={x:[0,1,1],y:[0,1,-1],mode:'markers+text',marker:{size:11,color:[t.ink,t.c1,t.c2]},
      text:['Today<br>'+fx(a.S),'Up: '+fx(a.Su)+'<br>option pays '+fx(a.Vu),'Down: '+fx(a.Sd)+'<br>option pays '+fx(a.Vd)],
      textposition:['middle left','middle right','middle right'],textfont:{color:t.ink,size:12},hoverinfo:'skip',showlegend:false};
    const edges={x:[0,1,null,0,1],y:[0,1,null,0,-1],mode:'lines',line:{color:t.muted,width:2},hoverinfo:'skip',showlegend:false};
    const lab={x:[0.5,0.5],y:[0.62,-0.62],mode:'text',text:['q = '+fx(a.q,3),'1 − q = '+fx(1-a.q,3)],textposition:['top left','bottom left'],textfont:{color:t.muted,size:11},hoverinfo:'skip',showlegend:false};
    c.plot(0,[edges,lab,nodes],L2(t,{margin:{l:6,r:6,t:6,b:6},xaxis:{visible:false,range:[-0.95,2.35],fixedrange:true},yaxis:{visible:false,range:[-1.6,1.6],fixedrange:true},hovermode:'closest',showlegend:false}));
    const pl=(V,Ss)=>-V+h*Ss+(a.price-h*a.S)*a.er, plU=pl(a.Vu,a.Su), plD=pl(a.Vd,a.Sd);
    const col=v=>Math.abs(v)<0.005?t.muted:(v>0?t.c1:t.c2);
    const m=Math.max(1,Math.abs(plU),Math.abs(plD))*1.35;
    c.plot(1,[{type:'bar',x:['Stock rises','Stock falls'],y:[plU,plD],marker:{color:[col(plU),col(plD)]},text:[fx(plU),fx(plD)],textposition:'outside',cliponaxis:false,hoverinfo:'skip'}],
      L2(t,{margin:{l:62,r:14,t:16,b:40},xaxis:A2(t,''),yaxis:A2(t,'Your P&L at expiry',{range:[-m,m]}),showlegend:false,hovermode:'closest'}));
    const bad=!(a.q>0&&a.q<1);
    c.ro(ro('Hedge ratio Δ*',fx(a.delta,3))+ro('Cash B',fx(a.B))+ro('Risk-neutral q',fx(a.q,3),bad?'var(--c2)':null)+ro('Option price',fx(a.price))+
      (bad?'<span class="ro" style="color:var(--c2)">q is outside 0 to 1: this tree has free money, so it cannot be a real market</span>':''));
    c.calc('Payoffs: V<sub>u</sub> = '+fx(a.Vu)+',  V<sub>d</sub> = '+fx(a.Vd)+'<br>'+
      'Δ* = (V<sub>u</sub> − V<sub>d</sub>) / (S(u − d)) = ('+fx(a.Vu)+' − '+fx(a.Vd)+') / ('+fx(a.S)+' × '+fx(a.u-a.d,3)+') = <b>'+fx(a.delta,4)+'</b><br>'+
      'B = e<sup>−rT</sup>(u·V<sub>d</sub> − d·V<sub>u</sub>) / (u − d) = <b>'+fx(a.B)+'</b><br>'+
      'Price = Δ*·S + B = '+fx(a.delta*a.S)+' + '+fx(a.B)+' = <b>'+fx(a.price,4)+'</b><br>'+
      'Check with q: e<sup>−rT</sup>[q·V<sub>u</sub> + (1−q)·V<sub>d</sub>] = <b>'+fx(a.priceQ,4)+'</b>');
  }
};

/* ---------- lab 4: multi-step tree ---------- */
LABSPEC.tree2={
  title:'Many steps: the tree approaches Black-Scholes',
  chips:[TYPE_CHIPS,{k:'style',label:'Exercise',v:'e',opts:[['e','European'],['a','American']]}],
  sliders:[sld('K','Strike',70,130,1,100),sld('vol','Volatility',10,60,1,30,FP0),sld('T','Time',0.25,2,0.25,1,FY),sld('r','Interest rate',0,10,0.5,5,FP1),sld('n','Steps',1,60,1,6)],
  plots:[280,300],
  captions:['Risk-neutral probability of each final price. Green bars are final prices where the option pays something.','Tree price against the number of steps. The zigzag comes from where the strike falls between final nodes. Dashed line: Black-Scholes. Dot: your current step count.'],
  render(st,c){
    const t=c.t,S=100,K=st.K,v=st.vol/100,T=st.T,r=st.r/100,call=st.type==='c',amer=st.style==='a',n=Math.round(st.n);
    const main=crr(S,K,T,r,0,v,n,call,amer), eur=crr(S,K,T,r,0,v,n,call,false).price, bsP=bsPx(S,K,T,r,0,v,call);
    const p=main.p,u=main.u,ok=p>0&&p<1;
    const lf=[0]; for(let i=1;i<=n;i++) lf[i]=lf[i-1]+Math.log(i);
    const xs=[],pr=[],cl=[];
    for(let j=0;j<=n;j++){
      const s=S*Math.pow(u,2*j-n); xs.push(s);
      pr.push(ok?Math.exp(lf[n]-lf[j]-lf[n-j]+j*Math.log(p)+(n-j)*Math.log(1-p)):0);
      cl.push((call?s>K:s<K)?t.c1:t.muted);
    }
    c.plot(0,[{type:'bar',x:xs,y:pr,marker:{color:cl},hovertemplate:'final price %{x:.1f}<br>probability %{y:.3f}<extra></extra>'}],
      L2(t,{margin:{l:62,r:14,t:12,b:50},xaxis:A2(t,'Price at expiry'),yaxis:A2(t,'Probability'),showlegend:false,hovermode:'closest',bargap:0.15,shapes:[vl(K,t.c2,'dash')]}));
    const ns=[]; for(let k=1;k<=100;k++) ns.push(k);
    const ye=ns.map(k=>crr(S,K,T,r,0,v,k,call,false).price), ya=amer?ns.map(k=>crr(S,K,T,r,0,v,k,call,true).price):null;
    const tr=[{x:ns,y:ye,name:'Tree, European',mode:'lines',line:{color:t.c1,width:2.5},hovertemplate:'%{y:.3f}'}];
    if(amer) tr.push({x:ns,y:ya,name:'Tree, American',mode:'lines',line:{color:t.c3,width:2.5},hovertemplate:'%{y:.3f}'});
    tr.push({x:[1,100],y:[bsP,bsP],name:'Black-Scholes',mode:'lines',line:{color:t.acc,width:2,dash:'dash'},hoverinfo:'skip'});
    tr.push({x:[n],y:[main.price],name:'Your steps',mode:'markers',marker:{size:11,color:t.c2,line:{color:t.surface,width:2}},hoverinfo:'skip'});
    P2(c,1,tr,'Number of steps','Option price');
    c.ro(ro('Tree price',fx(main.price,3))+ro('Black-Scholes',fx(bsP,3))+ro('Tree − BS (European)',fx(eur-bsP,3))+
      (amer?ro('Early-exercise premium',fx(main.price-eur,3)):'')+ro('Up-probability q',fx(p,3),ok?null:'var(--c2)')+
      (ok?'':'<span class="ro" style="color:var(--c2)">q outside 0 to 1: add steps or lower the rate</span>'));
  }
};

/* ---------- lab 5: Black-Scholes price ---------- */
LABSPEC.bsprice={
  title:'Black-Scholes price',
  chips:[TYPE_CHIPS],
  sliders:[sld('S','Spot',50,150,1,100),sld('K','Strike',50,150,1,100),sld('T','Time to expiry',0.02,3,0.01,1,FY),sld('vol','Volatility',5,80,1,25,FP0),sld('r','Interest rate',0,10,0.25,3,FP1),sld('q','Dividend yield',0,6,0.25,1,FP1)],
  plots:[330],
  captions:['Solid: option value today. Dashed: payoff at expiry. Dot: where the spot is now. The gap between them is time value.'],
  calc:true,
  render(st,c){
    const t=c.t,S=st.S,K=st.K,T=st.T,v=st.vol/100,r=st.r/100,q=st.q/100,call=st.type==='c';
    const o=bsAll(S,K,T,r,q,v,true), pu=bsAll(S,K,T,r,q,v,false), me=call?o:pu, sd=v*Math.sqrt(T);
    const xs=[]; for(let s=20;s<=200;s+=2) xs.push(s);
    const val=xs.map(s=>bsPx(s,K,T,r,q,v,call)), pay=xs.map(s=>call?Math.max(s-K,0):Math.max(K-s,0));
    P2(c,0,[
      {x:xs,y:pay,name:'Payoff at expiry',mode:'lines',line:{color:t.muted,width:2,dash:'dash'},hovertemplate:'%{y:.2f}'},
      {x:xs,y:val,name:'Value today',mode:'lines',line:{color:t.acc,width:3.5},hovertemplate:'%{y:.2f}'},
      {x:[S],y:[me.p],name:'Now',mode:'markers',marker:{size:12,color:t.c2,line:{color:t.surface,width:2}},hoverinfo:'skip'}
    ],'Spot price','Option value');
    const intr=call?Math.max(S*o.eq-K*o.er,0):Math.max(K*o.er-S*o.eq,0);
    c.ro(ro(call?'Call':'Put',fx(me.p,3))+ro('Intrinsic (discounted)',fx(intr,3))+ro('Time value',fx(me.p-intr,3))+ro('Chance of finishing in the money',fx(100*me.nd2,1)+'%')+ro('Forward',fx(o.F)));
    c.calc('d1 = [ln(S/K) + (r − q + σ²/2)T] / σ√T = ['+fx(Math.log(S/K),4)+' + '+fx((r-q+0.5*v*v)*T,4)+'] / '+fx(sd,4)+' = <b>'+fx(o.d1,4)+'</b><br>'+
      'd2 = d1 − σ√T = <b>'+fx(o.d2,4)+'</b>&nbsp;&nbsp; N(d1) = '+fx(o.n1,4)+',&nbsp; N(d2) = '+fx(o.n2,4)+'<br>'+
      'Call = S·e<sup>−qT</sup>·N(d1) − K·e<sup>−rT</sup>·N(d2) = '+fx(S*o.eq*o.n1)+' − '+fx(K*o.er*o.n2)+' = <b>'+fx(o.p,4)+'</b><br>'+
      'Put = K·e<sup>−rT</sup>·N(−d2) − S·e<sup>−qT</sup>·N(−d1) = '+fx(K*o.er*(1-o.n2))+' − '+fx(S*o.eq*(1-o.n1))+' = <b>'+fx(pu.p,4)+'</b><br>'+
      'Put-call parity: C − P = '+fx(o.p-pu.p,4)+' and S·e<sup>−qT</sup> − K·e<sup>−rT</sup> = '+fx(S*o.eq-K*o.er,4));
  }
};

/* ---------- lab 6: lognormal distribution ---------- */
LABSPEC.lognormal={
  title:'Where the price comes from: the distribution of the final price',
  chips:[TYPE_CHIPS],
  sliders:[sld('K','Strike',60,160,1,110),sld('vol','Volatility',5,80,1,30,FP0),sld('T','Time to expiry',0.1,3,0.1,1,FY),sld('r','Interest rate',0,10,0.25,3,FP1)],
  plots:[300],
  captions:['Risk-neutral density of the price at expiry, spot 100. The shaded area is the chance the option pays something. It is skewed right: prices cannot go below zero but can rise a lot.'],
  calc:true,
  render(st,c){
    const t=c.t,S=100,K=st.K,v=st.vol/100,T=st.T,r=st.r/100,call=st.type==='c',sd=v*Math.sqrt(T),m=Math.log(S)+(r-0.5*v*v)*T;
    const lo=Math.exp(m-4*sd),hi=Math.exp(m+4*sd),N=300,xs=[],ys=[],sh=[];
    for(let i=0;i<=N;i++){const s=lo+(hi-lo)*i/N,f=lnDensity(s,S,r,v,T); xs.push(s); ys.push(f); sh.push((call?s>K:s<K)?f:0);}
    const F=S*Math.exp(r*T);
    P2(c,0,[
      {x:xs,y:sh,mode:'lines',line:{width:0},fill:'tozeroy',fillcolor:rg(t.c1,.3),hoverinfo:'skip',showlegend:false},
      {x:xs,y:ys,name:'Density',mode:'lines',line:{color:t.acc,width:3},hovertemplate:'%{y:.4f}'}
    ],'Price at expiry','Probability density',{xe:{range:[Math.min(lo,K*0.95),Math.max(hi,K*1.05)]},ye:{tickformat:'.3f'},shapes:[vl(K,t.c2,'dash'),vl(F,t.muted)],showlegend:false});
    const d2=(Math.log(S/K)+(r-0.5*v*v)*T)/sd, pITM=call?cnd(d2):cnd(-d2);
    let sum=0; const n=4000,zl=-8,zh=8,dz=(zh-zl)/n;
    for(let i=0;i<=n;i++){const z=zl+i*dz,s=S*Math.exp((r-0.5*v*v)*T+sd*z),w=(i===0||i===n)?0.5:1; sum+=w*(call?Math.max(s-K,0):Math.max(K-s,0))*npdf(z)*dz;}
    const integ=Math.exp(-r*T)*sum, bsv=bsPx(S,K,T,r,0,v,call);
    c.ro(ro('Chance of paying out',fx(100*pITM,1)+'%')+ro('Forward (mean)',fx(F))+ro('Median',fx(Math.exp(m)))+'<span class="ro">Pink dashed line: strike. Grey line: forward.</span>');
    c.calc('Price = e<sup>−rT</sup> × average of payoff over the density<br>= e<sup>−rT</sup> ∫ payoff(s) · f(s) ds = <b>'+fx(integ,4)+'</b><br>Black-Scholes formula: <b>'+fx(bsv,4)+'</b><br>The two agree: the formula is that integral worked out in closed form.');
  }
};

/* ---------- lab 7: 3D price surface ---------- */
LABSPEC.bs3d={
  title:'Price surface in 3D',
  chips:[TYPE_CHIPS,{k:'axis',label:'Second axis',v:'t',opts:[['t','Time to expiry'],['v','Volatility']]}],
  sliders:[sld('K','Strike',60,140,1,100),sld('T','Time (when not on axis)',0.1,2,0.05,1,FY),sld('vol','Volatility (when not on axis)',5,80,1,25,FP0),sld('r','Interest rate',0,10,0.25,3,FP1),sld('q','Dividend yield',0,6,0.25,0,FP1)],
  plots:[440],
  captions:['Drag to rotate, pinch or scroll to zoom. With time on the axis, the front edge (zero time) is the payoff kink and the surface lifts away from it as time grows.'],
  render(st,c){
    const t=c.t,K=st.K,r=st.r/100,q=st.q/100,call=st.type==='c',xs=[],ys=[];
    for(let s=50;s<=150;s+=4) xs.push(s);
    let z,yt;
    if(st.axis==='t'){ for(let T=0.05;T<=2.0001;T+=0.05) ys.push(T); z=ys.map(T=>xs.map(s=>bsPx(s,K,T,r,q,st.vol/100,call))); yt='Time (yrs)'; }
    else { for(let v=0.05;v<=0.8001;v+=0.025) ys.push(v*100); z=ys.map(v=>xs.map(s=>bsPx(s,K,st.T,r,q,v/100,call))); yt='Volatility (%)'; }
    c.plot(0,[{type:'surface',x:xs,y:ys,z,colorscale:cscale(t),showscale:false,contours:{z:{show:true,usecolormap:true,project:{z:false}}},hovertemplate:'spot %{x:.0f}<br>'+yt+' %{y:.2f}<br>value %{z:.2f}<extra></extra>'}],
      scene(t,'Spot',yt,'Value'));
    c.ro(ro('At-the-money value',fx(bsPx(K,K,st.axis==='t'?1:st.T,r,q,st.vol/100,call)))+ro('Strike',K));
  }
};

/* ---------- lab 8: Greeks ---------- */
const GRK={
  delta:{n:'Delta',u:'per $1 of spot',f:o=>o.delta},
  gamma:{n:'Gamma',u:'change in delta per $1',f:o=>o.gamma},
  vega:{n:'Vega',u:'per 1 vol point',f:o=>o.vega/100},
  theta:{n:'Theta',u:'per calendar day',f:o=>o.theta/365},
  rho:{n:'Rho',u:'per 1% of rate',f:o=>o.rho/100}
};
LABSPEC.greeks={
  title:'Greek explorer',
  chips:[{k:'g',label:'Greek',v:'delta',opts:[['delta','Delta'],['gamma','Gamma'],['vega','Vega'],['theta','Theta'],['rho','Rho']]},{k:'type',label:'Option',v:'c',opts:[['c','Call'],['p','Put']]}],
  sliders:[sld('S','Spot',60,140,1,100),sld('K','Strike',60,140,1,100),sld('T','Time to expiry',0.02,2,0.01,0.5,FY),sld('vol','Volatility',5,80,1,25,FP0),sld('r','Interest rate',0,10,0.25,3,FP1),sld('q','Dividend yield',0,6,0.25,0,FP1)],
  plots:[300,300,420],
  captions:['Against spot. The dot is your current spot. Call and put are drawn together where they differ.','Against time left, for an in-the-money, at-the-money and out-of-the-money option with the same strike. Time runs left to right towards expiry.','The same Greek over spot and time for the option type you chose. Drag to rotate.'],
  calc:true,
  render(st,c){
    const t=c.t,K=st.K,v=st.vol/100,r=st.r/100,q=st.q/100,G=GRK[st.g],call=st.type==='c',yl=G.n+' ('+G.u+')';
    const xs=[]; for(let s=40;s<=160;s++) xs.push(s);
    const yc=xs.map(s=>G.f(bsAll(s,K,st.T,r,q,v,true))), yp=xs.map(s=>G.f(bsAll(s,K,st.T,r,q,v,false)));
    const same=st.g==='gamma'||st.g==='vega';
    const cur=G.f(bsAll(st.S,K,st.T,r,q,v,call));
    const tr=[{x:xs,y:yc,name:same?'Call and put':'Call',mode:'lines',line:{color:t.c1,width:3},hovertemplate:'%{y:.4f}'}];
    if(!same) tr.push({x:xs,y:yp,name:'Put',mode:'lines',line:{color:t.c2,width:3},hovertemplate:'%{y:.4f}'});
    tr.push({x:[st.S],y:[cur],name:'Now',mode:'markers',marker:{size:12,color:t.acc,line:{color:t.surface,width:2}},hoverinfo:'skip'});
    P2(c,0,tr,'Spot price',yl,{ye:{ticksuffix:''},shapes:[vl(K,t.muted)]});
    const Ts=[]; for(let i=0;i<=200;i++) Ts.push(1-0.995*i/200);
    const lines=[['In the money',1.1,t.c1],['At the money',1.0,t.acc],['Out of the money',0.9,t.c2]];
    P2(c,1,lines.map(l=>({x:Ts,y:Ts.map(T=>G.f(bsAll(K*l[1],K,T,r,q,v,call))),name:l[0],mode:'lines',line:{color:l[2],width:3},hovertemplate:'%{y:.4f}'})),
      'Years left (time runs → towards expiry)',yl,{xe:{range:[1,0]},ye:{ticksuffix:''}});
    const sx=[],ty=[]; for(let s=50;s<=150;s+=5) sx.push(s); for(let T=0.05;T<=2.0001;T+=0.05) ty.push(T);
    const z=ty.map(T=>sx.map(s=>G.f(bsAll(s,K,T,r,q,v,call))));
    c.plot(2,[{type:'surface',x:sx,y:ty,z,colorscale:cscale(t),showscale:false,contours:{z:{show:true,usecolormap:true,project:{z:false}}},hovertemplate:'spot %{x:.0f}<br>years %{y:.2f}<br>'+G.n+' %{z:.4f}<extra></extra>'}],scene(t,'Spot','Years left',G.n));
    const o=bsAll(st.S,K,st.T,r,q,v,call);
    c.ro(ro('Value',fx(o.p,3))+ro('Delta',fx(o.delta,3))+ro('Gamma',fx(o.gamma,4))+ro('Vega /pt',fx(o.vega/100,3))+ro('Theta /day',fx(o.theta/365,3))+ro('Rho /1%',fx(o.rho/100,3)));
    const res=o.theta+0.5*v*v*st.S*st.S*o.gamma+(r-q)*st.S*o.delta-r*o.p;
    c.calc('Black-Scholes equation: Θ + ½σ²S²Γ + (r−q)SΔ − rV = 0<br>'+
      fx(o.theta,4)+' + '+fx(0.5*v*v*st.S*st.S*o.gamma,4)+' + '+fx((r-q)*st.S*o.delta,4)+' − '+fx(r*o.p,4)+' = <b>'+fx(res,6)+'</b><br>'+
      'Theta (per year) and the gamma term pull in opposite directions: what you earn from curvature you pay in time decay.');
  }
};

/* ---------- lab 9: P&L explain ---------- */
LABSPEC.taylor={
  title:'What moved my option? Delta, gamma, vega and theta',
  chips:[TYPE_CHIPS],
  sliders:[sld('K','Strike',80,120,1,100),sld('T','Time to expiry',0.25,2,0.05,0.5,FY),sld('vol','Volatility',12,60,1,25,FP0),sld('r','Interest rate',0,8,0.25,3,FP1),
    sld('dS','Spot moves by',-25,25,0.5,6,FS1),sld('dv','Volatility moves by',-10,10,0.5,-2,v=>FS1(v)+' pts'),sld('days','Days pass',0,30,1,7,v=>v.toFixed(0)+' d')],
  plots:[300,300],
  captions:['Why the option value changed, step by step. Green adds value, pink removes it. "Unexplained" is what the first-order and second-order terms miss.','Value against spot with everything else fixed. The straight line is delta, the parabola adds gamma. Dot: the true value after the spot move.'],
  render(st,c){
    const t=c.t,S0=100,K=st.K,v=st.vol/100,r=st.r/100,call=st.type==='c';
    const o=bsAll(S0,K,st.T,r,0,v,call), T1=Math.max(st.T-st.days/365,0.003);
    const V1=bsPx(S0+st.dS,K,T1,r,0,v+st.dv/100,call);
    const dD=o.delta*st.dS, dG=0.5*o.gamma*st.dS*st.dS, dV=o.vega/100*st.dv, dT=o.theta/365*st.days;
    const act=V1-o.p, un=act-(dD+dG+dV+dT), ys=[dD,dG,dV,dT,un,act];
    c.plot(0,[{type:'waterfall',orientation:'v',x:['Delta','Gamma','Vega','Theta','Unexplained','Actual change'],measure:['relative','relative','relative','relative','relative','total'],
      y:ys,text:ys.map(y=>(y>=0?'+':'')+fx(y,2)),textposition:'outside',cliponaxis:false,connector:{line:{color:t.line}},
      increasing:{marker:{color:t.c1}},decreasing:{marker:{color:t.c2}},totals:{marker:{color:t.acc}},hoverinfo:'skip'}],
      L2(t,{margin:{l:62,r:14,t:20,b:46},xaxis:A2(t,''),yaxis:A2(t,'Change in option value'),showlegend:false,hovermode:'closest'}));
    const xs=[]; for(let s=70;s<=130;s+=1) xs.push(s);
    const so=bsPx(S0+st.dS,K,st.T,r,0,v,call)-o.p;
    P2(c,1,[
      {x:xs,y:xs.map(s=>bsPx(s,K,st.T,r,0,v,call)),name:'True value',mode:'lines',line:{color:t.acc,width:3.5},hovertemplate:'%{y:.2f}'},
      {x:xs,y:xs.map(s=>o.p+o.delta*(s-S0)),name:'Delta only',mode:'lines',line:{color:t.c3,width:2,dash:'dash'},hoverinfo:'skip'},
      {x:xs,y:xs.map(s=>o.p+o.delta*(s-S0)+0.5*o.gamma*(s-S0)*(s-S0)),name:'Delta + gamma',mode:'lines',line:{color:t.c1,width:2,dash:'dot'},hoverinfo:'skip'},
      {x:[S0+st.dS],y:[o.p+so],name:'After the move',mode:'markers',marker:{size:12,color:t.c2,line:{color:t.surface,width:2}},hoverinfo:'skip'}
    ],'Spot price','Option value');
    c.ro(ro('Value before',fx(o.p,3))+ro('Value after',fx(V1,3))+ro('Spot move: delta only error',fx(so-dD,3))+ro('Spot move: delta + gamma error',fx(so-dD-dG,3))+ro('Unexplained',fx(un,3)));
  }
};

/* ---------- lab 10: implied vol solver ---------- */
LABSPEC.ivsolve={
  title:'Solve for implied volatility',
  chips:[TYPE_CHIPS],
  sliders:[sld('K','Strike',70,130,1,105),sld('T','Time to expiry',0.1,2,0.05,0.5,FY),sld('P','Market price',0.1,30,0.05,4.2,F2),sld('s0','Newton starting guess',5,150,1,80,FP0)],
  plots:[340],
  captions:['Black-Scholes price against volatility (spot 100, rate 3%). The pink line is the market price. Newton\'s method slides along tangents (amber) until it lands on the curve at the market price.'],
  calc:true,
  render(st,c){
    const t=c.t,S=100,r=0.03,q=0,K=st.K,T=st.T,call=st.type==='c',P=st.P;
    const b=ivBounds(S,K,T,r,q,call), iv=ivSolve(P,S,K,T,r,q,call);
    const sg=[]; for(let s=0.02;s<=1.5001;s+=0.01) sg.push(s);
    const tr=[{x:sg,y:sg.map(s=>bsPx(S,K,T,r,q,s,call)),name:'Model price',mode:'lines',line:{color:t.c1,width:3.5},hovertemplate:'vol %{x:.1%}<br>price %{y:.2f}<extra></extra>'}];
    const path=newtonPath(P,S,K,T,r,q,call,st.s0/100,8), px=[], py=[];
    if(!isNaN(iv)){
      path.forEach((s,i)=>{px.push(s.s);py.push(s.px); const nx=path[i+1]; if(nx){px.push(nx.s);py.push(P);} });
      tr.push({x:px,y:py,name:'Newton steps',mode:'lines+markers',line:{color:t.acc,width:2},marker:{size:6,color:t.acc},hoverinfo:'skip'});
      tr.push({x:[iv],y:[P],name:'Implied vol',mode:'markers',marker:{size:13,color:t.c2,line:{color:t.surface,width:2}},hoverinfo:'skip'});
    }
    P2(c,0,tr,'Volatility','Option price',{xe:{tickformat:'.0%'},shapes:[hl(P,t.c2,'dash')]});
    if(isNaN(iv)){
      c.ro('<span class="ro" style="color:var(--c2)">No volatility gives this price. Allowed range is '+fx(b[0],3)+' to '+fx(b[1],3)+'</span>');
      c.calc('A price outside the no-arbitrage range has no implied volatility: below the lower bound you could buy, hedge and lock in a profit; above the upper bound you could sell.');
      return;
    }
    const last=path[path.length-1], conv=Math.abs(last.err)<1e-6;
    c.ro(ro('Implied volatility',fx(iv*100,2)+'%')+ro('Price range allowed',fx(b[0],2)+' – '+fx(b[1],2))+ro('Newton',conv?(path.length-1)+' steps':'did not converge',conv?null:'var(--c2)'));
    c.calc('σ<sub>next</sub> = σ − (BS(σ) − market) / vega<br>'+path.map(s=>'step '+s.k+':&nbsp; σ = '+fx(s.s*100,3)+'%,&nbsp; model '+fx(s.px,4)+',&nbsp; error '+(s.err>=0?'+':'')+fx(s.err,4)).join('<br>')+
      (conv?'':'<br>Newton stalled from this start because vega is tiny there. The robust bisection search still finds '+fx(iv*100,2)+'%.'));
  }
};

/* ---------- lab 11: smile ---------- */
LABSPEC.smile={
  title:'Build a smile and read the market\'s view from it',
  sliders:[sld('s0','At-the-money vol (3 months)',10,60,1,22,FP0),sld('ts','Term slope',-10,10,0.5,1,v=>FS1(v)+' pts/y'),sld('skew','Skew: extra vol for a put 10% below',0,6,0.5,2.5,v=>v.toFixed(1)+' pts'),
    sld('curv','Curvature: extra vol in both wings',0,2.5,0.1,0.6,F1),sld('T','Maturity for the density and pricing',0.25,2,0.05,1,FY),sld('Kp','Strike to price (% of spot)',70,130,1,90,v=>v.toFixed(0)+'%')],
  plots:[300,420,300],
  captions:['Implied volatility against strike for four maturities. Dashed: your chosen maturity. Short maturities have a steeper skew.','The whole implied volatility surface. Drag to rotate.','Risk-neutral density at your chosen maturity, recovered from the smile (second difference of call prices across strikes). Dashed: what a flat volatility would say.'],
  calc:true,
  render(st,c){
    const t=c.t,P={s0:st.s0,ts:st.ts,skew:st.skew,curv:st.curv},T=st.T,r=0.03;
    const Ks=[]; for(let k=70;k<=130;k++) Ks.push(k);
    const cols=[t.c3,t.c1,t.acc,t.c2], tr=[];
    [0.25,0.5,1,2].forEach((Tm,i)=>tr.push({x:Ks,y:Ks.map(k=>100*smileVolFn(k,Tm,P)),name:Tm+'y',mode:'lines',line:{color:cols[i],width:2.5},hovertemplate:'%{y:.1f}%'}));
    tr.push({x:Ks,y:Ks.map(k=>100*smileVolFn(k,T,P)),name:'Your maturity',mode:'lines',line:{color:t.ink,width:2,dash:'dash'},hovertemplate:'%{y:.1f}%'});
    P2(c,0,tr,'Strike (% of spot)','Implied volatility',{ye:{ticksuffix:'%'},shapes:[vl(st.Kp,t.muted)]});
    const k3=[],t3=[]; for(let k=70;k<=130;k+=3) k3.push(k); for(let x=0.25;x<=2.0001;x+=0.125) t3.push(x);
    const z=t3.map(Tm=>k3.map(k=>100*smileVolFn(k,Tm,P)));
    c.plot(1,[{type:'surface',x:k3,y:t3,z,colorscale:cscale(t),showscale:false,contours:{z:{show:true,usecolormap:true,project:{z:false}}},hovertemplate:'strike %{x:.0f}%<br>%{y:.2f} y<br>vol %{z:.1f}%<extra></extra>'}],scene(t,'Strike (% of spot)','Maturity (yrs)','Implied vol (%)'));
    const d=smileDensity(T,P,55,180), F=100*Math.exp(r*T), atm=smileVolFn(F,T,P);
    const flat=d.xs.map(x=>lnDensity(x,100,r,atm,T));
    P2(c,2,[
      {x:d.xs,y:flat,name:'Flat volatility',mode:'lines',line:{color:t.muted,width:2.5,dash:'dash'},hovertemplate:'%{y:.4f}'},
      {x:d.xs,y:d.ys,name:'From the smile',mode:'lines',line:{color:t.acc,width:3.5},hovertemplate:'%{y:.4f}'}
    ],'Price at expiry','Probability density',{ye:{tickformat:'.3f'},shapes:[vl(st.Kp,t.muted)]});
    const call=st.Kp>=100, vK=smileVolFn(st.Kp,T,P), pS=bsPx(100,st.Kp,T,r,0,vK,call), pF=bsPx(100,st.Kp,T,r,0,atm,call);
    const mn=Math.min.apply(null,d.ys), warn=mn<-2e-4;
    c.ro(ro('At-the-money vol',fx(atm*100,1)+'%')+ro('Vol at your strike',fx(vK*100,1)+'%')+ro((call?'Call ':'Put ')+st.Kp+'% with flat vol',fx(pF,3))+ro('With the smile',fx(pS,3))+ro('Smile adds',pF>0?fx(100*(pS/pF-1),0)+'%':'-')+
      (warn?'<span class="ro" style="color:var(--c2)">The density goes negative: this smile allows a butterfly arbitrage, so no real market would show it</span>':''));
    c.calc('Option priced here: '+(call?'call':'put')+' with strike '+st.Kp+' and spot 100. A single flat volatility misprices it by '+fx(pS-pF,3)+' because the market assigns that strike its own volatility.');
  }
};

/* ---------- lab 12: Monte Carlo ---------- */
const MCZ={seed:-1,Z:null};
function mcZ(seed){ if(MCZ.seed!==seed||!MCZ.Z){MCZ.seed=seed; MCZ.Z=normals(mulberry32(1234567+seed*7919),20000*52);} return MCZ.Z; }
LABSPEC.mc={
  title:'Simulate the price: paths and convergence',
  init:{seed:1},
  chips:[{k:'pay',label:'Payoff',v:'eu',opts:[['eu','European call'],['asian','Asian call (average price)'],['barrier','Up-and-out call']]}],
  sliders:[sld('K','Strike',70,130,1,100),sld('vol','Volatility',10,60,1,25,FP0),sld('T','Time',0.25,2,0.25,1,FY),sld('r','Interest rate',0,8,0.25,3,FP1),
    sld('bar','Barrier (% of spot, barrier option)',105,160,1,130,v=>v.toFixed(0)+'%'),sld('logN','Number of paths',2,4.3,0.05,3.3,v=>Math.round(Math.pow(10,v)).toLocaleString('en-US'))],
  buttons:[{label:'New random draw',fn:st=>{st.seed++;}}],
  plots:[320,320],
  captions:['Thirty of the simulated paths, spot 100, weekly steps. Dashed amber: strike. For the barrier option, pink paths touched the barrier and are knocked out (payoff 0).','Running estimate of the price as paths are added, on a log scale. Band: plain estimate ± 2 standard errors. Antithetic: every random draw is also used with its sign flipped.'],
  render(st,c){
    const t=c.t,S=100,K=st.K,v=st.vol/100,T=st.T,r=st.r/100,N=Math.round(Math.pow(10,st.logN)),m=52,B=S*st.bar/100,type=st.pay;
    const Z=mcZ(st.seed), p={S,K,T,r,v,type,B,m};
    const dt=T/m, drift=(r-0.5*v*v)*dt, vol=v*Math.sqrt(dt);
    const xt=[]; for(let j=0;j<=m;j++) xt.push(T*j/m);
    const tr=[];
    for(let i=0;i<30;i++){
      let ln=Math.log(S),ko=false; const ys=[S];
      for(let j=0;j<m;j++){ln+=drift+vol*Z[i*m+j]; const s=Math.exp(ln); ys.push(s); if(s>=B) ko=true;}
      tr.push({x:xt,y:ys,mode:'lines',line:{color:(type==='barrier'&&ko)?rg(t.c2,.6):rg(t.c1,.5),width:1.3},hoverinfo:'skip',showlegend:false});
    }
    const shp=[hl(K,t.acc,'dash')]; if(type==='barrier') shp.push(hl(B,t.c2,'solid'));
    P2(c,0,tr,'Years','Price',{shapes:shp,showlegend:false});
    const pl=new Float64Array(N); for(let i=0;i<N;i++) pl[i]=mcPay(Z,i*m,1,p);
    const M=Math.floor(N/2), an=new Float64Array(M); for(let i=0;i<M;i++) an[i]=0.5*(pl[i]+mcPay(Z,i*m,-1,p));
    const c1=logCps(N), c2=logCps(M), s1=runStats(pl,N,c1), s2=runStats(an,M,c2);
    const x2=c2.map(k=>2*k), lo=s1.mean.map((mu,i)=>mu-2*s1.se[i]), hi=s1.mean.map((mu,i)=>mu+2*s1.se[i]);
    const bsP=type==='eu'?bsPx(S,K,T,r,0,v,true):null;
    const tr2=[
      {x:c1,y:lo,mode:'lines',line:{width:0},hoverinfo:'skip',showlegend:false},
      {x:c1,y:hi,mode:'lines',line:{width:0},fill:'tonexty',fillcolor:rg(t.c1,.18),hoverinfo:'skip',showlegend:false},
      {x:c1,y:s1.mean,name:'Plain',mode:'lines',line:{color:t.c1,width:2.5},hovertemplate:'%{y:.3f}'},
      {x:x2,y:s2.mean,name:'Antithetic',mode:'lines',line:{color:t.c3,width:2.5},hovertemplate:'%{y:.3f}'}
    ];
    if(bsP!==null) tr2.push({x:[c1[0],N],y:[bsP,bsP],name:'Black-Scholes',mode:'lines',line:{color:t.acc,width:2,dash:'dash'},hoverinfo:'skip'});
    P2(c,1,tr2,'Payoffs simulated (log scale)','Price estimate',{xe:{type:'log'}});
    const e1=s1.se[s1.se.length-1], e2=s2.se[s2.se.length-1], m1=s1.mean[s1.mean.length-1], m2=s2.mean[s2.mean.length-1];
    c.ro(ro('Plain',fx(m1,3)+' ± '+fx(e1,3))+ro('Antithetic',fx(m2,3)+' ± '+fx(e2,3))+
      (bsP!==null?ro('Black-Scholes',fx(bsP,3)):ro('Closed form','none here: this is why we simulate'))+ro('Variance cut by antithetic',e2>0?fx((e1*e1)/(e2*e2),1)+'×':'-'));
  }
};

/* ---------- boot ---------- */
initLabs(); buildNav(); renderLabs();
onThemeChange(renderLabs);
