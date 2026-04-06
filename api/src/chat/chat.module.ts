import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { TenantsModule } from '../tenants/tenants.module';
import { KnowledgeModule } from '../knowledge/knowledge.module';
import { ChatSession, ChatSessionSchema } from '../schemas/chat-session.schema';
import { ToolRegistryService } from '../tools/tool-registry.service';
import { ToolsController } from '../tools/tools.controller';

@Module({
  imports: [
    TenantsModule,
    KnowledgeModule,
    MongooseModule.forFeature([
      { name: ChatSession.name, schema: ChatSessionSchema }
    ])
  ],
  controllers: [ChatController, ToolsController],
  providers: [ChatService, ToolRegistryService],
})
export class ChatModule {}
