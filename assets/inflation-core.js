/* Inflation curve maths (bootstrapping from zero-coupon swap quotes). Shared by the article and the home page hero. */
// CORE START
const TEN=[1,2,5,10,20,30];
const SEAS=[0.35,0.50,0.60,0.45,0.25,0.05,-0.15,-0.20,-0.10,-0.25,-0.55,-0.95]; // Jan..Dec, sums to 0
const I0=320, BASE_M=6; // base CPI month July
const MONTHS=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
function interpQ(q,T){
  if(T<=TEN[0]) return q[0]/100;
  for(let k=1;k<TEN.length;k++){
    if(T<=TEN[k]){const w=(T-TEN[k-1])/(TEN[k]-TEN[k-1]);return (q[k-1]*(1-w)+q[k]*w)/100;}
  }
  return q[q.length-1]/100;
}
function build(st){
  const b=[null],I=[I0],f1=[null],n=[null],DF=[null],r=[null],yoy=[null];
  for(let T=1;T<=30;T++){
    b[T]=interpQ(st.q,T);
    I[T]=I0*Math.pow(1+b[T],T);
    f1[T]=I[T]/I[T-1]-1;
    n[T]=(st.nom+st.slope*T/30)/100;
    DF[T]=Math.pow(1+n[T],-T);
    r[T]=(1+n[T])/(1+b[T])-1;
  }
  let sD=0,sDF=0;
  for(let T=1;T<=30;T++){sD+=DF[T];sDF+=DF[T]*f1[T];yoy[T]=sDF/sD;}
  const fwd=(s,L)=>Math.pow(I[s+L]/I[s],1/L)-1;
  return {b,I,f1,n,DF,r,yoy,fwd};
}
function monthly(c,amp,N){
  const out=[];
  for(let k=1;k<=N;k++){
    const y=Math.ceil(k/12);
    const tl=Math.log(c.I[y]/c.I[y-1])/12;
    const cal=(BASE_M+k)%12;
    const s=amp*0.003*SEAS[cal];
    out.push({k,label:MONTHS[cal]+'-'+String(26+Math.floor((BASE_M+k)/12)).padStart(2,'0'),trend:Math.exp(tl)-1,seas:Math.exp(tl+s)-1,tl,s});
  }
  return out;
}
// CORE END

const PRESETS={
  'Steady':[3.0,2.7,2.45,2.4,2.5,2.5],
  'Inflation scare':[4.6,3.9,3.2,2.8,2.6,2.5],
  'Disinflation':[1.1,1.4,1.8,2.1,2.3,2.4]
};
