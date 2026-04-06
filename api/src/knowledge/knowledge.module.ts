import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { KnowledgeService } from './knowledge.service';
import { KnowledgeController } from './knowledge.controller';
import { Knowledge, KnowledgeSchema } from '../schemas/knowledge.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Knowledge.name, schema: KnowledgeSchema }]),
  ],
  controllers: [KnowledgeController],
  providers: [KnowledgeService],
  exports: [KnowledgeService]
})
export class KnowledgeModule {}