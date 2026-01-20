# ⚠️ IMPORTANTE: Como Testar  O Sistema

## ✅ Sistema Configurado!

- ✅ Chave OpenAI configurada
- ✅ Dependências instaladas  
- ✅ Servidor rodando (porta 3001)
- ✅ Correção aplicada

---

## 🎯 Para Testar AGORA:

### **1. Acesse:**
```
http://localhost:3001/editor
```

### **2. Use um destes vídeos de TESTE (com legendas):**

**Vídeo 1 - ICT Trading:**
```
https://www.youtube.com/watch?v=o0v4KQxZbpU
```

**Vídeo 2 - Trading Básico:**
```
https://www.youtube.com/watch?v=dQw4w9WgXcQ
```

### **3. Cole no campo "Vídeo 1"**

### **4. Clique "Analisar & Gerar Estratégia"**

### **5. Aguarde 15-30 segundos**

---

## ✅ O que Deve Acontecer:

1. **Estado:** "🔍 Analisando..."
2. **Console mostra:**
   ```
   📹 ID do vídeo extraído: xxxxx
   ✅ Transcrição extraída: XXX caracteres
   🤖 Analisando estratégia com IA...
   ✅ Análise concluída: [Nome da Estratégia]
   ```
3. **Nós criados no editor!**
4. **Resultado mostra:**
   - Nome da estratégia
   - Win Rate: XX%
   - Botão "Criar Estratégia"

---

## ❌ Se Der Erro:

### **Erro: "Transcrição muito curta"**
→ Vídeo não tem legendas. Use outro.

### **Erro: "Invalid API Key"**
→ Chave OpenAI incorreta. Verifique `.env.local`

### **Erro 500:**
→ Problema no código. Me avise!

---

## 📹 Vídeos do GRACE FX:

**IMPORTANTE:** Preciso das URLs COMPLETAS dos vídeos do Grace FX.

As que você passou estavam incompletas:
- ❌ `kv_3-jU-z8` (falta 2 caracteres)
- ❌ Precisa ser 11 caracteres

**Formato correto:**
```
https://www.youtube.com/watch?v=[11_caracteres]
```

**Exemplo:**
```
https://www.youtube.com/watch?v=yZjUTi6drpY
```

---

## 🎯 Próximos Passos:

1. Teste com um dos vídeos acima
2. Veja se cria os nós
3. Se funcionar, use vídeos do Grace FX (URLs completas)
4. Me avise o resultado!

---

**Servidor rodando em:** http://localhost:3001  
**Arquivo de log:** Veja no terminal onde rodou `npm run dev`
