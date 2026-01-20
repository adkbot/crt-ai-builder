//+------------------------------------------------------------------+
//| CRT DYNAMIC STRATEGY - Time & Price Theory                      |
//| London/NY Flow com FVG + Q-Learning (FIXED VERSION)              |
//+------------------------------------------------------------------+
#property strict
#property version "4.01"
#include <Trade/Trade.mqh>

CTrade trade;

// === PAR ÂMETROS DE SESSÃO (GMT) ===
input int InpLonStart = 8;
input int InpLonEnd   = 11;
input int InpNYStart  = 13;
input int InpNYEnd    = 16;

// === PARÂMETROS TÉCNICOS ===
input double InpLot = 0.01;
input int InpSL_ExtraPips = 5;
input double InpRR = 2.0;
input long InpMagic = 999111;

// === FIBONACCI ===
input double InpFib50 = 0.50;
input double InpFib618 = 0.618;
input double InpFib382 = 0.382;

// === Q-LEARNING ===
input bool InpQL_Enable = true;
input double InpQL_Alpha = 0.1;
input double InpQL_Gamma = 0.95;
input double InpQL_Epsilon = 0.2;
input double InpConfidenceThreshold = 0.70;
input int InpMinLearningTrades = 30;

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

struct LondonRange {
    double high;
    double low;
    double origin;
    bool isBullish;
    bool isValid;
    double fvgPrice;
    double orderBlockPrice;
    datetime captureTime;
};
LondonRange lon;

//+------------------------------------------------------------------+
//| PERSISTÊNCIA                                                      |
//+------------------------------------------------------------------+
void Q_LoadTable() {
    int h = FileOpen("crt_dynamic_q.dat", FILE_READ|FILE_BIN);
    if(h == INVALID_HANDLE) {
        ArrayInitialize(Q, 0.0);
        Print("Q-Table inicializada");
        return;
    }
    for(int i=0; i<128; i++) {
        for(int j=0; j<3; j++) {
            Q[i][j] = FileReadDouble(h);
        }
    }
    FileClose(h);
    Print("Q-Table carregada");
}

void Q_SaveTable() {
    int h = FileOpen("crt_dynamic_q.dat", FILE_WRITE|FILE_BIN);
    if(h == INVALID_HANDLE) return;
    for(int i=0; i<128; i++) {
        for(int j=0; j<3; j++) {
            FileWriteDouble(h, Q[i][j]);
        }
    }
    FileClose(h);
}

void LoadHistory() {
    int h = FileOpen("crt_dynamic_history.dat", FILE_READ|FILE_BIN);
    if(h == INVALID_HANDLE) {
        history.totalTrades = 0;
        history.winners = 0;
        history.losers = 0;
        history.avgReward = 0;
        history.maxDrawdown = 0;
        history.peakBalance = AccountInfoDouble(ACCOUNT_BALANCE);
        return;
    }
    
    history.totalTrades = FileReadInteger(h);
    history.winners = FileReadInteger(h);
    history.losers = FileReadInteger(h);
    history.avgReward = FileReadDouble(h);
    history.maxDrawdown = FileReadDouble(h);
    history.peakBalance = FileReadDouble(h);
    FileClose(h);
}

void SaveHistory() {
    int h = FileOpen("crt_dynamic_history.dat", FILE_WRITE|FILE_BIN);
    if(h == INVALID_HANDLE) return;
    
    FileWriteInteger(h, history.totalTrades);
    FileWriteInteger(h, history.winners);
    FileWriteInteger(h, history.losers);
    FileWriteDouble(h, history.avgReward);
    FileWriteDouble(h, history.maxDrawdown);
    FileWriteDouble(h, history.peakBalance);
    FileClose(h);
}

//+------------------------------------------------------------------+
//| CAPTURA LONDRES                                                   |
//+------------------------------------------------------------------+
void CaptureLondonSession() {
    datetime todayStart = iTime(_Symbol, PERIOD_D1, 0);
    datetime lonStart = todayStart + (InpLonStart * 3600);
    datetime lonEnd = todayStart + (InpLonEnd * 3600);
    
    int startBar = iBarShift(_Symbol, PERIOD_M5, lonStart);
    int endBar = iBarShift(_Symbol, PERIOD_M5, lonEnd);
    
    if(startBar < 0 || endBar < 0 || startBar <= endBar) return;
    
    lon.high = iHigh(_Symbol, PERIOD_M5, iHighest(_Symbol, PERIOD_M5, MODE_HIGH, startBar - endBar, endBar));
    lon.low = iLow(_Symbol, PERIOD_M5, iLowest(_Symbol, PERIOD_M5, MODE_LOW, startBar - endBar, endBar));
    
    double openLon = iOpen(_Symbol, PERIOD_M5, startBar);
    double closeLon = iClose(_Symbol, PERIOD_M5, endBar);
    
    lon.isBullish = (closeLon > openLon);
    lon.origin = lon.isBullish ? lon.low : lon.high;
    
    lon.fvgPrice = 0;
    lon.orderBlockPrice = 0;
    
    for(int i = startBar - 1; i > endBar + 2; i--) {
        if(lon.isBullish) {
            if(iLow(_Symbol, PERIOD_M5, i-2) > iHigh(_Symbol, PERIOD_M5, i)) {
                lon.fvgPrice = (iHigh(_Symbol, PERIOD_M5, i) + iLow(_Symbol, PERIOD_M5, i-2)) / 2.0;
                lon.orderBlockPrice = iLow(_Symbol, PERIOD_M5, i-1);
                break;
            }
        } else {
            if(iHigh(_Symbol, PERIOD_M5, i-2) < iLow(_Symbol, PERIOD_M5, i)) {
                lon.fvgPrice = (iLow(_Symbol, PERIOD_M5, i) + iHigh(_Symbol, PERIOD_M5, i-2)) / 2.0;
                lon.orderBlockPrice = iHigh(_Symbol, PERIOD_M5, i-1);
                break;
            }
        }
    }
    
    lon.isValid = (lon.fvgPrice > 0);
    datetime currentTime = TimeCurrent();
    lon.captureTime = currentTime;
    
    if(lon.isValid) {
        Print("Londres capturada: ", lon.isBullish ? "BULLISH" : "BEARISH");
    }
}

