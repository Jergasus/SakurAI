import { Injectable } from '@nestjs/common';
import { FunctionDeclaration } from '@google/generative-ai';
import { AgentTool } from './interfaces/tool.interface';

@Injectable()
export class ToolRegistryService {
  private tools = new Map<string, AgentTool>();
  private toolsByFunctionName = new Map<string, AgentTool>();

  constructor() {
    // Register your custom tools here. See TOOLS.md for instructions.
  }

  registerTool(tool: AgentTool) {
    this.tools.set(tool.id, tool);
    this.toolsByFunctionName.set(tool.declaration.name, tool);
  }

  getTool(id: string): AgentTool | undefined {
    return this.tools.get(id) || this.toolsByFunctionName.get(id);
  }

  getDeclarations(toolIds: string[]): FunctionDeclaration[] {
    return toolIds
      .map(id => this.tools.get(id)?.declaration)
      .filter((declaration): declaration is FunctionDeclaration => declaration !== undefined);
  }

  getAllToolsMetadata() {
    return Array.from(this.tools.values()).map(tool => ({
      id: tool.id,
      name: tool.displayName || tool.declaration.name,
      icon: tool.icon || '🔧',
      description: tool.declaration.description,
    }));
  }
}
