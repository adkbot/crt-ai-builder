//+------------------------------------------------------------------+
//| K2 BOXES VISUAL INDICATOR                                        |
//| Desenha London Box e NY Box no gráfico                           |
//| Para debug e validação do CRT Dynamic                            |
//+------------------------------------------------------------------+
#property indicator_chart_window
#property indicator_buffers 0
#property indicator_plots   0

#property version "1.00"

// === PARÂMETROS ===
input int InpLonStart = 8;     // Londres Início (GMT)
input int InpLonEnd   = 11;    // Londres Fim (GMT)
input int InpNYStart  = 13;    // NY Início (GMT)
input int InpNYEnd    = 16;    // NY Fim (GMT)

input color InpLondonColor = clrDodgerBlue;    // Cor London Box
input color InpNYColor = clrOrangeRed;         // Cor NY Box
input color InpFVGColor = clrYellow;           // Cor FVG
input int InpBoxTransparency = 85;             // Transparência (0-100)

input bool InpShowLabels = true;               // Mostrar Labels
input bool InpShowFVG = true;                  // Mostrar FVG

// === ESTRUTURA PARA SESSÕES ===
struct SessionBox {
    datetime startTime;
    datetime endTime;
    double high;
    double low;
    bool isBullish;
    double fvgPrice;
    bool isValid;
};

SessionBox londonBox;
SessionBox nyBox;

//+------------------------------------------------------------------+
//| MQL5 HELPERS                                                      |
//+------------------------------------------------------------------+
int GetHour(datetime dt) {
    MqlDateTime mdt;
    TimeToStruct(dt, mdt);
    return mdt.hour;
}

int GetDay(datetime dt) {
    MqlDateTime mdt;
    TimeToStruct(dt, mdt);
    return mdt.day;
}

int iBarShiftCustom(string symbol, ENUM_TIMEFRAMES tf, datetime target_time) {
    datetime time_array[];
    ArraySetAsSeries(time_array, true);
    
    int copied = CopyTime(symbol, tf, 0, 1000, time_array);
    if(copied <= 0) return -1;
    
    for(int i = 0; i < copied; i++) {
        if(time_array[i] <= target_time) {
            return i;
        }
    }
    
    return -1;
}

double GetHighBar(string symbol, ENUM_TIMEFRAMES tf, int bar) {
    double highs[];
    ArraySetAsSeries(highs, true);
    
    if(CopyHigh(symbol, tf, bar, 1, highs) <= 0) return 0;
    return highs[0];
}

double GetLowBar(string symbol, ENUM_TIMEFRAMES tf, int bar) {
    double lows[];
    ArraySetAsSeries(lows, true);
    
    if(CopyLow(symbol, tf, bar, 1, lows) <= 0) return 0;
    return lows[0];
}

double GetOpen(string symbol, ENUM_TIMEFRAMES tf, int bar) {
    double opens[];
    ArraySetAsSeries(opens, true);
    
    if(CopyOpen(symbol, tf, bar, 1, opens) <= 0) return 0;
    return opens[0];
}

double GetClose(string symbol, ENUM_TIMEFRAMES tf, int bar) {
    double closes[];
    ArraySetAsSeries(closes, true);
    
    if(CopyClose(symbol, tf, bar, 1, closes) <= 0) return 0;
    return closes[0];
}

//+------------------------------------------------------------------+
//| CAPTURA SESSÃO DE LONDRES                                        |
//+------------------------------------------------------------------+
void CaptureLondonBox() {
    datetime time_array[];
    ArraySetAsSeries(time_array, true);
    
    if(CopyTime(_Symbol, PERIOD_D1, 0, 1, time_array) <= 0) return;
    
    datetime todayStart = time_array[0];
    londonBox.startTime = todayStart + (InpLonStart * 3600);
    londonBox.endTime = todayStart + (InpLonEnd * 3600);
    
    int startBar = iBarShiftCustom(_Symbol, PERIOD_M5, londonBox.startTime);
    int endBar = iBarShiftCustom(_Symbol, PERIOD_M5, londonBox.endTime);
    
    if(startBar < 0 || endBar < 0 || startBar <= endBar) return;
    
    // Calcular High/Low
    londonBox.high = 0;
    londonBox.low = 999999;
    
    for(int i = endBar; i <= startBar; i++) {
        double h = GetHighBar(_Symbol, PERIOD_M5, i);
        double l = GetLowBar(_Symbol, PERIOD_M5, i);
        
        if(h > londonBox.high) londonBox.high = h;
        if(l < londonBox.low) londonBox.low = l;
    }
    
    double openLon = GetOpen(_Symbol, PERIOD_M5, startBar);
    double closeLon = GetClose(_Symbol, PERIOD_M5, endBar);
    
    londonBox.isBullish = (closeLon > openLon);
    
    // Buscar FVG
    londonBox.fvgPrice = 0;
    for(int j = startBar - 1; j > endBar + 2; j--) {
        double low_i_2 = GetLowBar(_Symbol, PERIOD_M5, j-2);
        double high_i = GetHighBar(_Symbol, PERIOD_M5, j);
        double high_i_2 = GetHighBar(_Symbol, PERIOD_M5, j-2);
        double low_i = GetLowBar(_Symbol, PERIOD_M5, j);
        
        if(londonBox.isBullish) {
            if(low_i_2 > high_i) {
                londonBox.fvgPrice = (high_i + low_i_2) / 2.0;
                break;
            }
        } else {
            if(high_i_2 < low_i) {
                londonBox.fvgPrice = (low_i + high_i_2) / 2.0;
                break;
            }
        }
    }
    
    londonBox.isValid = true;
}

