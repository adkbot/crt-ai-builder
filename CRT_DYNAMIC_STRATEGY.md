# 🎯 CRT DYNAMIC STRATEGY - London/NY Flow

## ✅ IMPLEMENTADO: Metodologia Completa

---

## 📋 DIFERENÇA FUNDAMENTAL:

### **Metodologia ANTERIOR (Static SMC):**
```
D1 (Daily Bias) → H1 (Premium/Discount) → M5 (MSB) → ENTRY
```
**Problema:** Zones estáticas, wait passivo

### **Metodologia NOVA (CRT Dynamic):**
```
LONDON 3h (Bias) → NY 3h (Retração) → FVG Touch → ENTRY
```
**Vantagem:** Dinâmico, baseado em sessões reais, imã de preço (FVG)

---

## 🕒 PROTOCOLO OPERACIONAL:

### **FASE 1: LONDRES (08:00-11:00 GMT)**

**Objetivo:** Capturar o BIAS do dia

1. ✅ Observar primeiras 3 horas de Londres
2. ✅ Identificar impulso predominante
3. ✅ Calcular High/Low da sessão
4. ✅ Determinar se é BULLISH ou BEARISH
5. ✅ Marcar "Origem" (low se bullish, high se bearish)
6. ✅ Identificar FVG (Fair Value Gap) no movimento

**Código:**
```cpp
void CaptureLondonSession() {
    // Mede High/Low das 3 primeiras horas
    lon.high = iHigh(...);
    lon.low = iLow(...);
    
    // Determina Bias
    lon.isBullish = (closeLon > openLon);
    lon.origin = lon.isBullish ? lon.low : lon.high;
    
    // Busca FVG (buraco de preço)
    for(int i = startBar; i > endBar + 2; i--) {
        if(isBullish) {
            // Gap Bullish: Low[i-2] > High[i]
            if(iLow[i-2] > iHigh[i]) {
                lon.fvgPrice = (iHigh[i] + iLow[i-2]) / 2.0;
                break;
            }
        }
    }
}
```

---

### **FASE 2: VALIDAÇÃO (PRÉ-NY)**

**Filtros Obrigatórios:**

1. ✅ **Origem Intacta** (REGRA INVIOLÁVEL)
   - COMPRA: Preço NÃO pode romper Low de Londres
   - VENDA: Preço NÃO pode romper High de Londres
   - Se romper = Setup ABORTADO

```cpp
bool IsOriginIntact() {
    double price = SymbolInfoDouble(_Symbol, SYMBOL_BID);
    
    if(lon.isBullish) {
        return (price >= lon.low);  // Low intacto
    } else {
        return (price <= lon.high); // High intacto
    }
}
```

2. ✅ **FVG Identificado**
   - Deve haver um Fair Value Gap claro
   - Serve como "imã" para retração

---

### **FASE 3: NOVA IORQUE (13:00-16:00 GMT)**

**Objetivo:** Executar na retração para FVG

**Filtros de Entrada:**

1. ✅ **Horário** → Dentro da NY Box (13:00-16:00)
2. ✅ **Bias** → Londres BULLISH (compra) ou BEARISH (venda)
3. ✅ **Origem** → Intacta (não rompida)
4. ✅ **Zona** → Preço em Discount (<50%) para compra, Premium (>50%) para venda
5. ✅ **Gatilho** → Toque no FVG ou Order Block de Londres

```cpp
bool CheckDynamicBuySignal() {
    // FILTRO 1: Horário de NY
    if(curHour < 13 || curHour >= 16) return false;
    
    // FILTRO 2: Londres BULLISH
    if(!lon.isBullish) return false;
    
    // FILTRO 3: Origem intacta
    if(!IsOriginIntact()) return false;
    
    // FILTRO 4: Zona de Discount (<50%)
    if(GetFibLevel() > 0.50) return false;
    
    // FILTRO 5: Toque no FVG
    if(MathAbs(price - lon.fvgPrice) <= tolerance) {
        return true; // ENTRADA!
    }
    
    return false;
}
```

---

### **FASE 4: GESTÃO**

**Stop Loss:**
- ✅ Posicionado na **ORIGEM** de Londres
- ✅ Compra: SL = Low de Londres - extra pips
- ✅ Venda: SL = High de Londres + extra pips

**Take Profit:**
- ✅ Alvo 1: Extremo oposto do range de Londres (100%)
- ✅ RR: 2:1 (mínimo)

```cpp
void TryBuy() {
    double bid = SymbolInfoDouble(_Symbol, SYMBOL_BID);
    double sl = lon.low - PipsToPrice(5);  // SL na origem
    double risk = bid - sl;
    double tp = bid + (risk * 2.0);        // RR 2:1
    
    trade.Buy(InpLot, _Symbol, 0, sl, tp, "CRT_DYN_BUY");
}
```

---

## 🚫 REGRAS DE CANCELAMENTO:

**NÃO OPERE SE:**

1. ❌ Preço rompeu a origem de Londres (low p/ compra, high p/ venda)
2. ❌ Retração de NY ocorre FORA do horário (13:00-16:00)
3. ❌ Não há FVG claro no movimento de Londres
4. ❌ Londres está em consolidação (sem impulso definido)
5. ❌ Preço não está na zona correta (discount p/ compra, premium p/ venda)

---

## 📊 EXEMPLO PRÁTICO:

### **Cenário: EUR/USD**

**08:00-11:00 GMT (Londres):**
```
Abriu: 1.0800
Fechou: 1.0850 (fechou acima = BULLISH ✅)

High: 1.0860
Low: 1.0790
Origem: 1.0790 (low, pois bullish)

FVG detectado: 1.0815 (gap entre velas)
```

