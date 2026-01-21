# 🔥 LIMPAR CACHE DO VERCEL - PASSO A PASSO

## ⚠️ IMPORTANTE: Faça isso AGORA!

O código está correto, mas o **Vercel está usando cache antigo**.

---

## 📋 PASSO A PASSO:

### **1. Acesse o Vercel Dashboard**
```
https://vercel.com/dashboard
```

### **2. Faça Login** 
(se necessário)

### **3. Encontre o Projeto**
- Procure: **crt-ai-builder**
- Clique no projeto

### **4. Vá em "Deployments"**
- No menu superior, clique em **"Deployments"**

### **5. Encontre o Último Deploy**
- Você verá uma lista de deploys
- O mais recente deve estar no topo
- Status: "Building" ou "Ready" ou "Error"

### **6. OPÇÃO A - Se estiver "Building":**
✅ Aguarde o build terminar (2-3 minutos)
✅ Isso usará o código NOVO (sem yt-dlp)
✅ Quando ficar "Ready", teste o site

### **7. OPÇÃO B - Se estiver "Ready" mas antigo:**
1. Clique nos **três pontinhos** (...) ao lado do deploy
2. Clique em **"Redeploy"**
3. **MARQUE** a opção: ✅ **"Use existing Build Cache"** → **DESMARQUE ISSO!**
4. Confirme **"Redeploy"**
5. Aguarde 2-3 minutos

### **8. OPÇÃO C - Forçar por Settings:**
1. Vá em **"Settings"** do projeto
2. Clique em **"General"**
3. Role até **"Build & Development Settings"**
4. Clique em **"Override"** em "Build Command"
5. Digite: `rm -rf .next && npm run build`
6. Clique **"Save"**
7. Volte em **"Deployments"**
8. Clique no último deploy → **"Redeploy"**

---

## ✅ COMO SABER QUE FUNCIONOU:

Após o deploy terminar:
1. Acesse: https://crt-ai-builder.vercel.app
2. Teste com uma URL do YouTube
3. **NÃO deve aparecer erro de "yt-dlp"**
4. Deve funcionar normalmente!

---

## 🎯 SE AINDA NÃO FUNCIONAR:

Me mostre um print do:
1. Tela de "Deployments" no Vercel
2. Status do último deploy
3. Logs do build (se houver erro)

---

## 📞 SUPORTE RÁPIDO:

**O que fazer AGORA:**
1. ✅ Acesse https://vercel.com/dashboard
2. ✅ Entre no projeto "crt-ai-builder"
3. ✅ Vá em "Deployments"
4. ✅ Verifique se há um build "Building" ou "Ready"
5. ✅ Se "Building" → aguarde
6. ✅ Se "Ready" (antigo) → clique "Redeploy" SEM cache

---

**FAÇA ISSO AGORA E ME AVISE!** 🚀
