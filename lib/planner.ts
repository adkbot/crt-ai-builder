
import { v4 as uuid } from "uuid";
import { Graph } from "./graph";

export function planFromPrompt(prompt: string): { spec: any; graph: Graph } {
  const p = (prompt||"").toLowerCase();
  const rr = extractRR(p) ?? 2;
  const useQL = p.includes("q") && (p.includes("learning") || p.includes("q-learning") || p.includes("ia"));
  const isSilver = p.includes("silver") || p.includes("bala de prata") || p.includes("ict");
  const isCrt = p.includes("crt");
  const template = isSilver ? "SILVER_BULLET" : (isCrt ? "CRT" : "SMC");
  const session = extractSession(p) ?? { start:"10:00", end:"11:00", tz:"NewYork" };

  const id = () => uuid().slice(0,8);
  const nodes:any[]=[];
  const edges:any[]=[];

  const nTime={id:id(),type:"TIME_FILTER",data:session,position:{x:80,y:120}};
  nodes.push(nTime);

  const nSetup=isSilver
    ? {id:id(),type:"SMC_SILVERBULLET",data:{rr,sweepMaxPips:30},position:{x:360,y:120}}
    : {id:id(),type:"CRT_SETUP",data:{tf:"M15"},position:{x:360,y:120}};
  nodes.push(nSetup);
  edges.push({id:id(),source:nTime.id,target:nSetup.id});

  const nQ={id:id(),type:"Q_AGENT",data:{alpha:0.1,gamma:0.95,epsilon:0.2,enable:useQL},position:{x:640,y:120}};
  nodes.push(nQ);
  edges.push({id:id(),source:nSetup.id,target:nQ.id});

  const nBuy={id:id(),type:"BUY_MARKET",data:{lot:0.01,slPips:30,rr},position:{x:920,y:60}};
  const nSell={id:id(),type:"SELL_MARKET",data:{lot:0.01,slPips:30,rr},position:{x:920,y:180}};
  nodes.push(nBuy,nSell);
  edges.push({id:id(),source:nQ.id,target:nBuy.id});
  edges.push({id:id(),source:nQ.id,target:nSell.id});

  return { spec:{name:"Strategy (from prompt)",rr,session,useQLearning:useQL,template}, graph:{nodes,edges} };
}

function extractRR(s:string){ const m=/rr\s*([0-9]+(?:\.[0-9]+)?)/.exec(s); return m?Number(m[1]):null; }
function extractSession(s:string){
  const m=/(\d{1,2})\s*[:h]\s*(\d{2})\s*[-a]\s*(\d{1,2})\s*[:h]\s*(\d{2})/.exec(s);
  if(!m) return null;
  return { start:`${m[1].padStart(2,"0")}:${m[2]}`, end:`${m[3].padStart(2,"0")}:${m[4]}`, tz:"NewYork" };
}
