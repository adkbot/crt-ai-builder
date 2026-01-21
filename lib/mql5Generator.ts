/**
 * Gerador de Código MQL5 com SMC + Q-Learning
 * Baseado em Grace FX (D1 -> H1 -> M5)
 */

import { validateBeforeBuild } from './nodeValidator';

interface StrategyNode {
    id: string;
    type: string;
    data?: any;
}

interface StrategyEdge {
    id: string;
    source: string;
    target: string;
}

interface GeneratedCode {
    mql5: string;
    description: string;
    parameters: any;
    warnings?: string[];
}

/**
 * Gera código MQL5 completo baseado nos nós da estratégia
 */
export function generateMQL5Code(
    nodes: StrategyNode[],
    edges: StrategyEdge[],
    strategyName: string
): GeneratedCode {

    // 🔒 VALIDAÇÃO OBRIGATÓRIA - Previne mistura de metodologias
    const validation = validateBeforeBuild(nodes);

    if (!validation.valid) {
        throw new Error(validation.error || 'Estratégia inválida');
    }

    // Detectar componentes SMC nos nós
    const hasDailyBias = nodes.some(n => n.type === 'DAILY_BIAS');
    const hasICTZones = nodes.some(n => n.type === 'ICT_KEY_ZONES');
    const hasJudasSwing = nodes.some(n => n.type === 'JUDAS_SWING');
    const hasFibonacci = nodes.some(n => n.type === 'FIBONACCI_ZONES');
    const hasSilverBullet = nodes.some(n => n.type === 'SMC_SILVERBULLET');
    const hasTimeFilter = nodes.some(n => n.type === 'TIME_FILTER');
    const hasQAgent = nodes.some(n => n.type === 'Q_AGENT');

    // Extrair parâmetros dos nós
    const timeFilterNode = nodes.find(n => n.type === 'TIME_FILTER');
    const startHour = timeFilterNode?.data?.startHour || 8;
    const endHour = timeFilterNode?.data?.endHour || 16;

    const fibNode = nodes.find(n => n.type === 'FIBONACCI_ZONES');
    const fibPremium = fibNode?.data?.premium || 0.618;
    const fibDiscount = fibNode?.data?.discount || 0.382;

    // Gerar código MQL5
    const code = `//+------------------------------------------------------------------+
//| ${strategyName}                                                   |
//| Gerado automaticamente por CRT AI Builder                         |
//| Baseado em: Grace FX (D1 -> H1 -> M5) + Q-Learning               |
//+------------------------------------------------------------------+
#property strict
#property version "3.00"
#include <Trade/Trade.mqh>

CTrade trade;

// === PARÂMETROS ===
input long InpMagic = 888888;
input double InpLot = 0.01;
input int InpSL_Pips = 30;
input double InpRR = 2.0;

// === Q-LEARNING ${hasQAgent ? '(ATIVO)' : '(DESATIVADO)'} ===
const bool InpQL_Enable = ${hasQAgent ? 'true' : 'false'};  // ⚠️ OBRIGATÓRIO! Sistema depende da IA
input double InpQL_Alpha = 0.1;
input double InpQL_Gamma = 0.95;
input double InpQL_Epsilon = 0.2;
input double InpConfidenceThreshold = 0.75;
input int InpMinLearningTrades = 50;

// === SMC PARAMETERS (Grace FX - OBRIGATÓRIO) ===
input ENUM_TIMEFRAMES InpBiasTF = PERIOD_D1;      // Daily Bias
input ENUM_TIMEFRAMES InpZoneTF = PERIOD_H1;      // Premium/Discount  
input ENUM_TIMEFRAMES InpEntryTF = PERIOD_M5;     // Entry (MSB)
input double InpFibPremium = ${fibPremium};       // Premium Level (>61.8%)
input double InpFibDiscount = ${fibDiscount};     // Discount Level (<38.2%)
input int InpLookbackBars = 20;                   // Lookback para Range H1

// === TIME FILTER ${hasTimeFilter ? '(ATIVO)' : '(DESATIVADO)'} ===
${hasTimeFilter ? `input int InpStartHour = ${startHour};   // Start Hour (GMT)
input int InpEndHour = ${endHour};     // End Hour (GMT)` : '// Time filter disabled'}

// === Q-TABLE ===
double Q[128][3];
enum QAction { Q_NO_TRADE=0, Q_BUY=1, Q_SELL=2 };

struct LearningHistory {
    int totalTrades;
    int winners;
    int losers;
    double avgReward;
    double maxDrawdown;
    double peakBalance;
};
LearningHistory history;

//+------------------------------------------------------------------+
//| SMC FUNCTIONS                                                     |
//+------------------------------------------------------------------+

${hasDailyBias ? `// Daily Bias Detection
bool GetDailyBias(string &biasDirection) {
    double closePrev = iClose(_Symbol, InpBiasTF, 1);
    double closeBeforePrev = iClose(_Symbol, InpBiasTF, 2);
    
    if(closePrev > closeBeforePrev * 1.001) {
        biasDirection = "BULLISH";
        return true;
    }
    
    if(closePrev < closeBeforePrev * 0.999) {
        biasDirection = "BEARISH";
        return true;
    }
    
    biasDirection = "NEUTRAL";
    return false;
}` : ''}

// Premium/Discount Zones (OBRIGATÓRIO - Grace FX)
bool IsPriceInDiscount(bool &inDiscount, bool &inPremium) {
    int highestBar = iHighest(_Symbol, InpZoneTF, MODE_HIGH, InpLookbackBars, 1);
    int lowestBar = iLowest(_Symbol, InpZoneTF, MODE_LOW, InpLookbackBars, 1);
    
    double rangeHigh = iHigh(_Symbol, InpZoneTF, highestBar);
    double rangeLow = iLow(_Symbol, InpZoneTF, lowestBar);
    double range = rangeHigh - rangeLow;
    
    if(range == 0) return false;
    
    double currentPrice = SymbolInfoDouble(_Symbol, SYMBOL_BID);
    double fibLevel = (currentPrice - rangeLow) / range;
    
    inPremium = (fibLevel > InpFibPremium);
    inDiscount = (fibLevel < InpFibDiscount);
    
    return (inDiscount || inPremium);
}

// Market Structure Break
bool DetectMSB(string direction) {
    double prevHigh = iHigh(_Symbol, InpEntryTF, 1);
    double prevLow = iLow(_Symbol, InpEntryTF, 1);
    double currentClose = iClose(_Symbol, InpEntryTF, 0);
    
    if(direction == "BULLISH") {
        return (currentClose > prevHigh);
    }
    
    if(direction == "BEARISH") {
        return (currentClose < prevLow);
    }
    
    return false;
}

${hasJudasSwing ? `// Judas Swing Detection
bool IsJudasSwing() {
    double open1 = iOpen(_Symbol, InpEntryTF, 1);
    double close1 = iClose(_Symbol, InpEntryTF, 1);
    double high1 = iHigh(_Symbol, InpEntryTF, 1);
    double low1 = iLow(_Symbol, InpEntryTF, 1);
    
    double wickSize = MathMax(high1 - close1, open1 - low1);
    double bodySize = MathAbs(close1 - open1);
    
    return (wickSize > bodySize * 2);
}` : ''}

${hasTimeFilter ? `// Time Session Filter
bool IsInTradingSession() {
    int currentHour = TimeHour(TimeCurrent());
    return (currentHour >= InpStartHour && currentHour < InpEndHour);
}` : ''}

//+------------------------------------------------------------------+
//| SIGNAL FUNCTIONS - Integra TODOS os filtros SMC                  |
//+------------------------------------------------------------------+

bool CheckSMCBuySignal() {
    ${hasDailyBias ? `// FILTRO 1: Daily Bias
    string bias;
    if(!GetDailyBias(bias) || bias != "BULLISH") {
        return false;
    }` : ''}
    
    // FILTRO 2: Discount Zone (OBRIGATÓRIO - Grace FX)
    bool inDiscount, inPremium;
    if(!IsPriceInDiscount(inDiscount, inPremium) || !inDiscount) {
        return false; // Só compra em zona de DESCONTO
    }
    
    // FILTRO 3: Market Structure Break
    if(!DetectMSB("BULLISH")) {
        return false;
    }
    
    ${hasTimeFilter ? `// FILTRO 4: Time Session
    if(!IsInTradingSession()) {
        return false;
    }` : ''}
    
    ${hasJudasSwing ? `// FILTRO 5: Evitar Judas Swing
    if(IsJudasSwing()) {
        return false; // Evita fake moves
    }` : ''}
    
    return true;
}

bool CheckSMCSellSignal() {
    ${hasDailyBias ? `// FILTRO 1: Daily Bias
    string bias;
    if(!GetDailyBias(bias) || bias != "BEARISH") {
        return false;
    }` : ''}
    
    // FILTRO 2: Premium Zone (OBRIGATÓRIO - Grace FX)
    bool inDiscount, inPremium;
    if(!IsPriceInDiscount(inDiscount, inPremium) || !inPremium) {
        return false; // Só vende em zona de PREMIUM
    }
    
    // FILTRO 3: Market Structure Break
    if(!DetectMSB("BEARISH")) {
        return false;
    }
    
    ${hasTimeFilter ? `// FILTRO 4: Time Session
    if(!IsInTradingSession()) {
        return false;
    }` : ''}
    
    ${hasJudasSwing ? `// FILTRO 5: Evitar Judas Swing
    if(IsJudasSwing()) {
        return false;
    }` : ''}
    
    return true;
}

${hasQAgent ? `//+------------------------------------------------------------------+
//| Q-LEARNING FUNCTIONS                                              |
//+------------------------------------------------------------------+

// === PERSIST~ENCIA (CRÍTICO!) ===
string Q_FILE = "q_table.dat";
string HISTORY_FILE = "learning_history.dat";

void Q_LoadTable() {
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

void Q_SaveTable() {
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
          (int)((double)history.winners/MathMax(history.totalTrades,1)*100), "% win rate");
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

// === BUILD STATE MELHORADO (com zona Premium/Discount!) ===
int BuildState() {
    // COMPONENTE 1: Trend (MA 50 vs 200)
    double ma50 = iMA(_Symbol, PERIOD_H1, 50, 0, MODE_SMA, PRICE_CLOSE);
    double ma200 = iMA(_Symbol, PERIOD_H1, 200, 0, MODE_SMA, PRICE_CLOSE);
    int trendIdx = (ma50 > ma200) ? 1 : 0;  // 0=bearish, 1=bullish
    
    // COMPONENTE 2: Volatilidade (ATR)
    double atr = iATR(_Symbol, PERIOD_H1, 14);
    double price = SymbolInfoDouble(_Symbol, SYMBOL_BID);
    int volIdx = (int)MathMin((atr/price)*10000 / 20.0, 3.0);  // 0-3
    
    // COMPONENTE 3: ZONA (Discount/Premium/Neutral) - CRÍTICO!
    bool inDisc, inPrem;
    IsPriceInDiscount(inDisc, inPrem);
    int zoneIdx = 1;  // 1=neutral (default)
    if(inDisc) zoneIdx = 0;      // 0=discount (BARATO)
    if(inPrem) zoneIdx = 2;      // 2=premium (CARO)
    
    // COMBINAR: Trend(2) x Vol(4) x Zone(3) = 24 estados possíveis
    // Deixa espaço para expansão futura
    int state = trendIdx * 12 + volIdx * 3 + zoneIdx;
    
    if(state < 0) state = 0;
    if(state >= 128) state = 127;
    
    return state;
}

double GetDecisionConfidence(int state, int action) {
    if(!InpQL_Enable) return 1.0;
    
    double qValue = Q[state][action];
    double secondBest = -999999;
    
    for(int a = 0; a < 3; a++) {
        if(a != action && Q[state][a] > secondBest) {
            secondBest = Q[state][a];
        }
    }
    
    double diff = qValue - secondBest;
    double confidence = MathMin(1.0, diff / 10.0 + 0.5);
    
    if(history.totalTrades > InpMinLearningTrades) {
        double winRate = (double)history.winners / history.totalTrades;
        confidence = (confidence + winRate) / 2.0;
    }
    
    return confidence;
}

int Q_Select(int s) {
    if(!InpQL_Enable) return Q_NO_TRADE;
    
    double adjustedEpsilon = InpQL_Epsilon;
    if(history.totalTrades > InpMinLearningTrades) {
        adjustedEpsilon = InpQL_Epsilon * (100.0 / (100.0 + history.totalTrades));
    }
    
    double r = (double)MathRand()/32767.0;
    if(r < adjustedEpsilon) {
        return (MathRand()%3);
    }
    
    int best=0;
    if(Q[s][1] > Q[s][best]) best=1;
    if(Q[s][2] > Q[s][best]) best=2;
    return best;
}

void Q_Update(int s, int a, double reward, int s_next) {
    if(!InpQL_Enable) return;
    
    double maxQ = Q[s_next][0];
    if(Q[s_next][1] > maxQ) maxQ = Q[s_next][1];
    if(Q[s_next][2] > maxQ) maxQ = Q[s_next][2];
    
    double adjustedAlpha = InpQL_Alpha;
    if(history.totalTrades > InpMinLearningTrades) {
        adjustedAlpha = InpQL_Alpha * (50.0 / (50.0 + history.totalTrades));
    }
    
    Q[s][a] = Q[s][a] + adjustedAlpha * (reward + InpQL_Gamma * maxQ - Q[s][a]);
}` : '// Q-Learning disabled'}

//+------------------------------------------------------------------+
//| HELPER FUNCTIONS                                                  |
//+------------------------------------------------------------------+

double PipsToPrice(int pips) {
    double pt = SymbolInfoDouble(_Symbol, SYMBOL_POINT);
    int digits = (int)SymbolInfoInteger(_Symbol, SYMBOL_DIGITS);
    double pip = (digits==3 || digits==5) ? (10*pt) : pt;
    return pips * pip;
}

bool HasOpenPosition() {
    for(int i=PositionsTotal()-1; i>=0; i--) {
        if(PositionSelectByIndex(i)) {
            if((long)PositionGetInteger(POSITION_MAGIC)==InpMagic && 
               PositionGetString(POSITION_SYMBOL)==_Symbol)
                return true;
        }
    }
    return false;
}

void TryBuy() {
    if(HasOpenPosition()) return;
    double bid = SymbolInfoDouble(_Symbol, SYMBOL_BID);
    double sl = bid - PipsToPrice(InpSL_Pips);
    double tp = bid + PipsToPrice((int)(InpSL_Pips * InpRR));
    trade.SetExpertMagicNumber(InpMagic);
    trade.Buy(InpLot, _Symbol, 0, sl, tp, "SMC_BUY");
}

void TrySell() {
    if(HasOpenPosition()) return;
    double ask = SymbolInfoDouble(_Symbol, SYMBOL_ASK);
    double sl = ask + PipsToPrice(InpSL_Pips);
    double tp = ask - PipsToPrice((int)(InpSL_Pips * InpRR));
    trade.SetExpertMagicNumber(InpMagic);
    trade.Sell(InpLot, _Symbol, 0, sl, tp, "SMC_SELL");
}

//+------------------------------------------------------------------+
//| OnInit & OnDeinit                                                |
//+------------------------------------------------------------------+

int OnInit() {
    ${hasQAgent ? `// CARREGAR memória da IA (CRÍTICO!)
    Q_LoadTable();
    LoadHistory();` : ''}
    
    Print("=== ${strategyName} INITIALIZED ===");
    Print("SMC Components:");
    Print("  - Daily Bias: ${hasDailyBias ? 'YES' : 'NO'}");
    Print("  - Premium/Discount: YES (OBRIGATÓRIO)");  // SEMPRE ativo!
    Print("  - Judas Swing: ${hasJudasSwing ? 'YES' : 'NO'}");
    Print("  - Time Filter: ${hasTimeFilter ? 'YES' : 'NO'}");
    Print("  - Q-Agent: ${hasQAgent ? 'YES' : 'NO'}");
    ${hasQAgent ? `Print("  - Histórico: ", history.totalTrades, " trades, ", 
          (int)((double)history.winners/MathMax(history.totalTrades,1)*100), "% WR");` : ''}
    
    return(INIT_SUCCEEDED);
}

void OnDeinit(const int reason) {
    ${hasQAgent ? `// SALVAR memória da IA (CRÍTICO!)
    Q_SaveTable();
    SaveHistory();` : ''}
    
    Print("=== SYSTEM FINALIZED ===");
    ${hasQAgent ? `Print("Total Trades: ", history.totalTrades);
    if(history.totalTrades > 0) {
        Print("Win Rate: ", (int)((double)history.winners/history.totalTrades*100), "%");
        Print("Max Drawdown: $", DoubleToString(history.maxDrawdown, 2));
    }
    Print("Memória salva em disco!");` : ''}
}

//+------------------------------------------------------------------+
//| OnTick - MAIN LOGIC                                              |
//+------------------------------------------------------------------+

void OnTick() {
    static bool seeded = false;
    if(!seeded) { MathSrand((uint)TimeLocal()); seeded=true; }
    
    ${hasQAgent ? `static int prev_state = -1;
    static int prev_action = Q_NO_TRADE;
    static double prev_balance = AccountInfoDouble(ACCOUNT_BALANCE);` : ''}
    
    // === SMC SIGNALS ===
    bool buySignal = CheckSMCBuySignal();
    bool sellSignal = CheckSMCSellSignal();
    
    ${hasQAgent ? `// === Q-LEARNING ===
    int s = BuildState();
    int a = Q_Select(s);
    double confidence = GetDecisionConfidence(s, a);
    
    // Update Q-Learning
    if(prev_state >= 0) {
        double current_balance = AccountInfoDouble(ACCOUNT_BALANCE);
        double reward = current_balance - prev_balance;
        
        Q_Update(prev_state, prev_action, reward, s);
        
        if(reward != 0) {
            history.avgReward = (history.avgReward * history.totalTrades + reward) / (history.totalTrades + 1);
            if(reward > 0) history.winners++;
            else history.losers++;
            history.totalTrades++;
        }
        
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
    
    // Confidence Filter
    if(confidence < InpConfidenceThreshold) {
        Comment("IA: Waiting high confidence (", DoubleToString(confidence*100,1), "%)");
        return;
    }
    
    // Learning Phase
    if(history.totalTrades < InpMinLearningTrades) {
        Comment("IA: Learning... (", history.totalTrades, "/", InpMinLearningTrades, ")");
        return;
    }
    
    // Execute with Q-Agent filter
    if(a == Q_BUY && buySignal) {
        Comment("BUY (Confidence: ", DoubleToString(confidence*100,1), "%)");
        TryBuy();
    }
    
    if(a == Q_SELL && sellSignal) {
        Comment("SELL (Confidence: ", DoubleToString(confidence*100,1), "%)");
        TrySell();
    }` : `// Execute directly (no Q-Agent)
    if(buySignal) {
        Comment("SMC BUY Signal");
        TryBuy();
    }
    
    if(sellSignal) {
        Comment("SMC SELL Signal");
        TrySell();
    }`}
    
    // Chart Info
    ${hasDailyBias ? `string bias;
    GetDailyBias(bias);` : ''}
    bool inDisc, inPrem;
    IsPriceInDiscount(inDisc, inPrem);  // SEMPRE mostra zona
    
    Comment("=== ${strategyName} ===\\n",
            ${hasQAgent ? `"Confidence: ", DoubleToString(confidence*100,1), "% | ",
            "Trades: ", history.totalTrades, "\\n",` : ''}
            ${hasDailyBias ? `"Bias: ", bias, " | ",` : ''}
            "Zone: ", inDisc ? "DISCOUNT ✅" : (inPrem ? "PREMIUM ✅" : "NEUTRAL"), "\\n",
            ${hasTimeFilter ? `"Session: ", IsInTradingSession() ? "ACTIVE" : "CLOSED",` : ''}
            "");
}
`;

    return {
        mql5: code,
        description: `Estratégia baseada em Smart Money Concepts (Grace FX) com Q-Learning adaptativo`,
        parameters: {
            hasDailyBias,
            hasICTZones,
            hasJudasSwing,
            hasFibonacci,
            hasTimeFilter,
            hasQAgent,
            startHour,
            endHour,
            fibPremium,
            fibDiscount
        },
        warnings: validation.warnings  // ✅ Avisos da validação
    };
}
