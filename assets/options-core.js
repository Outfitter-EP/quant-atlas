/* Option pricing maths: Black-Scholes and Greeks, binomial tree, implied volatility, Monte Carlo, smile and density.
   Pure functions. Tested by tools/test-options-core.js. */
// OPT CORE START
function cnd(x){
  const a=Math.abs(x); let c;
  if(a>37) c=0;
  else {
    const e=Math.exp(-a*a/2);
    if(a<7.07106781186547){
      let b=3.52624965998911E-02*a+0.700383064443688;
      b=b*a+6.37396220353165; b=b*a+33.912866078383; b=b*a+112.079291497871;
      b=b*a+221.213596169931; b=b*a+220.206867912376;
      c=e*b;
      b=8.83883476483184E-02*a+1.75566716318264;
      b=b*a+16.064177579207; b=b*a+86.7807322029461; b=b*a+296.564248779674;
      b=b*a+637.333633378831; b=b*a+793.826512519948; b=b*a+440.413735824752;
      c=c/b;
    } else {
      let b=a+0.65; b=a+4/b; b=a+3/b; b=a+2/b; b=a+1/b;
      c=e/b/2.506628274631;
    }
  }
  return x>0?1-c:c;
}
function npdf(x){return Math.exp(-0.5*x*x)/2.5066282746310002;}
function bsAll(S,K,T,r,q,v,call){
  const sq=Math.sqrt(T), sd=v*sq, d1=(Math.log(S/K)+(r-q+0.5*v*v)*T)/sd, d2=d1-sd;
  const eq=Math.exp(-q*T), er=Math.exp(-r*T), n1=cnd(d1), n2=cnd(d2), pd=npdf(d1);
  const o={d1,d2,F:S*Math.exp((r-q)*T),eq,er,n1,n2};
  if(call){
    o.p=S*eq*n1-K*er*n2; o.delta=eq*n1; o.nd2=n2;
    o.theta=-S*eq*pd*v/(2*sq)-r*K*er*n2+q*S*eq*n1;
    o.rho=K*T*er*n2;
  } else {
    const m1=cnd(-d1), m2=cnd(-d2);
    o.p=K*er*m2-S*eq*m1; o.delta=-eq*m1; o.nd2=m2;
    o.theta=-S*eq*pd*v/(2*sq)+r*K*er*m2-q*S*eq*m1;
    o.rho=-K*T*er*m2;
  }
  o.gamma=eq*pd/(S*sd); o.vega=S*eq*pd*sq;
  return o;
}
function bsPx(S,K,T,r,q,v,call){return bsAll(S,K,T,r,q,v,call).p;}
function crr(S,K,T,r,q,v,n,call,amer){
  const dt=T/n, u=Math.exp(v*Math.sqrt(dt)), d=1/u, p=(Math.exp((r-q)*dt)-d)/(u-d), disc=Math.exp(-r*dt), lu=Math.log(u);
  const V=new Float64Array(n+1);
  for(let j=0;j<=n;j++){const s=S*Math.exp((2*j-n)*lu); V[j]=call?Math.max(s-K,0):Math.max(K-s,0);}
  for(let i=n-1;i>=0;i--){
    for(let j=0;j<=i;j++){
      let c=disc*(p*V[j+1]+(1-p)*V[j]);
      if(amer){const s=S*Math.exp((2*j-i)*lu); const ex=call?s-K:K-s; if(ex>c) c=ex;}
      V[j]=c;
    }
  }
  return {price:V[0],p,u,d};
}
function ivBounds(S,K,T,r,q,call){const A=S*Math.exp(-q*T),B=K*Math.exp(-r*T);return call?[Math.max(A-B,0),A]:[Math.max(B-A,0),B];}
function ivSolve(P,S,K,T,r,q,call){
  const b=ivBounds(S,K,T,r,q,call);
  if(!(P>b[0]+1e-9&&P<b[1]-1e-9)) return NaN;
  let lo=1e-4,hi=6;
  for(let i=0;i<200;i++){const m=0.5*(lo+hi); if(bsPx(S,K,T,r,q,m,call)>P) hi=m; else lo=m;}
  return 0.5*(lo+hi);
}
function newtonPath(P,S,K,T,r,q,call,s0,maxIt){
  const out=[]; let s=s0;
  for(let k=0;k<maxIt;k++){
    const o=bsAll(S,K,T,r,q,s,call), err=o.p-P;
    out.push({k,s,px:o.p,err,vega:o.vega});
    if(Math.abs(err)<1e-8) break;
    let sn=s-err/o.vega;
    if(!isFinite(sn)) break;
    s=Math.min(Math.max(sn,1e-4),10);
  }
  return out;
}
function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
function normals(rng,n){
  const out=new Float32Array(n);
  for(let i=0;i<n;i+=2){
    let u=rng(),w=rng(); if(u<1e-12) u=1e-12;
    const R=Math.sqrt(-2*Math.log(u)), a=2*Math.PI*w;
    out[i]=R*Math.cos(a); if(i+1<n) out[i+1]=R*Math.sin(a);
  }
  return out;
}
function mcPay(Z,off,sgn,p){
  const m=p.m, dt=p.T/m, drift=(p.r-0.5*p.v*p.v)*dt, vol=p.v*Math.sqrt(dt);
  let lnS=Math.log(p.S), sum=0, ko=false;
  for(let j=0;j<m;j++){lnS+=drift+vol*sgn*Z[off+j]; const s=Math.exp(lnS); sum+=s; if(s>=p.B) ko=true;}
  const ST=Math.exp(lnS); let pay;
  if(p.type==='asian') pay=Math.max(sum/m-p.K,0);
  else if(p.type==='barrier') pay=ko?0:Math.max(ST-p.K,0);
  else pay=Math.max(ST-p.K,0);
  return Math.exp(-p.r*p.T)*pay;
}
function logCps(n){
  const a=Math.min(5,n), out=[], steps=120;
  for(let i=0;i<=steps;i++){const k=Math.round(a*Math.pow(n/a,i/steps)); if(!out.length||k>out[out.length-1]) out.push(k);}
  if(out[out.length-1]!==n) out.push(n);
  return out;
}
function runStats(arr,len,cps){
  const mean=[],se=[]; let s=0,s2=0,ci=0;
  for(let i=0;i<len&&ci<cps.length;i++){
    s+=arr[i]; s2+=arr[i]*arr[i];
    if(i+1===cps[ci]){
      const k=i+1, mu=s/k, va=k>1?Math.max((s2-k*mu*mu)/(k-1),0):0;
      mean.push(mu); se.push(Math.sqrt(va/k)); ci++;
    }
  }
  return {mean,se};
}
function smileVolFn(K,T,P){ // P:{s0,ts,skew,curv} in vol points; S=100, r=3%
  const F=100*Math.exp(0.03*T), x0=Math.log(K/F), x=0.5*Math.tanh(x0/0.5), f=Math.pow(T,-0.3);
  const atm=P.s0/100+P.ts/100*(T-0.25);
  const v=atm-(P.skew/10)*f*x+P.curv*f*x*x;
  return Math.min(Math.max(v,0.03),1.5);
}
function smileDensity(T,P,lo,hi){
  const r=0.03, Ks=[], C=[];
  for(let k=lo-1;k<=hi+1;k++){Ks.push(k); C.push(bsPx(100,k,T,r,0,smileVolFn(k,T,P),true));}
  const xs=[],ys=[];
  for(let i=1;i<Ks.length-1;i++){xs.push(Ks[i]); ys.push(Math.exp(r*T)*(C[i-1]-2*C[i]+C[i+1]));}
  return {xs,ys};
}
function lnDensity(s,S,r,v,T){const sd=v*Math.sqrt(T), m=Math.log(S)+(r-0.5*v*v)*T; return npdf((Math.log(s)-m)/sd)/(s*sd);}
// OPT CORE END

if(typeof module!=='undefined'&&module.exports){module.exports={cnd,npdf,bsAll,bsPx,crr,ivBounds,ivSolve,newtonPath,mulberry32,normals,mcPay,logCps,runStats,smileVolFn,smileDensity,lnDensity};}
