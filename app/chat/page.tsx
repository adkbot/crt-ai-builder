"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ChatPage() {
  const [userPrompt, setUserPrompt] = useState("");
  const [refinedPrompt, setRefinedPrompt] = useState("");
  const [isRefining, setIsRefining] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [showApproval, setShowApproval] = useState(false);
  const [createdStrategy, setCreatedStrategy] = useState<any>(null);
  const router = useRouter();

  const refinePrompt = async () => {
    if (!userPrompt.trim()) {
      alert("Cole seu prompt primeiro!");
      return;
    }

    setIsRefining(true);
    setRefinedPrompt("");
    setShowApproval(false);

    try {
      const res = await fetch("/api/refine-prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: userPrompt })
      });

      const data = await res.json();

      if (data.error) {
        alert("Erro: " + data.error);
        return;
      }

      setRefinedPrompt(data.refinedPrompt);
      setShowApproval(true);
    } catch (err: any) {
      alert("Erro ao refinar: " + err.message);
    } finally {
      setIsRefining(false);
    }
  };

  const createStrategy = async () => {
    setIsCreating(true);

    try {
      // Usa o prompt refinado para criar a estratégia
      const res = await fetch("/api/create-from-prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: refinedPrompt })
      });

      const data = await res.json();

      if (data.error) {
        alert("Erro: " + data.error);
        return;
      }

      // Salvar projeto
      await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.strategyName || "Estratégia do Chat",
          graph: data.graph
        })
      });

      setCreatedStrategy(data);
    } catch (err: any) {
      alert("Erro ao criar: " + err.message);
    } finally {
      setIsCreating(false);
    }
  };

  const goToEditor = () => {
    router.push("/editor");
  };

  const resetChat = () => {
    setUserPrompt("");
    setRefinedPrompt("");
    setShowApproval(false);
    setCreatedStrategy(null);
  };

  return (
    <div style={{ maxWidth: 980, margin: "26px auto", padding: "0 16px" }}>
      <h2 style={{ margin: 0 }}>💬 Chat IA - Criador de Estratégias</h2>

      <div className="info-card" style={{ marginTop: 16 }}>
        <h4>🤖 Como funciona:</h4>
        <ol style={{ marginLeft: 20, marginTop: 8, fontSize: 14, lineHeight: 1.8 }}>
          <li>📝 <strong>Cole seu prompt</strong> descrevendo a estratégia</li>
          <li>✨ <strong>IA refina</strong> o prompt para melhor resultado</li>
          <li>👀 <strong>Você revisa</strong> e aprova</li>
          <li>🚀 <strong>Sistema cria</strong> a estratégia no editor</li>
        </ol>
      </div>

      {/* Step 1: User Prompt */}
      {!showApproval && !createdStrategy && (
        <div style={{ marginTop: 24 }}>
          <label style={{ display: "block", marginBottom: 8, fontSize: 14, fontWeight: 600 }}>
            📝 Cole seu prompt aqui:
          </label>
          <textarea
            className="input"
            placeholder="Exemplo: Quero uma estratégia baseada em cruzamento de médias móveis com stop loss dinâmico..."
            value={userPrompt}
            onChange={(e) => setUserPrompt(e.target.value)}
            disabled={isRefining}
            rows={8}
            style={{ width: "100%", resize: "vertical", fontFamily: "monospace", fontSize: 13 }}
          />

          <button
            className="btn"
            onClick={refinePrompt}
            disabled={isRefining || !userPrompt.trim()}
            style={{ width: "100%", marginTop: 12 }}
          >
            {isRefining ? "✨ Refinando..." : "✨ Refinar Prompt com IA"}
          </button>
        </div>
      )}

      {/* Step 2: Refined Prompt & Approval */}
      {showApproval && !createdStrategy && (
        <div style={{ marginTop: 24 }}>
          <div className="result-card" style={{ borderColor: "rgba(34,197,94,.3)", background: "rgba(34,197,94,.05)" }}>
            <h3>✅ Prompt Refinado pela IA</h3>

            <div style={{
              background: "rgba(0,0,0,0.3)",
              padding: 16,
              borderRadius: 8,
              marginTop: 12,
              fontFamily: "monospace",
              fontSize: 13,
              lineHeight: 1.6,
              whiteSpace: "pre-wrap"
            }}>
              {refinedPrompt}
            </div>

            <div style={{ marginTop: 16, padding: 12, background: "rgba(255,193,7,.1)", borderRadius: 6, border: "1px solid rgba(255,193,7,.3)" }}>
              <p style={{ margin: 0, fontSize: 14 }}>
                💡 <strong>Revise o prompt refinado.</strong> A IA otimizou para incluir os melhores conceitos SMC/ICT.
              </p>
            </div>

            <div style={{ display: "flex", gap: 12, marginTop: 20 }}>
              <button
                className="btn"
                onClick={createStrategy}
                disabled={isCreating}
                style={{ flex: 1 }}
              >
                {isCreating ? "🚀 Criando..." : "✅ Aprovar e Criar Estratégia"}
              </button>

              <button
                className="btn secondary"
                onClick={() => {
                  setShowApproval(false);
                  setRefinedPrompt("");
                }}
                disabled={isCreating}
                style={{ flex: 1 }}
              >
                ✏️ Editar Prompt
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Strategy Created */}
      {createdStrategy && (
        <div className="approved-strategy-container">
          <div className="approved-card">
            <div className="pulse-indicator"></div>

            <h3>✅ Estratégia CRIADA!</h3>

            <div style={{ marginTop: 16 }}>
              <p><strong>Nome:</strong> {createdStrategy.strategyName}</p>
              <p><strong>Win Rate:</strong> <span className="highlight">{createdStrategy.winRate}%</span></p>
              <p><strong>Confiância:</strong> <span className="highlight">{createdStrategy.confidence}%</span></p>
              <p><strong>Nós Gerados:</strong> {createdStrategy.graph?.nodes?.length || 0}</p>
              <p><strong>Conexões:</strong> {createdStrategy.graph?.edges?.length || 0}</p>
            </div>

            <div className="pulse-text">
              ✨ Flux conectado e pronto para gerar código!
            </div>

            <div style={{ display: "flex", gap: 12, marginTop: 24 }}>
              <button
                className="btn-primary pulse-button"
                onClick={goToEditor}
                style={{ flex: 1 }}
              >
                ⚡ Abrir no Editor
              </button>

              <button
                className="btn secondary"
                onClick={resetChat}
                style={{ flex: 1 }}
              >
                🔄 Nova Estratégia
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Loading States */}
      {isRefining && (
        <div style={{ marginTop: 24, textAlign: "center", padding: 40 }}>
          <div className="spinner" style={{ margin: "0 auto 16px" }}></div>
          <p style={{ fontSize: 14, opacity: 0.8 }}>✨ IA refinando seu prompt...</p>
        </div>
      )}

      {isCreating && (
        <div style={{ marginTop: 24, textAlign: "center", padding: 40 }}>
          <div className="spinner" style={{ margin: "0 auto 16px" }}></div>
          <p style={{ fontSize: 14, opacity: 0.8 }}>🚀 Criando estratégia no editor...</p>
        </div>
      )}
    </div>
  );
}