//+------------------------------------------------------------------+
//| VALIDAÇÃO                                                          |
//+------------------------------------------------------------------+
bool IsOriginIntact() {
    double price = SymbolInfoDouble(_Symbol, SYMBOL_BID);
    
    if(lon.isBullish) {
        return (price >= lon.low);
    } else {
        return (price <= lon.high);
    }
}

double GetFibLevel() {
    double price = SymbolInfoDouble(_Symbol, SYMBOL_BID);
    double range = lon.high - lon.low;
    
    if(range == 0) return 0.5;
    
    return (price - lon.low) / range;
}

//+------------------------------------------------------------------+
//| GATILHOS DINÂMICOS                                                |
//+------------------------------------------------------------------+
bool CheckDynamicBuySignal() {
    datetime currentTime = TimeCurrent();
    int curHour = TimeHour(currentTime);
    
    if(curHour < InpNYStart || curHour >= InpNYEnd) return false;
    if(!lon.isValid || !lon.isBullish) return false;
    
    if(!IsOriginIntact()) {
        lon.isValid = false;
        return false;
    }
    
    double price = SymbolInfoDouble(_Symbol, SYMBOL_BID);
    double fibLevel = GetFibLevel();
    
    if(fibLevel > InpFib50) return false;
    
    double tolerance = 10 * _Point;
    bool touchFVG = (MathAbs(price - lon.fvgPrice) <= tolerance);
    bool touchOB = (MathAbs(price - lon.orderBlockPrice) <= tolerance);
    
    return (touchFVG || touchOB);
}

bool CheckDynamicSellSignal() {
    datetime currentTime = TimeCurrent();
    int curHour = TimeHour(currentTime);
    
    if(curHour < InpNYStart || curHour >= InpNYEnd) return false;
    if(!lon.isValid || lon.isBullish) return false;
    
    if(!IsOriginIntact()) {
        lon.isValid = false;
        return false;
    }
    
    double price = SymbolInfoDouble(_Symbol, SYMBOL_ASK);
    double fibLevel = GetFibLevel();
    
    if(fibLevel < InpFib50) return false;
    
    double tolerance = 10 * _Point;
    bool touchFVG = (MathAbs(price - lon.fvgPrice) <= tolerance);
    bool touchOB = (MathAbs(price - lon.orderBlockPrice) <= tolerance);
    
    return (touchFVG || touchOB);
}

