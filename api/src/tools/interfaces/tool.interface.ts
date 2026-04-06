import { FunctionDeclaration } from '@google/generative-ai';

export interface AgentTool {
  id: string;
  niches: string[];
  icon?: string;
  displayName?: string;
  declaration: FunctionDeclaration;
  execute: (args: any, context: { tenantId: string; [key: string]: any }) => Promise<any>;
}