**11:00-13:00 (Aguardando):**
```
Preço sobe para 1.0870
❓ Origem intacta? 1.0870 > 1.0790 ✅ (SIM)
✅ Setup válido, aguardando NY
```

**13:00 (NY Abre):**
```
Preço começa retração: 1.0870 → 1.0830 → 1.0820

13:45 - Preço toca FVG (1.0815) ✅
   ↓
Fib Level: (1.0815 - 1.0790) / (1.0860 - 1.0790) = 35% ✅ (DISCOUNT!)
   ↓
Q-Agent: Confiança 78% ✅
   ↓
COMPRA EXECUTADA!

Entry: 1.0815
SL: 1.0785 (origem - 5 pips)
TP: 1.0875 (RR 2:1)
```

**Resultado:**
```
Preço volta para 1.0880
TP atingido! ✅
Lucro: 60 pips
```

---

## 🎯 Q-LEARNING INTEGRADO:

### **BuildState Avançado:**

```cpp
int BuildState() {
    // COMPONENTE 1: Bias de Londres (0=bearish, 1=bullish)
    int biasIdx = lon.isBullish ? 1 : 0;
    
    // COMPONENTE 2: Zona (0=discount, 1=neutral, 2=premium)
    double fibLevel = GetFibLevel();
    int zoneIdx = 1;
    if(fibLevel < 0.382) zoneIdx = 0;
    if(fibLevel > 0.618) zoneIdx = 2;
    
    // COMPONENTE 3: Volatilidade (range de Londres vs ATR)
    int volIdx = (lonRange > atr * 1.5) ? 1 : 0;
    
    // COMPONENTE 4: Sessão (0=outside, 1=London, 2=NY)
    int sessionIdx = ...;
    
    // COMBINAR: 2 x 3 x 2 x 3 = 36 estados
    int state = biasIdx * 18 + zoneIdx * 6 + volIdx * 3 + sessionIdx;
    
    return state;
}
```

**IA Aprende:**
- ✅ "Londres bullish + NY em discount + toque em FVG = alta probabilidade"
- ✅ "Londres bearish + NY em premium + toque em OB = alta probabilidade"
- ✅ "Range grande de Londres + volatilidade baixa = menor confiança"

---

## 📈 DIFERENÇAS vs SMC ESTÁTICO:

| Aspecto | SMC Estático | CRT Dynamic |
|---------|--------------|-------------|
| **Bias** | D1 (dia anterior) | Londres (primeiras 3h) ⭐ |
| **Zona** | H1 estático | Londres dinâmico ⭐ |
| **Gatilho** | MSB em M5 | FVG Touch em NY ⭐ |
| **Horário** | London/NY genérico | 3h boxes específicas ⭐ |
| **SL** | Fixo em pips | Origem de Londres ⭐ |
| **Validação** | Apenas zones | Origem + FVG + Session ⭐ |

---

## ✅ IMPLEMENTAÇÃO COMPLETA:

### **Funções Principais:**

1. ✅ `CaptureLondonSession()` - Analisa 3h de Londres
2. ✅ `IsOriginIntact()` - Valida se origem foi rompida
3. ✅ `GetFibLevel()` - Calcula nível atual no range
4. ✅ `CheckDynamicBuySignal()` - Todos os filtros de compra
5. ✅ `CheckDynamicSellSignal()` - Todos os filtros de venda
6. ✅ `BuildState()` - Estado com sessão + zona + bias
7. ✅ Q-Learning com persistência total

---

## 🎯 REGRAS IMPLEMENTADAS:

### **✅ COMPRA (BUY):**
```
londres.isBullish = true
   ↓
NY session (13:00-16:00)
   ↓
Preço >= londres.low (origem intacta)
   ↓
FibLevel < 50% (discount)
   ↓
Toque em FVG ou Order Block
   ↓
Q-Agent confidence >= 70%
   ↓
COMPRA!
```

### **✅ VENDA (SELL):**
```
londres.isBullish = false
   ↓
NY session (13:00-16:00)
   ↓
Preço <= londres.high (origem intacta)
   ↓
FibLevel > 50% (premium)
   ↓
Toque em FVG ou Order Block
   ↓
Q-Agent confidence >= 70%
   ↓
VENDA!
```

---

## 🔄 CICLO DIÁRIO:

```
00:00 → Reset (novo dia)
   ↓
08:00 → Londres ABRE
   ↓
11:00 → Londres FECHA → Captura dados
   ↓
     → Calcula: High, Low, Bias, FVG
   ↓
13:00 → NY ABRE → Aguarda retração
   ↓
     → Monitora toque em FVG
   ↓
13:00-16:00 → Janela de entrada
   ↓
Entry se: FVG Touch + Filtros OK
   ↓
16:00 → NY FECHA → Apenas gestão
   ↓
00:00 → Recomeça
```

---

## 📁 ARQUIVOS:

1. ✅ `templates/mql5-crt-dynamic.mq5` - Código completo
2. ✅ `crt_dynamic_q.dat` - Q-Table (persistência)
3. ✅ `crt_dynamic_history.dat` - Histórico

---

## 🚀 STATUS:

**CRT Dynamic implementado com:**
- ✅ Session boxes (London 3h, NY 3h)
- ✅ Dynamic bias (Londres, não D1)
- ✅ FVG detection
- ✅ Origin validation (regra inviolável)
- ✅ Dynamic entry (toque em FVG)
- ✅ Q-Learning com contexto de sessão
- ✅ Persistência total
- ✅ BuildState avançado

**Pronto para testes e produção!** 🎯

---

**Arquivo:** `templates/mql5-crt-dynamic.mq5`  
**Metodologia:** London/NY Flow (Grace FX - Every Day Entry Pattern)  
**Versão:** 4.0 - Dynamic  
**Status:** ✅ COMPLETO
