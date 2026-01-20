// Template MQL5 com SMC/ICT completo baseado em Grace FX
// Integra Daily Bias + Premium/Discount + MSB + Q-Learning

//+------------------------------------------------------------------+
//| Expert Advisor - Smart Money Concepts + Q-Learning               |
//| Based on Grace FX methodology (D1 -> H1 -> M5)                   |
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

// === Q-LEARNING ===
input bool InpQL_Enable = true;
input double InpQL_Alpha = 0.1;
input double InpQL_Gamma = 0.95;
input double InpQL_Epsilon = 0.2;
input double InpConfidenceThreshold = 0.75;
input int InpMinLearningTrades = 50;

// === SMC PARAMETERS (Grace FX) ===
input ENUM_TIMEFRAMES InpBiasTF = PERIOD_D1;      // Timeframe para Daily Bias
input ENUM_TIMEFRAMES InpZoneTF = PERIOD_H1;      // Timeframe para Premium/Discount
input ENUM_TIMEFRAMES InpEntryTF = PERIOD_M5;     // Timeframe para MSB
input double InpFibPremium = 0.618;                // Premium acima de 61.8%
input double InpFibDiscount = 0.382;               // Discount abaixo de 38.2%
input int InpLookbackBars = 20;                    // Bars para identificar range

// === TIME FILTER (ICT Key Zones) ===
input int InpStartHour = 8;   // London Open (8:00 GMT)
input int InpEndHour = 16;    // NY Close (16:00 GMT)

// === Q-TABLE ===
double Q[128][3];
enum QAction { Q_NO_TRADE=0, Q_BUY=1, Q_SELL=2 };

// === HISTÓRICO ===
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
//| SMC FUNCTIONS - Grace FX Methodology                             |
//+------------------------------------------------------------------+

// 1. DAILY BIAS (D1): Determina direção do dia
bool GetDailyBias(string &biasDirection) {
    // Pega vela de ontem (D1)
    double closePrev = iClose(_Symbol, InpBiasTF, 1);
    double closeBeforePrev = iClose(_Symbol, InpBiasTF, 2);
    
    // Simples: se vela fechou acima da anterior = bullish
    if(closePrev > closeBeforePrev * 1.001) {
        biasDirection = "BULLISH";
        return true;
    }
    
    if(closePrev < closeBeforePrev * 0.999) {
        biasDirection = "BEARISH";
        return true;
    }
    
    biasDirection = "NEUTRAL";
    return false; // Sem bias claro
}

// 2. PREMIUM/DISCOUNT ZONES (H1): Fibonacci do range
bool IsPriceInDiscount(bool &inDiscount, bool &inPremium) {
    // Encontra high/low do range recente (H1)
    int highestBar = iHighest(_Symbol, InpZoneTF, MODE_HIGH, InpLookbackBars, 1);
    int lowestBar = iLowest(_Symbol, InpZoneTF, MODE_LOW, InpLookbackBars, 1);
    
    double rangeHigh = iHigh(_Symbol, InpZoneTF, highestBar);
    double rangeLow = iLow(_Symbol, InpZoneTF, lowestBar);
    
    double range = rangeHigh - rangeLow;
    if(range == 0) return false;
    
    double currentPrice = SymbolInfoDouble(_Symbol, SYMBOL_BID);
    
    // Calcula nível atual no range (0 = low, 1 = high)
    double fibLevel = (currentPrice - rangeLow) / range;
    
    // Premium = acima de 61.8%
    inPremium = (fibLevel > InpFibPremium);
    
    // Discount = abaixo de 38.2%
    inDiscount = (fibLevel < InpFibDiscount);
    
    return (inDiscount || inPremium);
}

