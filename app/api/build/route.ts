
import { NextResponse } from "next/server";
import { generateStrategyCode } from "@/lib/strategyCodeGenerator";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const graph = body.graph;

  if (!graph?.nodes || !graph?.edges) {
    return NextResponse.json({ error: "graph inválido" }, { status: 400 });
  }

  // Extrair nome da estratégia dos nós
  const strategyName = graph.nodes[0]?.data?.strategyName || "CRT Strategy";

  // Usar gerador inteligente (detecta metodologia automaticamente!)
  const generated = await generateStrategyCode(graph.nodes, graph.edges, strategyName);

  return NextResponse.json({
    mql: generated.mql5,
    description: generated.description,
    methodology: generated.methodology,
    parameters: generated.parameters
  });
}
