// Numerical tests for assets/options-core.js. Run: node tools/test-options-core.js
const {cnd,npdf,bsAll,bsPx,crr,ivBounds,ivSolve,newtonPath,mulberry32,normals,mcPay,logCps,runStats,smileVolFn,smileDensity,lnDensity}=require('../assets/options-core.js');
let failed=0;

const ok=(name,cond,info)=>{ if(!cond) failed++; console.log((cond?'PASS ':'FAIL ')+name+(info!==undefined?'  '+info:'')); }
const near=(a,b,tol)=>Math.abs(a-b)<=tol;
// normal cdf reference values
ok('N(0)',near(cnd(0),0.5,1e-14));
ok('N(1)',near(cnd(1),0.8413447460685429,1e-13),cnd(1));
ok('N(-2)',near(cnd(-2),0.022750131948179195,1e-13),cnd(-2));
ok('N(3)',near(cnd(3),0.9986501019683699,1e-13),cnd(3));
// BS reference: S=100 K=100 T=1 r=5% v=20% q=0 -> call 10.4506, put 5.5735
const c=bsAll(100,100,1,0.05,0,0.2,true), p=bsAll(100,100,1,0.05,0,0.2,false);
ok('BS call',near(c.p,10.4505835722,1e-6),c.p);
ok('BS put',near(p.p,5.5735260223,1e-6),p.p);
// put-call parity with dividends
const a=bsAll(95,100,0.7,0.03,0.02,0.3,true), b=bsAll(95,100,0.7,0.03,0.02,0.3,false);
ok('parity',near(a.p-b.p,95*Math.exp(-0.02*0.7)-100*Math.exp(-0.03*0.7),1e-12),a.p-b.p);
// Greeks vs finite differences
const S=100,K=105,T=0.6,r=0.03,q=0.01,v=0.27;
for(const call of [true,false]){
  const f=(s,t,vv,rr)=>bsPx(s,K,t,rr,q,vv,call), o=bsAll(S,K,T,r,q,v,call), h=1e-3;
  const dN=(f(S+h,T,v,r)-f(S-h,T,v,r))/(2*h);
  const gN=(f(S+h,T,v,r)-2*f(S,T,v,r)+f(S-h,T,v,r))/(h*h);
  const vN=(f(S,T,v+h,r)-f(S,T,v-h,r))/(2*h);
  const tN=-(f(S,T+h,v,r)-f(S,T-h,v,r))/(2*h);
  const rN=(f(S,T,v,r+h)-f(S,T,v,r-h))/(2*h);
  ok((call?'call':'put')+' delta',near(o.delta,dN,1e-6),o.delta+' vs '+dN);
  ok((call?'call':'put')+' gamma',near(o.gamma,gN,1e-5),o.gamma+' vs '+gN);
  ok((call?'call':'put')+' vega',near(o.vega,vN,1e-5),o.vega+' vs '+vN);
  ok((call?'call':'put')+' theta',near(o.theta,tN,1e-5),o.theta+' vs '+tN);
  ok((call?'call':'put')+' rho',near(o.rho,rN,1e-5),o.rho+' vs '+rN);
  const pde=o.theta+0.5*v*v*S*S*o.gamma+(r-q)*S*o.delta-r*o.p;
  ok((call?'call':'put')+' BS PDE residual',Math.abs(pde)<1e-9,pde);
}
// CRR converges to BS, American put > European put
const bsC=bsPx(100,100,1,0.05,0,0.2,true);
ok('CRR n=200 call',near(crr(100,100,1,0.05,0,0.2,200,true,false).price,bsC,0.03),crr(100,100,1,0.05,0,0.2,200,true,false).price);
ok('CRR n=1000 call',near(crr(100,100,1,0.05,0,0.2,1000,true,false).price,bsC,0.01));
const eu=crr(100,100,1,0.05,0,0.2,400,false,false).price, am=crr(100,100,1,0.05,0,0.2,400,false,true).price;
ok('American put >= European',am>eu+0.1,eu.toFixed(4)+' < '+am.toFixed(4));
ok('American call no div = European',near(crr(100,100,1,0.05,0,0.2,200,true,true).price,crr(100,100,1,0.05,0,0.2,200,true,false).price,1e-9));
// one-step replication equals risk-neutral price
{
  const S=100,K=100,r=0.05,T=1,u=1.2,d=0.85,Vu=20,Vd=0, er=Math.exp(r*T);
  const qq=(er-d)/(u-d), delta=(Vu-Vd)/(S*(u-d)), B=Math.exp(-r*T)*(u*Vd-d*Vu)/(u-d);
  ok('replication = risk-neutral',near(delta*S+B,Math.exp(-r*T)*(qq*Vu+(1-qq)*Vd),1e-12),(delta*S+B)+' q='+qq);
  const h=delta, price=delta*S+B; const pl=(V,Ss)=>-V+h*Ss+(price-h*S)*er;
  ok('hedged PL zero at delta*',near(pl(Vu,S*u),0,1e-12)&&near(pl(Vd,S*d),0,1e-12));
}
// Implied vol round trip + Newton
{
  const P=bsPx(100,110,0.5,0.03,0,0.37,true), iv=ivSolve(P,100,110,0.5,0.03,0,true);
  ok('IV bisection',near(iv,0.37,1e-8),iv);
  const path=newtonPath(P,100,110,0.5,0.03,0,true,0.8,10);
  ok('Newton converges',Math.abs(path[path.length-1].err)<1e-8,path.length+' its, last s='+path[path.length-1].s);
  ok('IV out of bounds NaN',isNaN(ivSolve(0.001,100,60,0.5,0.03,0,true)));
}
// Monte Carlo: European call vs BS, antithetic SE smaller
{
  const N=20000,m=52,Z=normals(mulberry32(1234567),N*m);
  const p={S:100,K:100,T:1,r:0.05,v:0.2,type:'eu',B:130,m};
  const pl=new Float64Array(N); for(let i=0;i<N;i++) pl[i]=mcPay(Z,i*m,1,p);
  const M=N/2, an=new Float64Array(M); for(let i=0;i<M;i++) an[i]=0.5*(pl[i]+mcPay(Z,i*m,-1,p));
  const s1=runStats(pl,N,logCps(N)), s2=runStats(an,M,logCps(M));
  const mu1=s1.mean[s1.mean.length-1], se1=s1.se[s1.se.length-1], mu2=s2.mean[s2.mean.length-1], se2=s2.se[s2.se.length-1];
  ok('MC plain within 4 SE of BS',Math.abs(mu1-bsC)<4*se1,mu1.toFixed(4)+' ± '+se1.toFixed(4)+' vs '+bsC.toFixed(4));
  ok('MC antithetic within 4 SE of BS',Math.abs(mu2-bsC)<4*se2,mu2.toFixed(4)+' ± '+se2.toFixed(4));
  ok('antithetic SE smaller',se2<se1,se2.toFixed(4)+' < '+se1.toFixed(4));
  const pa=Object.assign({},p,{type:'asian'}), pb=Object.assign({},p,{type:'barrier'});
  let sa=0,sb=0; for(let i=0;i<N;i++){sa+=mcPay(Z,i*m,1,pa); sb+=mcPay(Z,i*m,1,pb);}
  ok('Asian < European',sa/N<mu1,(sa/N).toFixed(3));
  ok('Barrier < European',sb/N<mu1,(sb/N).toFixed(3));
  const cps=logCps(100); ok('cps ends at n and increasing',cps[cps.length-1]===100&&cps.every((x,i)=>i===0||x>cps[i-1]),cps.length+' pts');
  const cps2=logCps(50); ok('cps small n',cps2[cps2.length-1]===50);
}
// Lognormal density integrates to price
{
  const S=100,K=110,T=1,r=0.03,v=0.3; let sum=0; const n=4000,zl=-8,zh=8,dz=(zh-zl)/n;
  for(let i=0;i<=n;i++){const z=zl+i*dz,s=S*Math.exp((r-0.5*v*v)*T+v*Math.sqrt(T)*z),w=(i===0||i===n)?0.5:1; sum+=w*Math.max(s-K,0)*npdf(z)*dz;}
  ok("integral = BS",near(Math.exp(-r*T)*sum,bsPx(S,K,T,r,0,v,true),1e-4),Math.exp(-r*T)*sum+' vs '+bsPx(S,K,T,r,0,v,true));
  let mass=0; for(let s=1;s<=1000;s+=0.05) mass+=lnDensity(s,S,r,v,T)*0.05; ok('lognormal density mass=1',near(mass,1,1e-3),mass);
}
// Smile density: flat smile matches lognormal; check positivity at slider extremes
{
  const flat={s0:25,ts:0,skew:0,curv:0};
  for(const T of [0.25,1,2]){
    const d=smileDensity(T,flat,40,200); let maxErr=0;
    d.xs.forEach((x,i)=>{maxErr=Math.max(maxErr,Math.abs(d.ys[i]-lnDensity(x,100,0.03,0.25,T)));});
    ok('flat smile density ~ lognormal T='+T,maxErr<2e-4,maxErr);
  }
  const D={s0:22,ts:1,skew:2.5,curv:0.6};
  for(const T of [0.25,0.5,1,2]){ const dd=smileDensity(T,D,55,180); ok('default smile density >= 0, T='+T,Math.min(...dd.ys)>-1e-7,Math.min(...dd.ys)); const mass=dd.ys.reduce((a,b)=>a+b,0); ok('  mass in 55..180 close to 1',mass>0.8&&mass<1.02,mass.toFixed(4)); }
  const e=smileDensity(1,{s0:22,ts:10,skew:6,curv:2.5},55,180); console.log('INFO extreme smile min density (UI shows warning):',Math.min(...e.ys).toExponential(2));
}

process.exit(failed?1:0);