// 3. MARKET STRUCTURE BREAK (M5): Quebra de estrutura
bool DetectMSB(string direction) {
    // Identifica último swing high/low em M5
    double prevHigh = iHigh(_Symbol, InpEntryTF, 1);
    double prevLow = iLow(_Symbol, InpEntryTF, 1);
    double currentClose = iClose(_Symbol, InpEntryTF, 0);
    
    if(direction == "BULLISH") {
        // MSB bullish: preço quebra acima do high anterior
        return (currentClose > prevHigh);
    }
    
    if(direction == "BEARISH") {
        // MSB bearish: preço quebra abaixo do low anterior
        return (currentClose < prevLow);
    }
    
    return false;
}

// 4. JUDAS SWING: Detecta fake move (opcional, refinamento)
bool IsJudasSwing() {
    // Verifica se houve falso rompimento seguido de reversão
    // Implementação simplificada
    double open1 = iOpen(_Symbol, InpEntryTF, 1);
    double close1 = iClose(_Symbol, InpEntryTF, 1);
    double high1 = iHigh(_Symbol, InpEntryTF, 1);
    double low1 = iLow(_Symbol, InpEntryTF, 1);
    
    double wickSize = MathMax(high1 - close1, open1 - low1);
    double bodySize = MathAbs(close1 - open1);
    
    // Se pavio > 2x corpo = possível Judas
    return (wickSize > bodySize * 2);
}

// 5. TIME FILTER: ICT Key Zones (London + NY sessions)
bool IsInTradingSession() {
    datetime t = TimeCurrent();
    int currentHour = TimeHour(t);
    
    // Dentro do horário permitido
    return (currentHour >= InpStartHour && currentHour < InpEndHour);
}

//+------------------------------------------------------------------+
//| FUNÇÃO PRINCIPAL DE SINAL - Integra TODA lógica SMC              |
//+------------------------------------------------------------------+

bool CheckSMCBuySignal() {
    // === FILTRO 1: Daily Bias ===
    string bias;
    if(!GetDailyBias(bias) || bias != "BULLISH") {
        return false; // Sem bias bullish = sem compra
    }
    
    // === FILTRO 2: Discount Zone ===
    bool inDiscount, inPremium;
    if(!IsPriceInDiscount(inDiscount, inPremium) || !inDiscount) {
        return false; // Preço não está em desconto = sem compra
    }
    
    // === FILTRO 3: Market Structure Break ===
    if(!DetectMSB("BULLISH")) {
        return false; // Sem quebra de estrutura bullish
    }
    
    // === FILTRO 4: Time Session ===
    if(!IsInTradingSession()) {
        return false; // Fora do horário
    }
    
    // === FILTRO OPCIONAL: Judas Swing ===
    // Pode adicionar lógica para evitar entrar em Judas Swings
    
    return true; // TODOS os filtros passaram!
}

bool CheckSMCSellSignal() {
    // === FILTRO 1: Daily Bias ===
    string bias;
    if(!GetDailyBias(bias) || bias != "BEARISH") {
        return false;
    }
    
    // === FILTRO 2: Premium Zone ===
    bool inDiscount, inPremium;
    if(!IsPriceInDiscount(inDiscount, inPremium) || !inPremium) {
        return false; // Preço não está em premium = sem venda
    }
    
    // === FILTRO 3: Market Structure Break ===
    if(!DetectMSB("BEARISH")) {
        return false;
    }
    
    // === FILTRO 4: Time Session ===
    if(!IsInTradingSession()) {
        return false;
    }
    
    return true; // TODOS os filtros passaram!
}

//+------------------------------------------------------------------+
//| Q-LEARNING (mantém código original com melhorias)                |
//+------------------------------------------------------------------+

int BuildState() {
    // Contexto de mercado simplificado
    double ma50 = iMA(_Symbol, PERIOD_H1, 50, 0, MODE_SMA, PRICE_CLOSE);
    double ma200 = iMA(_Symbol, PERIOD_H1, 200, 0, MODE_SMA, PRICE_CLOSE);
    double atr = iATR(_Symbol, PERIOD_H1, 14);
    double price = SymbolInfoDouble(_Symbol, SYMBOL_BID);
    
    int trendIdx = (ma50 > ma200) ? 1 : 0;
    int volIdx = (int)MathMin((atr/price)*10000 / 20.0, 3.0);
    
    int state = trendIdx * 4 + volIdx;
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
}

