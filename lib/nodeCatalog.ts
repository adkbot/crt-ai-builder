
export type NodeType =
  | "TIME_FILTER"
  | "MA"
  | "CROSS_UP"
  | "CROSS_DOWN"
  | "AND"
  | "Q_AGENT"
  | "BUY_MARKET"
  | "SELL_MARKET"
  | "CRT_SETUP"
  | "SMC_SILVERBULLET";

export type CatalogItem = {
  type: NodeType;
  title: string;
  group: "Contexto" | "Indicadores" | "Lógica" | "IA" | "Execução" | "Templates";
  description: string;
  defaults?: Record<string, any>;
};

export const NODE_CATALOG: CatalogItem[] = [
  { type:"TIME_FILTER", title:"Filtro de Tempo", group:"Contexto", description:"Só permite operar dentro de um horário.", defaults:{start:"10:00",end:"11:00",tz:"NewYork"} },
  { type:"MA", title:"Média Móvel", group:"Indicadores", description:"Retorna valor da MA (SMA/EMA).", defaults:{period:20,method:"SMA",price:"CLOSE"} },
  { type:"CROSS_UP", title:"Cruzamento UP", group:"Lógica", description:"A cruza acima de B." },
  { type:"CROSS_DOWN", title:"Cruzamento DOWN", group:"Lógica", description:"A cruza abaixo de B." },
  { type:"AND", title:"AND Gate", group:"Lógica", description:"TRUE se todas entradas forem TRUE." },
  { type:"Q_AGENT", title:"Strategic Agent IA (Q‑Learning)", group:"IA", description:"Decide BUY/SELL/NO_TRADE. Nunca viola regras.", defaults:{alpha:0.1,gamma:0.95,epsilon:0.2,enable:true} },
  { type:"BUY_MARKET", title:"Compra (Market)", group:"Execução", description:"Executa buy a mercado.", defaults:{lot:0.01,slPips:30,rr:2} },
  { type:"SELL_MARKET", title:"Venda (Market)", group:"Execução", description:"Executa sell a mercado.", defaults:{lot:0.01,slPips:30,rr:2} },
  { type:"CRT_SETUP", title:"CRT Setup (stub)", group:"Templates", description:"Placeholder do CRT. Troque pela lógica real.", defaults:{tf:"M15"} },
  { type:"SMC_SILVERBULLET", title:"SMC Silver Bullet (stub)", group:"Templates", description:"Placeholder Sweep→MSS→FVG→Entry.", defaults:{rr:2,sweepMaxPips:30} }
];
