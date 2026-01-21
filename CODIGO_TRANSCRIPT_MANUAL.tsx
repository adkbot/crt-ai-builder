// Adicionar este código na seção do YouTube do editor (linha ~403)

{/* ✅ SOLUÇÃO DEFINITIVA: Transcrição Manual */ }
<div style={{ marginTop: 16, marginBottom: 12 }}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
        <label style={{ fontSize: 13, fontWeight: 600 }}>
            📝 OU Cole a Transcrição Manualmente
        </label>
        <div className="pill" style={{ fontSize: 10, padding: "2px 8px", background: "#10b981" }}>
            Sempre Funciona!
        </div>
    </div>
    <div style={{ fontSize: 11, opacity: 0.7, marginBottom: 8 }}>
        Vídeo sem legendas? Cole a transcrição aqui:
        <br />
        <span style={{ fontSize: 10 }}>YouTube → "..." → "Mostrar transcrição" → Copie e cole</span>
    </div>
    <textarea
        className="input"
        placeholder="Cole aqui o texto da transcrição do vídeo...

Exemplo: abrir vídeo no YouTube, clicar nos 3 pontinhos (...), selecionar 'Mostrar transcrição', copiar todo o texto e colar aqui.

Esta opção SEMPRE funciona, mesmo quando a extração automática falha!"
        value={manualTranscript}
        onChange={(e) => setManualTranscript(e.target.value)}
        disabled={isAnalyzing}
        style={{
            minHeight: "120px",
            resize: "vertical",
            fontFamily: "monospace",
            fontSize: "12px",
            lineHeight: "1.4"
        }}
    />
    {manualTranscript.length > 0 && (
        <div style={{ fontSize: 11, opacity: 0.6, marginTop: 4 }}>
            ✅ {manualTranscript.length} caracteres ({Math.ceil(manualTranscript.length / 5)} palavras aprox.)
        </div>
    )}
</div>

// Atualizar botão de limpar para incluir transcript:
onClick = {() => {
    setYoutubeUrl('');
    setManualTranscript('');  // ✅ Limpar transcript também
    setAnalysisResult(null);
}}
