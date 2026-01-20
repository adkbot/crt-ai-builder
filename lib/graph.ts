
export type GraphNode={id:string; type:string; data:Record<string,any>; position?:{x:number;y:number}};
export type GraphEdge={id:string; source:string; target:string; sourceHandle?:string|null; targetHandle?:string|null};
export type Graph={nodes:GraphNode[]; edges:GraphEdge[]};
