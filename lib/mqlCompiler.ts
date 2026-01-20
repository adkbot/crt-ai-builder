import { Graph } from "./graph";

function toMin(hhmm: string) { const m = /^\s*(\d{1,2})\s*:\s*(\d{2})\s*$/.exec(hhmm); return m ? (Number(m[1]) * 60 + Number(m[2])) : 0; }

export function compileToMql5(graph: Graph): string {
  const nodes = graph.nodes ?? [];
  const edges = graph.edges ?? [];
  const byId = new Map(nodes.map(n => [n.id, n]));

  const parents = (id: string) => edges.filter(e => e.target === id).map(e => e.source);

  const decl: string[] = [];
  const calc: string[] = [];
  const indicators: string[] = [];
  let timeGate = "true";
  let buySignal = "false";
  let sellSignal = "false";
  let q = { alpha: 0.1, gamma: 0.95, epsilon: 0.2 };

  // Track MA nodes for cross detection
  const maNodes = new Map<string, { period: number, method: string }>();
  const crossUpNodes = new Map<string, { parents: string[] }>();
  const crossDownNodes = new Map<string, { parents: string[] }>();
  const andNodes = new Map<string, { parents: string[] }>();

  for (const n of nodes) {
    const d: any = n.data ?? {};

    if (n.type === "TIME_FILTER") {
      decl.push(`bool time_ok=false;`);
      const s = toMin(String(d.start ?? "10:00"));
      const e = toMin(String(d.end ?? "11:00"));
      calc.push(`{ datetime t=TimeCurrent(); int cur=TimeHour(t)*60+TimeMinute(t); time_ok=(cur>=${s} && cur<=${e}); }`);
      timeGate = "time_ok";
    }

    if (n.type === "MA") {
      const period = Number(d.period ?? 20);
      const method = String(d.method ?? "SMA").toUpperCase();
      const maMethod = method === "EMA" ? "MODE_EMA" : "MODE_SMA";
      const varName = `ma_${n.id.replace(/[^a-z0-9]/gi, "")}`;
      maNodes.set(n.id, { period, method });
      decl.push(`double ${varName}=0;`);
      calc.push(`${varName}=iMA(_Symbol,PERIOD_CURRENT,${period},0,${maMethod},PRICE_CLOSE);`);
    }

    if (n.type === "CROSS_UP") {
      const pars = parents(n.id);
      if (pars.length >= 2) {
        const varName = `cross_up_${n.id.replace(/[^a-z0-9]/gi, "")}`;
        const a = `ma_${pars[0].replace(/[^a-z0-9]/gi, "")}`;
        const b = `ma_${pars[1].replace(/[^a-z0-9]/gi, "")}`;
        decl.push(`bool ${varName}=false;`);
        decl.push(`double ${varName}_prev_a=0, ${varName}_prev_b=0;`);
        calc.push(`{
  double cur_a=${a}; double cur_b=${b};
  ${varName}=(${varName}_prev_a<${varName}_prev_b && cur_a>cur_b);
  ${varName}_prev_a=cur_a; ${varName}_prev_b=cur_b;
}`);
        crossUpNodes.set(n.id, { parents: pars });
      }
    }

    if (n.type === "CROSS_DOWN") {
      const pars = parents(n.id);
      if (pars.length >= 2) {
        const varName = `cross_down_${n.id.replace(/[^a-z0-9]/gi, "")}`;
        const a = `ma_${pars[0].replace(/[^a-z0-9]/gi, "")}`;
        const b = `ma_${pars[1].replace(/[^a-z0-9]/gi, "")}`;
        decl.push(`bool ${varName}=false;`);
        decl.push(`double ${varName}_prev_a=0, ${varName}_prev_b=0;`);
        calc.push(`{
  double cur_a=${a}; double cur_b=${b};
  ${varName}=(${varName}_prev_a>${varName}_prev_b && cur_a<cur_b);
  ${varName}_prev_a=cur_a; ${varName}_prev_b=cur_b;
}`);
        crossDownNodes.set(n.id, { parents: pars });
      }
    }

    if (n.type === "AND") {
      const pars = parents(n.id);
      if (pars.length > 0) {
        const varName = `and_${n.id.replace(/[^a-z0-9]/gi, "")}`;
        const conditions = pars.map(p => {
          const pid = p.replace(/[^a-z0-9]/gi, "");
          if (crossUpNodes.has(p)) return `cross_up_${pid}`;
          if (crossDownNodes.has(p)) return `cross_down_${pid}`;
          return `true`;
        }).join(" && ");
        decl.push(`bool ${varName}=false;`);
        calc.push(`${varName}=(${conditions});`);
        andNodes.set(n.id, { parents: pars });
      }
    }

    if (n.type === "CRT_SETUP") {
      decl.push(`bool crt_buy=false; bool crt_sell=false;`);
      calc.push(`{
  double o1=iOpen(_Symbol,PERIOD_M15,1);
  double c1=iClose(_Symbol,PERIOD_M15,1);
  double o2=iOpen(_Symbol,PERIOD_M15,2);
  double c2=iClose(_Symbol,PERIOD_M15,2);
  crt_buy=(c2<o2 && c1>o1);
  crt_sell=(c2>o2 && c1<o1);
}`);
      buySignal = `${timeGate} && crt_buy`;
      sellSignal = `${timeGate} && crt_sell`;
    }

    if (n.type === "SMC_SILVERBULLET") {
      const rr = Number(d.rr ?? 2);
      const sweepMax = Number(d.sweepMaxPips ?? 30);
      decl.push(`bool sb_buy=false; bool sb_sell=false;`);
      calc.push(`{
  double h1=iHigh(_Symbol,PERIOD_M15,1);
  double l1=iLow(_Symbol,PERIOD_M15,1);
  double c1=iClose(_Symbol,PERIOD_M15,1);
  double h2=iHigh(_Symbol,PERIOD_M15,2);
  double l2=iLow(_Symbol,PERIOD_M15,2);
  double l3=iLow(_Symbol,PERIOD_M15,3);
  double h3=iHigh(_Symbol,PERIOD_M15,3);
  bool sweep_buy=(l1<l2 && c1>l2);
  bool fvg_buy=(l1>h3);
  sb_buy=(sweep_buy && fvg_buy);
  
  bool sweep_sell=(h1>h2 && c1<h2);
  bool fvg_sell=(h1<l3);
  sb_sell=(sweep_sell && fvg_sell);
}`);
      buySignal = `${timeGate} && sb_buy`;
      sellSignal = `${timeGate} && sb_sell`;
    }

    if (n.type === "Q_AGENT") {
      q = { alpha: Number(d.alpha ?? 0.1), gamma: Number(d.gamma ?? 0.95), epsilon: Number(d.epsilon ?? 0.2) };
    }
  }

  return `//+------------------------------------------------------------------+
//| CRT AI Builder - Adaptive Learning Expert Advisor                |
//| Sistema Inteligente com Contexto e Alta Confiança                |
//+------------------------------------------------------------------+
#property strict
#property version "2.00"
#include <Trade/Trade.mqh>
CTrade trade;

// === Parâmetros de Entrada ===
input long   InpMagic   = 888888;
input double InpLot     = 0.01;
input int    InpSL_Pips = 30;
input double InpRR      = 2.0;

// === Q-Learning Adaptativo ===
input bool   InpQL_Enable  = true;
input double InpQL_Alpha   = ${q.alpha};
input double InpQL_Gamma   = ${q.gamma};
input double InpQL_Epsilon = ${q.epsilon};

// === NOVO: Sistema de Confiança ===
input double InpConfidenceThreshold = 0.75;  // Só opera com 75%+ de certeza
input int    InpMinLearningTrades  = 50;    // Mínimo de trades para começar a confiar
input bool   InpAdaptiveMode = true;        // Modo adaptativo (aprende continuamente)

// === Estruturas de Dados ===
enum QAction { Q_NO_TRADE=0, Q_BUY=1, Q_SELL=2 };

// Q-Table expandida (128 estados x 3 ações)
double Q[128][3];
string Q_FILE = "q_table.dat";

// NOVO: Histórico de Aprendizado
struct LearningHistory {
  int totalTrades;
  int winners;
  int losers;
  double avgReward;
  double maxDrawdown;
  double peakBalance;
};
LearningHistory history;
string HISTORY_FILE = "learning_history.dat";

// NOVO: Features de Contexto de Mercado
struct MarketContext {
  double trend;           // -1 = bearish, 0 = neutral, 1 = bullish
  double volatility;      // ATR normalizado
  double momentum;        // ROC (Rate of Change)
  double volume;          // Volume relativo
  int timeOfDay;          // 0-23 (hora atual)
  int dayOfWeek;          // 0-5 (seg-sex)
};

// === Funções de Contexto de Mercado ===

double GetTrend() {
  // Usa MA 50 vs MA 200 para trend
  double ma50 = iMA(_Symbol, PERIOD_H1, 50, 0, MODE_SMA, PRICE_CLOSE);
  double ma200 = iMA(_Symbol, PERIOD_H1, 200, 0, MODE_SMA, PRICE_CLOSE);
  
  if(ma50 > ma200 * 1.01) return 1.0;  // Bullish
  if(ma50 < ma200 * 0.99) return -1.0; // Bearish
  return 0.0; // Neutral
}

double GetVolatility() {
  // ATR normalizado pelo preço
  double atr = iATR(_Symbol, PERIOD_H1, 14);
  double price = SymbolInfoDouble(_Symbol, SYMBOL_BID);
  return (atr / price) * 10000; // Em pips
}

double GetMomentum() {
  // ROC de 10 períodos
  double closeNow = iClose(_Symbol, PERIOD_H1, 0);
  double close10 = iClose(_Symbol, PERIOD_H1, 10);
  if(close10 == 0) return 0;
  return ((closeNow - close10) / close10) * 100;
}

double GetVolumeRatio() {
  double vol = (double)iVolume(_Symbol, PERIOD_H1, 0);
  double avgVol = 0;
  for(int i = 1; i <= 20; i++) {
    avgVol += (double)iVolume(_Symbol, PERIOD_H1, i);
  }
  avgVol /= 20.0;
  if(avgVol == 0) return 1.0;
  return vol / avgVol;
}

MarketContext GetMarketContext() {
  MarketContext ctx;
  ctx.trend = GetTrend();
  ctx.volatility = GetVolatility();
  ctx.momentum = GetMomentum();
  ctx.volume = GetVolumeRatio();
  
  datetime t = TimeCurrent();
  ctx.timeOfDay = TimeHour(t);
  
  MqlDateTime dt;
  TimeToStruct(t, dt);
  ctx.dayOfWeek = dt.day_of_week; // 0=Sunday, 1=Monday, ...
  
  return ctx;
}

// === Q-Learning com Contexto ===

int BuildState() {
  // NOVO: State Building com contexto completo
  MarketContext ctx = GetMarketContext();
  
  // Discretização multi-dimensional
  int trendIdx = (int)((ctx.trend + 1.0) * 2); // 0,1,2,3,4
  if(trendIdx > 4) trendIdx = 4;
  
  int volIdx = (int)MathMin(ctx.volatility / 20.0, 3.0); // 0,1,2,3
  
  int momIdx = (int)((ctx.momentum + 100) / 50); // -100 a +100 → 0,1,2,3,4
  if(momIdx < 0) momIdx = 0;
  if(momIdx > 4) momIdx = 4;
  
  // Combinar features em um estado único
  int state = trendIdx * 25 + volIdx * 5 + momIdx;
  
  if(state < 0) state = 0;
  if(state >= 128) state = 127;
  
  return state;
}

// NOVO: Calcula confiança da decisão
double GetDecisionConfidence(int state, int action) {
  if(!InpQL_Enable) return 1.0;
  
  // Confidence baseada em:
  // 1. Diferença entre Q-values
  // 2. Número de vezes que visitamos este estado
  // 3. Histórico geral de performance
  
  double qValue = Q[state][action];
  
  // Pega o segundo melhor Q-value
  double secondBest = -999999;
  for(int a = 0; a < 3; a++) {
    if(a != action && Q[state][a] > secondBest) {
      secondBest = Q[state][a];
    }
  }
  
  // Confidence = quão melhor é a ação escolhida vs segunda melhor
  double diff = qValue - secondBest;
  double confidence = MathMin(1.0, diff / 10.0 + 0.5); // Normaliza
  
  // Ajusta por histórico
  if(history.totalTrades > InpMinLearningTrades) {
    double winRate = (double)history.winners / history.totalTrades;
    confidence = (confidence + winRate) / 2.0; // Média ponderada
  }
  
  return confidence;
}

int Q_Select(int s){
  if(!InpQL_Enable) return Q_NO_TRADE;
  
  // NOVO: Exploration decrescente (menos aleatório com o tempo)
  double adjustedEpsilon = InpQL_Epsilon;
  if(InpAdaptiveMode && history.totalTrades > InpMinLearningTrades) {
    adjustedEpsilon = InpQL_Epsilon * (100.0 / (100.0 + history.totalTrades));
  }
  
  double r=(double)MathRand()/32767.0;
  if(r < adjustedEpsilon) {
    return (MathRand()%3); // Explore
  }
  
  // Exploit: pega melhor ação
  int best=0;
  if(Q[s][1]>Q[s][best]) best=1;
  if(Q[s][2]>Q[s][best]) best=2;
  return best;
}

void Q_Update(int s, int a, double reward, int s_next){
  if(!InpQL_Enable) return;
  
  double maxQ = Q[s_next][0];
  if(Q[s_next][1] > maxQ) maxQ = Q[s_next][1];
  if(Q[s_next][2] > maxQ) maxQ = Q[s_next][2];
  
  // NOVO: Learning rate adaptativo
  double adjustedAlpha = InpQL_Alpha;
  if(InpAdaptiveMode && history.totalTrades > InpMinLearningTrades) {
    adjustedAlpha = InpQL_Alpha * (50.0 / (50.0 + history.totalTrades));
  }
  
  Q[s][a] = Q[s][a] + adjustedAlpha * (reward + InpQL_Gamma * maxQ - Q[s][a]);
}

// === Persistência ===

void Q_LoadTable(){
  int h = FileOpen(Q_FILE, FILE_READ|FILE_BIN);
  if(h == INVALID_HANDLE) {
    ArrayInitialize(Q, 0.0);
    Print("Q-Table inicializada (nova)");
    return;
  }
  for(int i=0; i<128; i++)
    for(int j=0; j<3; j++)
      Q[i][j] = FileReadDouble(h);
  FileClose(h);
  Print("Q-Table carregada do arquivo");
}

void Q_SaveTable(){
  int h = FileOpen(Q_FILE, FILE_WRITE|FILE_BIN);
  if(h == INVALID_HANDLE) return;
  for(int i=0; i<128; i++)
    for(int j=0; j<3; j++)
      FileWriteDouble(h, Q[i][j]);
  FileClose(h);
  Print("Q-Table salva");
}

void LoadHistory() {
  int h = FileOpen(HISTORY_FILE, FILE_READ|FILE_BIN);
  if(h == INVALID_HANDLE) {
    history.totalTrades = 0;
    history.winners = 0;
    history.losers = 0;
    history.avgReward = 0;
    history.maxDrawdown = 0;
    history.peakBalance = AccountInfoDouble(ACCOUNT_BALANCE);
    Print("Histórico inicializado (novo)");
    return;
  }
  
  history.totalTrades = FileReadInteger(h);
  history.winners = FileReadInteger(h);
  history.losers = FileReadInteger(h);
  history.avgReward = FileReadDouble(h);
  history.maxDrawdown = FileReadDouble(h);
  history.peakBalance = FileReadDouble(h);
  FileClose(h);
  
  Print("Histórico carregado: ", history.totalTrades, " trades, ", 
        (int)((double)history.winners/history.totalTrades*100), "% win rate");
}

void SaveHistory() {
  int h = FileOpen(HISTORY_FILE, FILE_WRITE|FILE_BIN);
  if(h == INVALID_HANDLE) return;
  
  FileWriteInteger(h, history.totalTrades);
  FileWriteInteger(h, history.winners);
  FileWriteInteger(h, history.losers);
  FileWriteDouble(h, history.avgReward);
  FileWriteDouble(h, history.maxDrawdown);
  FileWriteDouble(h, history.peakBalance);
  FileClose(h);
  
  Print("Histórico salvo");
}

// === Funções Helper ===

double PipsToPrice(int pips){
  double pt=SymbolInfoDouble(_Symbol,SYMBOL_POINT);
  int digits=(int)SymbolInfoInteger(_Symbol,SYMBOL_DIGITS);
  double pip=(digits==3||digits==5)?(10*pt):pt;
  return pips*pip;
}

bool HasOpenPosition(){
  for(int i=PositionsTotal()-1;i>=0;i--){
    if(PositionSelectByIndex(i)){
      if((long)PositionGetInteger(POSITION_MAGIC)==InpMagic && PositionGetString(POSITION_SYMBOL)==_Symbol)
        return true;
    }
  }
  return false;
}

void TryBuy(){
  if(HasOpenPosition()) return;
  double bid=SymbolInfoDouble(_Symbol,SYMBOL_BID);
  double sl=bid-PipsToPrice(InpSL_Pips);
  double tp=bid+PipsToPrice((int)(InpSL_Pips*InpRR));
  trade.SetExpertMagicNumber(InpMagic);
  trade.Buy(InpLot,_Symbol,0,sl,tp,"AI_BUY");
}

void TrySell(){
  if(HasOpenPosition()) return;
  double ask=SymbolInfoDouble(_Symbol,SYMBOL_ASK);
  double sl=ask+PipsToPrice(InpSL_Pips);
  double tp=ask-PipsToPrice((int)(InpSL_Pips*InpRR));
  trade.SetExpertMagicNumber(InpMagic);
  trade.Sell(InpLot,_Symbol,0,sl,tp,"AI_SELL");
}

// === EA Events ===

int OnInit(){
  Q_LoadTable();
  LoadHistory();
  
  Print("=== SISTEMA INTELIGENTE INICIALIZADO ===");
  Print("Confiança mínima: ", (int)(InpConfidenceThreshold*100), "%");
  Print("Modo adaptativo: ", InpAdaptiveMode ? "ON" : "OFF");
  Print("Trades históricos: ", history.totalTrades);
  
  return(INIT_SUCCEEDED);
}

void OnDeinit(const int reason){
  Q_SaveTable();
  SaveHistory();
  
  double currentBalance = AccountInfoDouble(ACCOUNT_BALANCE);
  double profit = currentBalance - history.peakBalance;
  
  Print("=== SISTEMA FINALIZADO ===");
  Print("Total trades: ", history.totalTrades);
  Print("Win rate: ", (int)((double)history.winners/MathMax(history.totalTrades,1)*100), "%");
  Print("Profit: ", DoubleToString(profit, 2));
}

void OnTick(){
  static bool seeded=false;
  if(!seeded){ MathSrand((uint)TimeLocal()); seeded=true; }
  
  static int prev_state = -1;
  static int prev_action = Q_NO_TRADE;
  static double prev_balance = AccountInfoDouble(ACCOUNT_BALANCE);

  // Lógica gerada do grafo
  ${decl.join("\\n  ")}
  ${calc.join("\\n  ")}

  bool buySignal = (${buySignal});
  bool sellSignal = (${sellSignal});

  // Build state com contexto de mercado
  int s = BuildState();
  
  // Seleciona ação (adaptativa)
  int a = Q_Select(s);
  
  // NOVO: Calcula confiança da decisão
  double confidence = GetDecisionConfidence(s, a);
  
  // Q-Learning update (aprende continuamente)
  if(prev_state >= 0) {
    double current_balance = AccountInfoDouble(ACCOUNT_BALANCE);
    double reward = current_balance - prev_balance;
    
    // Atualiza Q-table
    Q_Update(prev_state, prev_action, reward, s);
    
    // Atualiza histórico
    if(reward != 0) {
      history.avgReward = (history.avgReward * history.totalTrades + reward) / (history.totalTrades + 1);
      
      if(reward > 0) history.winners++;
      else history.losers++;
      
      history.totalTrades++;
    }
    
    // Tracking de drawdown
    if(current_balance > history.peakBalance) {
      history.peakBalance = current_balance;
    } else {
      double dd = history.peakBalance - current_balance;
      if(dd > history.maxDrawdown) {
        history.maxDrawdown = dd;
      }
    }
    
    prev_balance = current_balance;
  }
  
  prev_state = s;
  prev_action = a;

  // CRÍTICO: SÓ OPERA COM ALTA CONFIANÇA
  if(confidence < InpConfidenceThreshold) {
    Comment("IA: Aguardando setup de alta confiança (atual: ", 
            DoubleToString(confidence*100,1), "%)");
    return; // NÃO OPERA se confiança < threshold
  }
  
  // Validação adicional: mínimo de aprendizado
  if(InpAdaptiveMode && history.totalTrades < InpMinLearningTrades) {
    Comment("IA: Aprendendo... (", history.totalTrades, "/", InpMinLearningTrades, " trades)");
    return; // Modo learning inicial
  }

  // Executa trade APENAS se:
  // 1. Sinal está presente
  // 2. Confiança >= threshold
  // 3. Já aprendeu o suficiente
  if(a==Q_BUY && buySignal) {
    Comment("IA: COMPRA (Confiança: ", DoubleToString(confidence*100,1), "%)");
    TryBuy();
  }
  
  if(a==Q_SELL && sellSignal) {
    Comment("IA: VENDA (Confiança: ", DoubleToString(confidence*100,1), "%)");
    TrySell();
  }
  
  // Info no chart
  MarketContext ctx = GetMarketContext();
  Comment("=== SISTEMA INTELIGENTE ===\\n",
          "Estado: ", s, " | Ação: ", EnumToString((QAction)a), "\\n",
          "Confiança: ", DoubleToString(confidence*100,1), "% (min: ", (int)(InpConfidenceThreshold*100), "%)\\n",
          "Trades: ", history.totalTrades, " | Win Rate: ", (int)((double)history.winners/MathMax(history.totalTrades,1)*100), "%\\n",
          "Contexto: Trend=", DoubleToString(ctx.trend,2), " Vol=", DoubleToString(ctx.volatility,1), " Mom=", DoubleToString(ctx.momentum,1));
}
`;
}
