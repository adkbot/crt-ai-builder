# 📊 K2 BOXES VISUAL INDICATOR - Guia de Uso

## 🎯 O QUE É:

Indicador visual MQL5 que **desenha no gráfico** as K2 Boxes usadas pela estratégia CRT Dynamic.

**Permite validar:**
- ✅ London Box (08:00-11:00 GMT)
- ✅ NY Box (13:00-16:00 GMT)
- ✅ High/Low capturados
- ✅ FVG (Fair Value Gap) identificado
- ✅ Bias (Bullish/Bearish)

---

## 📁 ARQUIVO:

`templates/K2_Boxes_Indicator.mq5`

---

## 🔧 INSTALAÇÃO:

### **1. Copiar arquivo:**
```
Origem: templates/K2_Boxes_Indicator.mq5
Destino: C:\Users\[Seu Nome]\AppData\Roaming\MetaQuotes\Terminal\[ID]\MQL5\Indicators\
```

### **2. Compilar:**
1. Abra MetaEditor (F4 no MT5)
2. Navegue até `Indicators`
3. Abra `K2_Boxes_Indicator.mq5`
4. Clique `Compile` (F7)
5. Deve mostrar: **0 errors, 0 warnings** ✅

### **3. Anexar ao gráfico:**
1. Abra MT5
2. Abra gráfico do par (ex: EURUSD)
3. `Insert` → `Indicators` → `Custom` → `K2_Boxes_Indicator`
4. Configure parâmetros se necessário
5. OK

---

## ⚙️ PARÂMETROS:

### **Horários (GMT):**
| Parâmetro | Padrão | Descrição |
|-----------|--------|-----------|
| `InpLonStart` | 8 | Início Londres (08:00 GMT) |
| `InpLonEnd` | 11 | Fim Londres (11:00 GMT) |
| `InpNYStart` | 13 | Início NY (13:00 GMT) |
| `InpNYEnd` | 16 | Fim NY (16:00 GMT) |

### **Cores:**
| Parâmetro | Padrão | Descrição |
|-----------|--------|-----------|
| `InpLondonColor` | DodgerBlue | Cor da London Box |
| `InpNYColor` | OrangeRed | Cor da NY Box |
| `InpFVGColor` | Yellow | Cor do FVG |
| `InpBoxTransparency` | 85 | Transparência (0-100) |

### **Visualização:**
| Parâmetro | Padrão | Descrição |
|-----------|--------|-----------|
| `InpShowLabels` | true | Mostrar textos/labels |
| `InpShowFVG` | true | Mostrar linha FVG |

---

## 📊 O QUE APARECE NO GRÁFICO:

### **London Box (Azul):**
```
┌─────────────────────────────┐
│  LONDON BULLISH             │ ← Label
├─────────────────────────────┤
│                             │
│    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓          │ ← Box azul semi-transparente
│                             │
│    -------- FVG (amarelo)   │ ← Linha FVG (se detectado)
│                             │
│                             │
└─────────────────────────────┘
  08:00                 11:00 GMT
```

- ✅ Retângulo azul (08:00-11:00)
- ✅ Linha High (topo do box)
- ✅ Linha Low (base do box)
- ✅ Label "LONDON BULLISH" ou "LONDON BEARISH"
- ✅ Linha amarela FVG (se encontrado)

### **NY Box (Laranja):**
```
┌─────────────────────────────┐
│  NY SESSION (LIVE)          │ ← Label
├─────────────────────────────┤
│                             │
│    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓          │ ← Box laranja (live)
│                             │
└─────────────────────────────┘
  13:00                 16:00 GMT
```

- ✅ Retângulo laranja (13:00-16:00)
- ✅ Atualiza em tempo real
- ✅ Label "NY SESSION (LIVE)"

---

## 📋 INFORMAÇÕES EXIBIDAS:

### **No Comentário do Gráfico:**
```
=== K2 BOXES INDICATOR ===
Current Time: 2026.01.19 14:30
---
LONDON BOX:
  High: 1.08650
  Low: 1.08420
  Bias: BULLISH
  FVG: 1.08515
```

### **Labels no Gráfico:**
```
LONDON BULLISH           ← No início da London Box
H: 1.08650               ← No high da London Box
L: 1.08420               ← No low da London Box
FVG                      ← Na linha do FVG
NY SESSION (LIVE)        ← Durante sessão NY
```

---

## 🎯 COMO USAR PARA VALIDAÇÃO:

### **1. Verificar London Box:**
```
✅ Box aparece às 11:00 GMT (fim de Londres)
✅ High/Low corretos (compara com velas)
✅ Bias correto (BULLISH se subiu, BEARISH se caiu)
✅ FVG detectado (linha amarela)
```

### **2. Verificar NY Box:**
```
✅ Box aparece às 13:00 GMT (início de NY)
✅ Atualiza em tempo real
✅ High/Low acompanham movimento
```

### **3. Comparar com EA:**
```
1. Coloque o indicador no gráfico
2. Coloque o EA CRT Dynamic no mesmo gráfico
3. Compare valores no log:
   - High/Low devem ser iguais
   - Bias deve ser igual
   - FVG deve ser igual
```

---

## 🔍 EXEMPLO DE VALIDAÇÃO:

### **Indicador mostra:**
```
LONDON BOX:
  High: 1.08650
  Low: 1.08420
  Bias: BULLISH
  FVG: 1.08515
```

### **EA deve logar:**
```
Londres capturada: BULLISH
High: 1.08650
Low: 1.08420
FVG: 1.08515
```

**✅ Se valores são iguais = EA está capturando corretamen te!**  
**❌ Se valores diferentes = Investigar problema!**

---

## 🎨 DICAS VISUAIS:

### **Ajustar Transparência:**
```
InpBoxTransparency = 85  (padrão - bem transparente)
InpBoxTransparency = 50  (mais visível)
InpBoxTransparency = 95  (quase invisível)
```

### **Mudar Cores:**
```
// Para combinar com tema dark:
InpLondonColor = clrCyan
InpNYColor = clrMagenta
InpFVGColor = clrLime
```

### **Ocultar Labels:**
```
InpShowLabels = false  (apenas boxes)
InpShowFVG = false     (sem linha FVG)
```

---

## 📊 TIMEFRAMES RECOMENDADOS:

| Timeframe | Visualização |
|-----------|--------------|
| **M5** | ✅ IDEAL - Vê detalhes das boxes |
| **M15** | ✅ BOM - Visão geral |
| **H1** | ⚠️ OK - Boxes pequenas |
| **H4/D1** | ❌ Muito pequeno |

---

## 🚨 TROUBLESHOOTING:

### **Boxes não aparecem:**
```
Causa: Horário GMT incorreto
Solução: Ajustar InpLonStart/InpLonEnd conforme seu broker
```

### **FVG não aparece:**
```
Causa: Não foi detectado gap válido
Solução: Normal - nem sempre há FVG
```

### **NY Box não atualiza:**
```
Causa: Não está em horário NY
Solução: Aguardar 13:00-16:00 GMT
```

### **Cores diferentes do esperado:**
```
Causa: Parâmetros alterados
Solução: Reset configurações ao padrão
```

---

## ✅ CHECKLIST DE VALIDAÇÃO:

### **Validar London Box:**
- [ ] Box aparece às 11:00 GMT
- [ ] High coincide com máxima das velas 08:00-11:00
- [ ] Low coincide com mínima das velas 08:00-11:00
- [ ] Bias correto (vela de 08:00 vs 11:00)
- [ ] FVG na linha amarela (se existe gap)

### **Validar NY Box:**
- [ ] Box aparece às 13:00 GMT
- [ ] Atualiza em tempo real
- [ ] High/Low acompanham preço

### **Validar com EA:**
- [ ] Valores High/Low iguais
- [ ] Bias igual
- [ ] FVG igual
- [ ] Horários sincronizados

---

## 🎯 RESULTADO ESPERADO:

**No gráfico você deve ver:**

```
[08:00]──────[11:00]       [13:00]──────[16:00]
    │   LONDON BOX │           │    NY BOX    │
    │   (Azul)     │           │  (Laranja)   │
    └──────────────┘           └──────────────┘
         ↓                           ↓
    Capturado                  Em tempo real
    às 11:00                   durante 13-16h
```

**Com informações:**
- 📌 High/Low de cada box
- 📌 Bias (Bullish/Bearish)
- 📌 FVG (se detectado)
- 📌 Labels explicativos

---

## 🚀 PRÓXIMOS PASSOS:

1. ✅ Compile o indicador
2. ✅ Anexe ao gráfico M5
3. ✅ Aguarde 11:00 GMT (London Box aparece)
4. ✅ Aguarde 13:00 GMT (NY Box aparece)
5. ✅ Compare valores com EA
6. ✅ Valide se captura está correta!

---

**Arquivo:** `K2_Boxes_Indicator.mq5`  
**Tipo:** Indicador Visual  
**Objetivo:** Debug/Validação CRT Dynamic  
**Status:** ✅ Pronto para uso
