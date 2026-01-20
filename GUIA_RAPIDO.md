# 🎯 GUIA RÁPIDO - NOVAS FUNCIONALIDADES

## 🆕 ATUALIZAÇÕES IMPLEMENTADAS

---

## 1️⃣ **DELETAR NÓS** 🗑️

### **3 Formas de deletar:**

#### **Forma 1: Clique Direito**
1. Clique com **botão direito** no nó
2. Confirme a exclusão no dialog

#### **Forma 2: Tecla DELETE**
1. Clique no nó para selecioná-lo
2. Pressione **DELETE** no teclado

#### **Forma 3: Modal de Propriedades**
1. Clique no nó (abre modal)
2. Clique no botão vermelho **"🗑️ Deletar Nó"**

> **Efeito:** O nó e todas as conexões ligadas a ele são removidos.

---

## 2️⃣ **LIMPAR TUDO** 🧹

### **Como usar:**

1. Na **sidebar**, procure o botão vermelho:
   ```
   🗑️ Limpar Tudo
   ```
2. Clique nele
3. Confirme no dialog: "Tem certeza que deseja apagar TUDO?"

> **Efeito:** Remove TODOS os nós e conexões. Canvas volta ao zero.

---

## 3️⃣ **APRENDER DO YOUTUBE** 🎓

### **Fluxo Completo:**

#### **Passo 1: Cole a URL**
1. Na sidebar, encontre a seção:
   ```
   📹 Aprender do YouTube
   ```
2. Cole a URL do vídeo no campo de texto:
   ```
   https://youtube.com/watch?v=ABC123
   ```

#### **Passo 2: Analisar**
1. Clique no botão azul:
   ```
   🎓 Analisar & Gerar Estratégia
   ```
2. Aguarde 3-5 segundos (status muda para "🤖 Analisando vídeo...")

#### **Passo 3: Revisar Resultado**

O sistema mostrará um **card de resultado**:

```
📊 Resultado da Análise
Estratégia: Silver Bullet (YouTube)
Win Rate: 75%
Confiabilidade: 85%
✅ Aprovado (75%)
```

**Interpretação:**
- ✅ **Verde (≥70%)**: Estratégia aprovada! Pode aplicar.
- ❌ **Vermelho (<70%)**: Estratégia reprovada. Não recomendado.

#### **Passo 4: Aplicar ao Editor**

Se aprovado (≥70%):
1. Dialog aparece: "✅ Estratégia validada com 75% de acerto! Aplicar ao editor?"
2. Clique em **OK**
3. **Pronto!** Os nós são gerados automaticamente no canvas.

---

## 📊 **SISTEMA DE VALIDAÇÃO**

### **Critérios de Aprovação:**

| Win Rate | Status | Ação |
|----------|--------|------|
| **70-79%** | ✅ Bom | Aprovado - Aplicar |
| **80-89%** | ✅ Muito Bom | Aprovado - Aplicar |
| **90%+** | ✅ Excelente | Aprovado - Aplicar |
| **<70%** | ❌ Reprovado | Não aplicar |

### **O que é analisado:**

1. **Transcrição do vídeo** - Extrai texto falado
2. **Identificação da estratégia** - CRT, Silver Bullet, MA Cross, etc
3. **Parâmetros** - Horário, RR, timeframe
4. **Backtest** - Testa com dados históricos
5. **Win Rate** - Calcula % de acerto
6. **Confiabilidade** - Valida robustez

---

## 🎯 **EXEMPLOS DE USO**

### **Exemplo 1: Estratégia Aprovada**

**Input:**
```
URL: https://youtube.com/watch?v=ict-silver-bullet
```

**Output:**
```
📊 Resultado da Análise
Estratégia: Silver Bullet (YouTube)
Win Rate: 78%
Confiabilidade: 88%
✅ Aprovado (78%)
```