//+------------------------------------------------------------------+
//| DESENHA BOX NO GRÁFICO                                           |
//+------------------------------------------------------------------+
void DrawBox(string name, datetime start, datetime end, double high, double low, color boxColor) {
    ObjectDelete(0, name);
    
    ObjectCreate(0, name, OBJ_RECTANGLE, 0, start, high, end, low);
    ObjectSetInteger(0, name, OBJPROP_COLOR, boxColor);
    ObjectSetInteger(0, name, OBJPROP_STYLE, STYLE_SOLID);
    ObjectSetInteger(0, name, OBJPROP_WIDTH, 2);
    ObjectSetInteger(0, name, OBJPROP_FILL, true);
    ObjectSetInteger(0, name, OBJPROP_BACK, true);
    
    // Transparência
    int alpha = (int)(255 * (InpBoxTransparency / 100.0));
    color transparentColor = (color)((alpha << 24) | (boxColor & 0xFFFFFF));
    ObjectSetInteger(0, name, OBJPROP_BGCOLOR, transparentColor);
    
    ObjectSetInteger(0, name, OBJPROP_SELECTABLE, false);
    ObjectSetInteger(0, name, OBJPROP_SELECTED, false);
}

//+------------------------------------------------------------------+
//| DESENHA LINHA HORIZONTAL                                         |
//+------------------------------------------------------------------+
void DrawHLine(string name, double price, color lineColor, int style = STYLE_DASH) {
    ObjectDelete(0, name);
    
    ObjectCreate(0, name, OBJ_HLINE, 0, 0, price);
    ObjectSetInteger(0, name, OBJPROP_COLOR, lineColor);
    ObjectSetInteger(0, name, OBJPROP_STYLE, style);
    ObjectSetInteger(0, name, OBJPROP_WIDTH, 1);
    ObjectSetInteger(0, name, OBJPROP_BACK, true);
    ObjectSetInteger(0, name, OBJPROP_SELECTABLE, false);
}

//+------------------------------------------------------------------+
//| DESENHA LABEL DE TEXTO                                           |
//+------------------------------------------------------------------+
void DrawLabel(string name, datetime time, double price, string text, color textColor) {
    ObjectDelete(0, name);
    
    ObjectCreate(0, name, OBJ_TEXT, 0, time, price);
    ObjectSetString(0, name, OBJPROP_TEXT, text);
    ObjectSetInteger(0, name, OBJPROP_COLOR, textColor);
    ObjectSetInteger(0, name, OBJPROP_FONTSIZE, 10);
    ObjectSetString(0, name, OBJPROP_FONT, "Arial Bold");
    ObjectSetInteger(0, name, OBJPROP_ANCHOR, ANCHOR_LEFT);
    ObjectSetInteger(0, name, OBJPROP_BACK, false);
    ObjectSetInteger(0, name, OBJPROP_SELECTABLE, false);
}

//+------------------------------------------------------------------+
//| Custom indicator initialization function                         |
//+------------------------------------------------------------------+
int OnInit() {
    Print("=== K2 BOXES INDICATOR INITIALIZED ===");
    Print("London: ", InpLonStart, ":00-", InpLonEnd, ":00 GMT");
    Print("NY: ", InpNYStart, ":00-", InpNYEnd, ":00 GMT");
    
    return(INIT_SUCCEEDED);
}

//+------------------------------------------------------------------+
//| Custom indicator deinitialization function                       |
//+------------------------------------------------------------------+
void OnDeinit(const int reason) {
    // Limpar objetos
    ObjectsDeleteAll(0, "K2_");
}

