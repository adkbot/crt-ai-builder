
Deploy (SaaS) - Vercel

1) Suba este projeto no GitHub
2) Vercel -> Import -> Deploy
3) Produção: troque o storage JSON por Postgres (Supabase/Neon) e adicione Auth (Supabase Auth/NextAuth)

Rotas:
- /chat (prompt -> spec -> graph)
- /editor (graph editor + build -> MQL5)
- POST /api/plan
- POST /api/build
- GET/POST /api/projects
