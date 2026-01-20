
import { NextResponse } from "next/server";
import { getProject, listProjects, saveProject } from "@/lib/store";
import { v4 as uuid } from "uuid";

export async function GET(req: Request){
  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  if(id) return NextResponse.json({ project: getProject(id) });
  return NextResponse.json({ projects: listProjects() });
}

export async function POST(req: Request){
  const body = await req.json().catch(()=> ({}));
  const now = Date.now();
  const id = String(body.id || uuid());
  const project = { id, name: String(body.name||"Projeto"), createdAt: body.createdAt?Number(body.createdAt):now, updatedAt: now, graph: body.graph ?? {nodes:[],edges:[]} };
  saveProject(project as any);
  return NextResponse.json({ project });
}