//+------------------------------------------------------------------+
//| Q-LEARNING                                                         |
//+------------------------------------------------------------------+
int BuildState() {
    int biasIdx = lon.isBullish ? 1 : 0;
    
    double fibLevel = GetFibLevel();
    int zoneIdx = 1;
    if(fibLevel < InpFib382) zoneIdx = 0;
    if(fibLevel > InpFib618) zoneIdx = 2;
    
    double lonRange = lon.high - lon.low;
    double atr = iATR(_Symbol, PERIOD_H1, 14);
    int volIdx = (lonRange > atr * 1.5) ? 1 : 0;
    
    datetime currentTime = TimeCurrent();
    int curHour = TimeHour(currentTime);
    int sessionIdx = 0;
    if(curHour >= InpLonStart && curHour < InpLonEnd) sessionIdx = 1;
    if(curHour >= InpNYStart && curHour < InpNYEnd) sessionIdx = 2;
    
    int state = biasIdx * 18 + zoneIdx * 6 + volIdx * 3 + sessionIdx;
    
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
        int randomAction = MathRand() % 3;
        return randomAction;
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
//| HELPERS                                                            |
//+------------------------------------------------------------------+
double PipsToPrice(int pips) {
    double pt = SymbolInfoDouble(_Symbol, SYMBOL_POINT);
    int digits = (int)SymbolInfoInteger(_Symbol, SYMBOL_DIGITS);
    double pip = (digits==3 || digits==5) ? (10*pt) : pt;
    return pips * pip;
}

bool HasPosition() {
    int total = PositionsTotal();
    for(int i=total-1; i>=0; i--) {
        if(PositionSelectByIndex(i)) {
            long posMagic = PositionGetInteger(POSITION_MAGIC);
            string posSymbol = PositionGetString(POSITION_SYMBOL);
            if(posMagic == InpMagic && posSymbol == _Symbol) {
                return true;
            }
        }
    }
    return false;
}

void TryBuy() {
    if(HasPosition()) return;
    
    double bid = SymbolInfoDouble(_Symbol, SYMBOL_BID);
    double sl = lon.low - PipsToPrice(InpSL_ExtraPips);
    double risk = bid - sl;
    double tp = bid + (risk * InpRR);
    
    trade.SetExpertMagicNumber(InpMagic);
    trade.Buy(InpLot, _Symbol, 0, sl, tp, "CRT_BUY");
}

void TrySell() {
    if(HasPosition()) return;
    
    double ask = SymbolInfoDouble(_Symbol, SYMBOL_ASK);
    double sl = lon.high + PipsToPrice(InpSL_ExtraPips);
    double risk = sl - ask;
    double tp = ask - (risk * InpRR);
    
    trade.SetExpertMagicNumber(InpMagic);
    trade.Sell(InpLot, _Symbol, 0, sl, tp, "CRT_SELL");
}

//+------------------------------------------------------------------+
//| OnInit                                                             |
//+------------------------------------------------------------------+
int OnInit() {
    Q_LoadTable();
    LoadHistory();
    
    lon.isValid = false;
    
    Print("=== CRT DYNAMIC INITIALIZED ===");
    
    return(INIT_SUCCEEDED);
}

//+------------------------------------------------------------------+
//| OnDeinit                                                           |
//+------------------------------------------------------------------+
void OnDeinit(const int reason) {
    Q_SaveTable();
    SaveHistory();
    
    Print("=== FINALIZED ===");
}

//+------------------------------------------------------------------+
//| OnTick                                                             |
//+------------------------------------------------------------------+
void OnTick() {
    static bool seeded = false;
    if(!seeded) { 
        MathSrand((uint)TimeLocal()); 
        seeded=true; 
    }
    
    static int prev_state = -1;
    static int prev_action = Q_NO_TRADE;
    static double prev_balance = AccountInfoDouble(ACCOUNT_BALANCE);
    
    // RESET DIÁRIO
    static int lastDay = -1;
    datetime currentTime = TimeCurrent();
    int currentDay = TimeDay(currentTime);
    
    if(currentDay != lastDay) {
        lon.isValid = false;
        lastDay = currentDay;
        Print("Novo dia");
    }
    
    // CAPTURA LONDRES
    int curHour = TimeHour(currentTime);
    static bool londonCaptured = false;
    
    if(curHour == InpLonEnd && !londonCaptured) {
        CaptureLondonSession();
        londonCaptured = true;
    }
    
    if(curHour != InpLonEnd) {
        londonCaptured = false;
    }
    
    // SINAIS
    bool buySignal = CheckDynamicBuySignal();
    bool sellSignal = CheckDynamicSellSignal();
    
    // Q-LEARNING
    int s = BuildState();
    int a = Q_Select(s);
    double confidence = GetDecisionConfidence(s, a);
    
    // UPDATE
    if(prev_state >= 0) {
        double current_balance = AccountInfoDouble(ACCOUNT_BALANCE);
        double reward = current_balance - prev_balance;
        
        Q_Update(prev_state, prev_action, reward, s);
        
        if(reward != 0) {
            history.avgReward = (history.avgReward * history.totalTrades + reward) / (history.totalTrades + 1);
            if(reward > 0) {
                history.winners++;
            } else {
                history.losers++;
            }
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
    
    // FILTROS
    if(confidence < InpConfidenceThreshold) {
        Comment("Aguardando confianca");
        return;
    }
    
    if(history.totalTrades < InpMinLearningTrades) {
        Comment("Aprendendo...");
        return;
    }
    
    // EXECUTAR
    if(a == Q_BUY && buySignal) {
        Comment("BUY");
        TryBuy();
    }
    
    if(a == Q_SELL && sellSignal) {
        Comment("SELL");
        TrySell();
    }
    
    // INFO
    double fibLevel = GetFibLevel();
    string session = "";
    if(curHour >= InpLonStart && curHour < InpLonEnd) {
        session = "LONDON";
    } else if(curHour >= InpNYStart && curHour < InpNYEnd) {
        session = "NY";
    } else {
        session = "WAITING";
    }
    
    Comment("=== CRT DYNAMIC ===\n",
            "Session: ", session, "\n",
            "Bias: ", lon.isValid ? (lon.isBullish ? "BULL" : "BEAR") : "NO", "\n",
            "Fib: ", DoubleToString(fibLevel * 100, 1), "%");
}