//+------------------------------------------------------------------+
//| Custom indicator iteration function                              |
//+------------------------------------------------------------------+
int OnCalculate(const int rates_total,
                const int prev_calculated,
                const datetime &time[],
                const double &open[],
                const double &high[],
                const double &low[],
                const double &close[],
                const long &tick_volume[],
                const long &volume[],
                const int &spread[]) {
    
    datetime currentTime = TimeCurrent();
    int curHour = GetHour(currentTime);
    
    // CAPTURA LONDRES quando sessão termina
    static bool londonDrawn = false;
    static int lastDay = -1;
    int currentDay = GetDay(currentTime);
    
    if(currentDay != lastDay) {
        londonDrawn = false;
        lastDay = currentDay;
    }
    
    if(curHour >= InpLonEnd && !londonDrawn) {
        CaptureLondonBox();
        
        if(londonBox.isValid) {
            // Desenhar London Box
            DrawBox("K2_LONDON_BOX", londonBox.startTime, londonBox.endTime, 
                    londonBox.high, londonBox.low, InpLondonColor);
            
            // Desenhar High/Low
            DrawHLine("K2_LON_HIGH", londonBox.high, InpLondonColor);
            DrawHLine("K2_LON_LOW", londonBox.low, InpLondonColor);
            
            // Label com informações
            if(InpShowLabels) {
                string biasText = londonBox.isBullish ? "BULLISH" : "BEARISH";
                string labelText = "LONDON " + biasText;
                DrawLabel("K2_LON_LABEL", londonBox.startTime, londonBox.high, 
                         labelText, InpLondonColor);
                
                // Info High/Low
                string highText = "H: " + DoubleToString(londonBox.high, _Digits);
                string lowText = "L: " + DoubleToString(londonBox.low, _Digits);
                
                DrawLabel("K2_LON_HIGH_TXT", londonBox.endTime, londonBox.high, 
                         highText, InpLondonColor);
                DrawLabel("K2_LON_LOW_TXT", londonBox.endTime, londonBox.low, 
                         lowText, InpLondonColor);
            }
            
            // Desenhar FVG
            if(InpShowFVG && londonBox.fvgPrice > 0) {
                DrawHLine("K2_FVG", londonBox.fvgPrice, InpFVGColor, STYLE_DOT);
                
                if(InpShowLabels) {
                    DrawLabel("K2_FVG_LABEL", londonBox.endTime, londonBox.fvgPrice, 
                             "FVG", InpFVGColor);
                }
            }
            
            londonDrawn = true;
        }
    }
    
    // Desenhar NY Box (em tempo real durante sessão)
    if(curHour >= InpNYStart && curHour < InpNYEnd) {
        datetime time_array[];
        ArraySetAsSeries(time_array, true);
        
        if(CopyTime(_Symbol, PERIOD_D1, 0, 1, time_array) > 0) {
            datetime todayStart = time_array[0];
            datetime nyStart = todayStart + (InpNYStart * 3600);
            datetime nyEnd = todayStart + (InpNYEnd * 3600);
            
            int startBar = iBarShiftCustom(_Symbol, PERIOD_M5, nyStart);
            
            if(startBar >= 0) {
                // Calcular High/Low atual da sessão NY
                double nyHigh = 0;
                double nyLow = 999999;
                
                for(int k = 0; k <= startBar; k++) {
                    double h = GetHighBar(_Symbol, PERIOD_M5, k);
                    double l = GetLowBar(_Symbol, PERIOD_M5, k);
                    
                    if(h > nyHigh) nyHigh = h;
                    if(l < nyLow) nyLow = l;
                }
                
                // Desenhar NY Box (em tempo real)
                DrawBox("K2_NY_BOX", nyStart, TimeCurrent(), nyHigh, nyLow, InpNYColor);
                
                if(InpShowLabels) {
                    DrawLabel("K2_NY_LABEL", nyStart, nyHigh, "NY SESSION (LIVE)", InpNYColor);
                }
            }
        }
    }
    
    // Mostrar info no comentário
    string info = "=== K2 BOXES INDICATOR ===\n";
    info += "Current Time: " + TimeToString(currentTime, TIME_DATE|TIME_MINUTES) + "\n";
    info += "---\n";
    
    if(londonBox.isValid) {
        info += "LONDON BOX:\n";
        info += "  High: " + DoubleToString(londonBox.high, _Digits) + "\n";
        info += "  Low: " + DoubleToString(londonBox.low, _Digits) + "\n";
        info += "  Bias: " + (londonBox.isBullish ? "BULLISH" : "BEARISH") + "\n";
        if(londonBox.fvgPrice > 0) {
            info += "  FVG: " + DoubleToString(londonBox.fvgPrice, _Digits) + "\n";
        }
    } else {
        info += "LONDON: Aguardando captura...\n";
    }
    
    Comment(info);
    
    return(rates_total);
}
