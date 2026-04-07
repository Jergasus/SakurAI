import { Injectable, Logger, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Knowledge, KnowledgeDocument } from '../schemas/knowledge.schema';

@Injectable()
export class KnowledgeService {
  private readonly logger = new Logger(KnowledgeService.name);
  private genAI: GoogleGenerativeAI;
  private vectorSearchMode: string;

  constructor(
    @InjectModel(Knowledge.name) private knowledgeModel: Model<KnowledgeDocument>,
  ) {
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    this.vectorSearchMode = process.env.VECTOR_SEARCH_MODE || 'local';
    this.logger.log(`Vector search mode: ${this.vectorSearchMode}`);
  }

  async ingestText(tenantId: string, content: string) {
    const model = this.genAI.getGenerativeModel({ model: 'gemini-embedding-001' });
    const result = await model.embedContent(content);
    const embedding = result.embedding.values;

    this.logger.log(`Text embedded to vector of size: ${embedding.length}`);

    const newDoc = new this.knowledgeModel({
      tenantId,
      content,
      embedding,
    });

    return await newDoc.save();
  }

  async search(tenantId: string, query: string) {
    const model = this.genAI.getGenerativeModel({ model: 'gemini-embedding-001' });
    const result = await model.embedContent(query);
    const queryEmbedding = result.embedding.values;

    if (this.vectorSearchMode === 'atlas') {
      return this.searchAtlas(tenantId, queryEmbedding);
    }
    return this.searchLocal(tenantId, queryEmbedding);
  }

  private async searchAtlas(tenantId: string, queryEmbedding: number[]): Promise<string> {
    const pipeline = [
      {
        $vectorSearch: {
          index: 'vector_index',
          path: 'embedding',
          queryVector: queryEmbedding,
          numCandidates: 100,
          limit: 3,
          filter: { tenantId },
        },
      },
      {
        $project: {
          content: 1,
          score: { $meta: 'vectorSearchScore' },
        },
      },
    ];

    try {
      const scoredDocs = await this.knowledgeModel.aggregate(pipeline);
      return scoredDocs.map((doc) => doc.content).join('\n\n');
    } catch (error) {
      this.logger.error('Atlas vector search failed (is the vector_index created?):', error);
      return '';
    }
  }

  private async searchLocal(tenantId: string, queryEmbedding: number[]): Promise<string> {
    try {
      const docs = await this.knowledgeModel
        .find({ tenantId })
        .select('content embedding')
        .exec();

      if (docs.length === 0) return '';

      if (docs.length > 5000) {
        this.logger.warn(
          `Tenant ${tenantId} has ${docs.length} knowledge docs. ` +
          `Consider switching to VECTOR_SEARCH_MODE=atlas for better performance.`,
        );
      }

      const scored = docs
        .map((doc) => ({
          content: doc.content,
          score: this.cosineSimilarity(queryEmbedding, doc.embedding as number[]),
        }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 3);

      return scored.map((doc) => doc.content).join('\n\n');
    } catch (error) {
      this.logger.error('Local vector search failed:', error);
      return '';
    }
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    let dot = 0, normA = 0, normB = 0;
    for (let i = 0; i < a.length; i++) {
      dot += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    return dot / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  async findAll(tenantId: string) {
    return this.knowledgeModel.find({ tenantId }).select('-embedding').exec();
  }

  async remove(id: string, tenantId: string) {
    const doc = await this.knowledgeModel.findById(id).exec();
    if (!doc || doc.tenantId.toString() !== tenantId.toString()) {
      throw new ForbiddenException('Access denied');
    }
    return this.knowledgeModel.findByIdAndDelete(id).exec();
  }
}