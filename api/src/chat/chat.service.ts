import { Injectable, UnauthorizedException, ForbiddenException, InternalServerErrorException, Logger } from '@nestjs/common';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { TenantsService } from '../tenants/tenants.service';
import { KnowledgeService } from '../knowledge/knowledge.service';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ChatSession, ChatSessionDocument } from '../schemas/chat-session.schema';
import { ToolRegistryService } from '../tools/tool-registry.service';

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);
  private genAI: GoogleGenerativeAI;

  constructor(
    private tenantsService: TenantsService,
    private knowledgeService: KnowledgeService,
    @InjectModel(ChatSession.name) private chatSessionModel: Model<ChatSessionDocument>,
    private toolRegistry: ToolRegistryService,
  ) {
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
  }

  async getSessionHistory(sessionId: string, apiKey: string) {
    if (!apiKey) throw new UnauthorizedException('API key is required');

    const tenant = await this.tenantsService.findByApiKey(apiKey);
    if (!tenant) throw new UnauthorizedException('Invalid API Key');

    const session = await this.chatSessionModel.findOne({ sessionId });
    if (!session) return [];

    if (session.tenantId.toString() !== tenant.id.toString()) {
      throw new ForbiddenException('Session does not belong to this tenant');
    }

    return session.history;
  }

  async deleteSessionHistory(sessionId: string, apiKey: string) {
    if (!apiKey) throw new UnauthorizedException('API key is required');

    const tenant = await this.tenantsService.findByApiKey(apiKey);
    if (!tenant) throw new UnauthorizedException('Invalid API Key');

    const session = await this.chatSessionModel.findOne({ sessionId });
    if (!session) return { message: 'History deleted successfully' };

    if (session.tenantId.toString() !== tenant.id.toString()) {
      throw new ForbiddenException('Session does not belong to this tenant');
    }

    await this.chatSessionModel.deleteOne({ sessionId });
    return { message: 'History deleted successfully' };
  }

  async sendMessage(apiKey: string, userMessage: string, sessionId: string) {
    const tenant = await this.tenantsService.findByApiKey(apiKey);
    if (!tenant) throw new UnauthorizedException('Invalid API Key');

    let session = await this.chatSessionModel.findOne({ sessionId });
    if (session && session.tenantId.toString() !== tenant.id.toString()) {
      throw new ForbiddenException('Session does not belong to this tenant');
    }
    if (!session) {
      session = new this.chatSessionModel({ sessionId, tenantId: tenant.id, history: [] });
    }

    // RAG search
    const relevantInfo = await this.knowledgeService.search(tenant.id, userMessage);
    const RAG_MARKER = '___SAKURAI_RAG_CTX___';
    const prompt = relevantInfo
      ? `${RAG_MARKER}\n${relevantInfo}\n${RAG_MARKER}\n\n${userMessage}`
      : userMessage;

    // Prepare tools
    const activeTools = this.toolRegistry.getDeclarations(tenant.allowedTools || []);

    let systemInstruction = tenant.systemPrompt || '';
    if (activeTools.length > 0) {
      const toolNames = activeTools.map(t => t.name).join(', ');
      systemInstruction += `\n\nYou have access to these tools: ${toolNames}. Use them when relevant to answer the user's questions accurately. Prefer tool results over your own knowledge when available.`;
    }

    const model = this.genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      systemInstruction,
      tools: activeTools.length > 0 ? [{ functionDeclarations: activeTools }] : undefined,
    });

    const safeHistory = Array.isArray(session.history) ? session.history : [];
    // Send only the last 40 messages to Gemini to keep requests fast and within limits
    const trimmedHistory = safeHistory.slice(-40);
    const geminiHistory = trimmedHistory.map(msg => {
      if (msg.parts) {
        return { role: msg.role, parts: msg.parts };
      }
      return {
        role: msg.role,
        parts: [{ text: msg.text || '' }]
      };
    });

    const chatSession = model.startChat({
      history: geminiHistory
    });

    try {
      let result = await chatSession.sendMessage(prompt);
      const toolsUsed: string[] = [];

      // Tool execution loop
      while (result.response.functionCalls() && result.response.functionCalls()!.length > 0) {
        const functionCalls = result.response.functionCalls()!;
        const functionResponses: any[] = [];

        const allowedToolIds = tenant.allowedTools || [];
        for (const call of functionCalls) {
          this.logger.log(`Executing tool: ${call.name}`, call.args);
          toolsUsed.push(call.name);
          let functionResponseData = {};

          const tool = this.toolRegistry.getTool(call.name);
          if (!tool) {
            functionResponseData = { error: 'Unknown tool' };
          } else if (!allowedToolIds.includes(tool.id)) {
            this.logger.warn(`Tenant ${tenant.id} tried to use non-allowed tool: ${call.name}`);
            functionResponseData = { error: 'This tool is not enabled for your agent' };
          } else {
            try {
              functionResponseData = await tool.execute(call.args, {
                tenantId: tenant.id,
              });
            } catch (error) {
              this.logger.error(`Error executing tool ${call.name}:`, error);
              functionResponseData = { error: 'Internal error executing the tool' };
            }
          }

          functionResponses.push({
            functionResponse: { name: call.name, response: functionResponseData },
          });
        }
        result = await chatSession.sendMessage(functionResponses);
      }

      // Save updated history
      const finalHistory = await chatSession.getHistory();

      // Clean RAG context from stored history
      const RAG_MARKER_PATTERN = /___SAKURAI_RAG_CTX___[\s\S]*?___SAKURAI_RAG_CTX___\s*/;
      for (let i = finalHistory.length - 1; i >= 0; i--) {
        const part = finalHistory[i].parts?.[0];
        if (
          finalHistory[i].role === 'user' &&
          part?.text &&
          part.text.includes('___SAKURAI_RAG_CTX___')
        ) {
          part.text = part.text.replace(RAG_MARKER_PATTERN, '').trim();
          break;
        }
      }

      session.history = finalHistory;
      await session.save();

      // Generate async summary after 4+ messages
      if (!session.summary && finalHistory.length >= 4) {
        this.generateSummaryAsync(session);
      }

      return {
        agent: tenant.name,
        reply: result.response.text(),
        toolsUsed: toolsUsed,
        history: finalHistory,
      };
    } catch (error) {
      this.logger.error('Error communicating with Gemini:', error);
      throw new InternalServerErrorException('The agent encountered an error. Please try again.');
    }
  }

  private async generateSummaryAsync(session: ChatSessionDocument) {
    try {
      const model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

      const conversationText = session.history
        .map(msg => `${msg.role}: ${msg.parts[0]?.text || ''}`)
        .join('\n');

      const prompt = `Summarize the following conversation in a single very short phrase (maximum 6 words) as a descriptive title:\n\n${conversationText}`;

      const result = await model.generateContent(prompt);
      const summary = result.response.text().trim().replace(/["']/g, '');

      session.summary = summary;
      await session.save();
      this.logger.log(`Summary generated for session ${session.sessionId}: ${summary}`);
    } catch (error) {
      this.logger.error('Error generating summary:', error);
    }
  }

  async getAnalytics(tenantId: string) {
    const [totals, recentDocs] = await Promise.all([
      this.chatSessionModel.aggregate([
        { $match: { tenantId } },
        {
          $group: {
            _id: null,
            totalChats: { $sum: 1 },
            totalMessages: {
              $sum: {
                $size: {
                  $filter: { input: '$history', as: 'msg', cond: { $eq: ['$$msg.role', 'user'] } },
                },
              },
            },
          },
        },
      ]),
      this.chatSessionModel
        .find({ tenantId })
        .sort({ updatedAt: -1 })
        .limit(50)
        .select('sessionId summary history updatedAt')
        .exec(),
    ]);

    const { totalChats = 0, totalMessages = 0 } = totals[0] || {};

    const recentSessions = recentDocs.map(session => ({
      sessionId: session.sessionId,
      updatedAt: (session as any).updatedAt || new Date(0),
      messageCount: session.history.length,
      preview: session.summary || session.history.find(msg => msg.role === 'user')?.parts[0]?.text || 'No messages',
    }));

    return { totalMessages, totalChats, recentSessions };
  }
}
