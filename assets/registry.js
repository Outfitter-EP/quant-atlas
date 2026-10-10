/* Quant Atlas registry: every category and article. Add a new article by appending to ARTICLES. */
const CATEGORIES=[
  {id:'rates',name:'Rates & Curves',blurb:'Discounting, bootstrapping, OIS, swaps and how curves are built.'},
  {id:'inflation',name:'Inflation',blurb:'CPI, inflation swaps, breakevens, seasonality and linkers.'},
  {id:'options',name:'Options & Volatility',blurb:'Black-Scholes, smiles, local and stochastic vol.'},
  {id:'stochastic',name:'Stochastic Calculus',blurb:'Brownian motion, Ito, change of measure.'},
  {id:'risk',name:'Risk & XVA',blurb:'VaR, expected shortfall, CVA, margin.'},
  {id:'numerical',name:'Numerical Methods',blurb:'Monte Carlo, PDE solvers, optimisation.'},
  {id:'statistics',name:'Statistics & ML',blurb:'Regression, time series, model validation.'}
];
const ARTICLES=[
  {id:'inflation-zero-curve',cat:'inflation',also:['rates'],title:'How an inflation zero curve is bootstrapped',
   summary:'Turn zero-coupon inflation swap quotes into a CPI curve, with sliders, a 3D forward surface and a trade inspector.',
   tags:['bootstrapping','ZCIS','CPI','seasonality','curves'],date:'8 Oct 2026'},
  {id:'options-basics',cat:'options',step:1,short:'Payoffs',title:'Options from scratch: calls, puts and payoffs',
   summary:'What you buy, what you can lose, and how combinations of options shape the payoff.',
   tags:['call','put','payoff','strategies'],date:'9 Oct 2026'},
  {id:'options-binomial',cat:'options',step:2,short:'Binomial',title:'Pricing by copying: the binomial tree',
   summary:'Replicate the payoff with stock and cash, then use many steps and see the tree approach Black-Scholes.',
   tags:['replication','arbitrage','risk-neutral','American'],date:'9 Oct 2026'},
  {id:'options-bs',cat:'options',step:3,short:'Black-Scholes',title:'Black-Scholes: the formula and what drives it',
   summary:'The closed-form price, the lognormal distribution behind it and a 3D price surface.',
   tags:['Black-Scholes','d1 d2','lognormal','put-call parity'],date:'9 Oct 2026'},
  {id:'options-greeks',cat:'options',step:4,short:'Greeks',title:'The Greeks: how an option reacts',
   summary:'Delta, gamma, vega, theta and rho in 2D and 3D, plus a P&L explain tool.',
   tags:['delta','gamma','vega','theta','hedging'],date:'9 Oct 2026'},
  {id:'options-iv',cat:'options',step:5,short:'Implied vol',title:'Implied volatility and the smile',
   summary:'Invert Black-Scholes, build a smile and surface, and read the market-implied distribution.',
   tags:['implied volatility','skew','smile','density'],date:'9 Oct 2026'},
  {id:'options-mc',cat:'options',step:6,short:'Monte Carlo',title:'Pricing by simulation: Monte Carlo',
   summary:'Simulate paths, price Asian and barrier options, and see the 1/√N error shrink.',
   tags:['Monte Carlo','Asian','barrier','variance reduction'],date:'9 Oct 2026'}
];
