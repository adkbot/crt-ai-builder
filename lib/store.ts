
import fs from "node:fs";
import path from "node:path";
const DATA_DIR=path.join(process.cwd(),"data");
const FILE=path.join(DATA_DIR,"projects.json");
export type Project={id:string;name:string;createdAt:number;updatedAt:number;graph:any};
function ensure(){ if(!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR); if(!fs.existsSync(FILE)) fs.writeFileSync(FILE,JSON.stringify({projects:[]},null,2)); }
export function listProjects():Project[]{ ensure(); const raw=JSON.parse(fs.readFileSync(FILE,"utf-8")); return raw.projects??[]; }
export function saveProject(p:Project){ ensure(); const raw=JSON.parse(fs.readFileSync(FILE,"utf-8")); const projects:Project[]=raw.projects??[]; const idx=projects.findIndex(x=>x.id===p.id); if(idx>=0) projects[idx]=p; else projects.unshift(p); fs.writeFileSync(FILE,JSON.stringify({projects},null,2)); }
export function getProject(id:string):Project|null{ return listProjects().find(p=>p.id===id)??null; }
