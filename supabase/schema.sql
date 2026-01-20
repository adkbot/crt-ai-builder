-- ========================================
-- CRT AI BUILDER - SUPABASE SCHEMA
-- ========================================

-- Tabela de Projetos (Estratégias)
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    graph JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_id TEXT,
    win_rate DECIMAL(5,2),
    confidence DECIMAL(5,2),
    methodology TEXT,
    status TEXT DEFAULT 'draft'
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_created_at ON projects(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_projects_methodology ON projects(methodology);

-- Tabela de Análises de Vídeo (histórico)
CREATE TABLE IF NOT EXISTS video_analyses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    url TEXT NOT NULL,
    strategy_name TEXT,
    win_rate DECIMAL(5,2),
    confidence DECIMAL(5,2),
    methodology TEXT,
    graph JSONB,
    transcript TEXT,
    analyzed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_id TEXT,
    status TEXT DEFAULT 'completed'
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_analyses_user_id ON video_analyses(user_id);
CREATE INDEX IF NOT EXISTS idx_analyses_analyzed_at ON video_analyses(analyzed_at DESC);

-- Tabela de Prompts IA (histórico de refinamentos)
CREATE TABLE IF NOT EXISTS ai_prompts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    original_prompt TEXT NOT NULL,
    refined_prompt TEXT NOT NULL,
    strategy_name TEXT,
    win_rate DECIMAL(5,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_id TEXT,
    graph JSONB
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_prompts_user_id ON ai_prompts(user_id);
CREATE INDEX IF NOT EXISTS idx_prompts_created_at ON ai_prompts(created_at DESC);

-- Habilitar Row Level Security (RLS)
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_prompts ENABLE ROW LEVEL SECURITY;

-- Políticas RLS (permite a todos enquanto não tem auth)
CREATE POLICY "Allow all access to projects" ON projects FOR ALL USING (true);
CREATE POLICY "Allow all access to video_analyses" ON video_analyses FOR ALL USING (true);
CREATE POLICY "Allow all access to ai_prompts" ON ai_prompts FOR ALL USING (true);

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para projects
CREATE TRIGGER update_projects_updated_at 
    BEFORE UPDATE ON projects 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Comentários nas tabelas
COMMENT ON TABLE projects IS 'Armazena estratégias criadas (projetos do editor)';
COMMENT ON TABLE video_analyses IS 'Histórico de análises de vídeos do YouTube';
COMMENT ON TABLE ai_prompts IS 'Histórico de prompts refinados pela IA no chat';

-- Inserir projeto de exemplo
INSERT INTO projects (name, graph, win_rate, confidence, methodology, status) 
VALUES (
    'Exemplo: CRT Dynamic',
    '{"nodes": [], "edges": []}',
    78.5,
    85.0,
    'CRT_DYNAMIC',
    'example'
) ON CONFLICT DO NOTHING;