**Nós Gerados:**
1. TIME_FILTER (10:00-11:00)
2. SMC_SILVERBULLET (rr=2, sweepMaxPips=30)
3. Q_AGENT (alpha=0.1, gamma=0.95, epsilon=0.2)
4. BUY_MARKET (lot=0.01, slPips=30, rr=2)
5. SELL_MARKET (lot=0.01, slPips=30, rr=2)

**Conexões:**
```
TIME → SILVER → Q_AGENT → BUY/SELL
```

---

### **Exemplo 2: Estratégia Reprovada**

**Input:**
```
URL: https://youtube.com/watch?v=estrategia-ruim
```

**Output:**
```
📊 Resultado da Análise
Estratégia: Random Setup (YouTube)
Win Rate: 62%
Confiabilidade: 55%
❌ Abaixo de 70% (62%)
```

**Ação:** Sistema **NÃO aplica** automaticamente. Você pode tentar ajustar manualmente.

---

## 🔧 **ATALHOS DO TECLADO**

| Tecla | Ação |
|-------|------|
| **DELETE** | Deleta nó selecionado |
| **Ctrl+C** | Copia código MQL5 (quando painel está focado) |
| **ESC** | Fecha modal |

---

## 💡 **DICAS PROFISSIONAIS**

### **Para Melhor Win Rate:**

1. **Use vídeos de traders profissionais** (ICT, SMC experts)
2. **Procure estratégias com regras claras** (se o vídeo é vago, resultado será vago)
3. **Teste com múltiplos vídeos** da mesma estratégia
4. **Combine com ajustes manuais** (edite os nós gerados)

### **Workflow Recomendado:**

```
1. Cole URL do YouTube
   ↓
2. Analise e veja Win Rate
   ↓
3. Se ≥70%: Aplique ao editor
   ↓
4. Ajuste parâmetros manualmente (clique nos nós)
   ↓
5. Construa o Bot
   ↓
6. Teste no MT5 em demo account
   ↓
7. Se confirmar resultados: Use em live
```

---

## 🚨 **AVISOS IMPORTANTES**

### **MVP vs Produção:**

**Atualmente (MVP):**
- ✅ Interface funcional
- ✅ Validação de URLs
- ✅ Geração de nós automática
- ⚠️ Análise **SIMULADA** (não pega vídeo real)
- ⚠️ Backtest **SIMULADO** (não usa dados reais)

**Para Produção Real:**
- 🔧 Integrar YouTube Transcript API
- 🔧 Integrar OpenAI GPT-4
- 🔧 Implementar backtest engine real
- 🔧 Usar dados históricos verdadeiros

> Veja `YOUTUBE_INTEGRATION.md` para instruções de upgrade.

---

## 📖 **TUTORIAL COMPLETO**

### **Cenário: Aprender Silver Bullet do ICT**

1. **Encontre um vídeo** de ICT ensinando Silver Bullet
2. **Copie a URL**: `https://youtube.com/watch?v=...`
3. **Abra** `/editor`
4. **Cole** a URL na seção "Aprender do YouTube"
5. **Clique** "Analisar & Gerar Estratégia"
6. **Aguarde** a análise (3-5s)
7. **Veja** o resultado:
   - ✅ Se ≥70%: Clique "OK" para aplicar
   - ❌ Se <70%: Tente outro vídeo ou ajuste manual
8. **Revise** os nós gerados
9. **Edite** se necessário (clique nos nós)
10. **Construa** o bot
11. **Copie** o código MQL5
12. **Cole** no MT5
13. **Teste** em demo!

---

## 🎉 **RESULTADO**

Agora você tem:
- ✅ **Controle total** sobre os nós (criar, editar, deletar)
- ✅ **Limpeza rápida** com 1 clique
- ✅ **Aprendizado automático** de vídeos do YouTube
- ✅ **Validação inteligente** com critério de 70%
- ✅ **Geração automática** de código MQL5

**Explore e crie estratégias vencedoras!** 🚀

---

**Última atualização:** Janeiro 2026  
**Versão:** 1.1.0