//+------------------------------------------------------------------+
//| Helper Functions                                                  |
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
    ArrayInitialize(Q, 0.0);
    history.totalTrades = 0;
    history.winners = 0;
    history.losers = 0;
    history.peakBalance = AccountInfoDouble(ACCOUNT_BALANCE);
    
    Print("=== SMC + Q-LEARNING SYSTEM INITIALIZED ===");
    Print("Daily Bias TF: ", EnumToString(InpBiasTF));
    Print("Zone TF: ", EnumToString(InpZoneTF));
    Print("Entry TF: ", EnumToString(InpEntryTF));
    
    return(INIT_SUCCEEDED);
}

void OnDeinit(const int reason) {
    Print("=== SYSTEM FINALIZED ===");
    Print("Total Trades: ", history.totalTrades);
    if(history.totalTrades > 0) {
        Print("Win Rate: ", (int)((double)history.winners/history.totalTrades*100), "%");
    }
}

//+------------------------------------------------------------------+
//| OnTick - LÓGICA PRINCIPAL COM SMC                                |
//+------------------------------------------------------------------+

void OnTick() {
    static bool seeded = false;
    if(!seeded) { MathSrand((uint)TimeLocal()); seeded=true; }
    
    static int prev_state = -1;
    static int prev_action = Q_NO_TRADE;
    static double prev_balance = AccountInfoDouble(ACCOUNT_BALANCE);
    
    // === AQUI ESTÁ A CORREÇÃO! ===
    // SINAIS AGORA VÊM DO SMC, NÃO SÃO FIXOS!
    bool buySignal = CheckSMCBuySignal();   // ✅ CORRIGIDO!
    bool sellSignal = CheckSMCSellSignal(); // ✅ CORRIGIDO!
    
    // Build state
    int s = BuildState();
    
    // Select action (Q-Learning)
    int a = Q_Select(s);
    
    // Calculate confidence
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
    
    // === CRITICAL: CONFIDENCE FILTER ===
    if(confidence < InpConfidenceThreshold) {
        Comment("IA: Waiting high confidence (current: ",
                DoubleToString(confidence*100,1), "%)");
        return;
    }
    
    // === LEARNING PHASE ===
    if(history.totalTrades < InpMinLearningTrades) {
        Comment("IA: Learning... (", history.totalTrades, "/", InpMinLearningTrades, " trades)");
        return;
    }
    
    // === EXECUTE TRADE ===
    // Agora com sinais SMC REAIS!
    if(a == Q_BUY && buySignal) {
        Comment("IA: BUY (Confidence: ", DoubleToString(confidence*100,1), "%) - SMC Signal!");
        TryBuy();
    }
    
    if(a == Q_SELL && sellSignal) {
        Comment("IA: SELL (Confidence: ", DoubleToString(confidence*100,1), "%) - SMC Signal!");
        TrySell();
    }
    
    // Info on chart
    string bias;
    GetDailyBias(bias);
    bool inDisc, inPrem;
    IsPriceInDiscount(inDisc, inPrem);
    
    Comment("=== SMC + Q-LEARNING SYSTEM ===\n",
            "State: ", s, " | Action: ", EnumToString((QAction)a), "\n",
            "Confidence: ", DoubleToString(confidence*100,1), "% (min: ", (int)(InpConfidenceThreshold*100), "%)\n",
            "Trades: ", history.totalTrades, " | Win Rate: ", (int)((double)history.winners/MathMax(history.totalTrades,1)*100), "%\n",
            "---\n",
            "Daily Bias: ", bias, "\n",
            "Zone: ", inDisc ? "DISCOUNT ✅" : (inPrem ? "PREMIUM ✅" : "NEUTRAL"), "\n",
            "Session: ", IsInTradingSession() ? "ACTIVE ✅" : "CLOSED ❌");
}
