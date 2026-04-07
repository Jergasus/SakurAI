import { Controller, Post, Body, Get, Delete, Param, UseGuards, Req, UseInterceptors, UploadedFile, BadRequestException, Logger } from '@nestjs/common';
import { KnowledgeService } from './knowledge.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '../auth/auth.guard';
import { IngestTextDto } from './dto/ingest-text.dto';
const pdfParse = require('pdf-parse');
import * as mammoth from 'mammoth';

@ApiTags('Knowledge')
@ApiBearerAuth()
@Controller('knowledge')
@UseGuards(AuthGuard)
export class KnowledgeController {
  private readonly logger = new Logger(KnowledgeController.name);

  constructor(private readonly knowledgeService: KnowledgeService) {}

  @Post()
  async create(@Body() dto: IngestTextDto, @Req() req: any) {
    return this.knowledgeService.ingestText(req.user.sub, dto.content);
  }

  @Get()
  async findAll(@Req() req: any) {
    return this.knowledgeService.findAll(req.user.sub);
  }

  @Delete()
  async removeAll(@Req() req: any) {
    return this.knowledgeService.removeAll(req.user.sub);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Req() req: any) {
    return this.knowledgeService.remove(id, req.user.sub);
  }

  private chunkText(text: string, maxCharLength: number): string[] {
    const chunks: string[] = [];
    const sentences = text.split(/(?<=\.)\s+|\n+/);
    let currentChunk = '';

    for (const sentence of sentences) {
      if (currentChunk.length + sentence.length > maxCharLength && currentChunk.length > 0) {
        chunks.push(currentChunk.trim());
        currentChunk = '';
      }
      currentChunk += sentence + ' ';
    }

    if (currentChunk.trim().length > 0) {
      chunks.push(currentChunk.trim());
    }

    return chunks;
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 10 * 1024 * 1024 } })) // 10 MB max
  async uploadDocument(
    @UploadedFile() file: Express.Multer.File,
    @Req() req: any,
  ) {
    const tenantId = req.user.sub;
    if (!file) {
      throw new BadRequestException('No file was uploaded.');
    }

    let extractedText = '';

    try {
      const ext = file.originalname?.toLowerCase().split('.').pop();

      if (file.mimetype === 'application/pdf') {
        const pdfData = await pdfParse(file.buffer);
        extractedText = pdfData.text.replace(/\s+/g, ' ').trim();
      } else if (file.mimetype === 'text/markdown' || ext === 'md') {
        extractedText = file.buffer.toString('utf-8').trim();
      } else if (file.mimetype === 'text/plain' || ext === 'txt') {
        extractedText = file.buffer.toString('utf-8').trim();
      } else if (file.mimetype === 'application/json' || ext === 'json') {
        extractedText = file.buffer.toString('utf-8').trim();
      } else if (file.mimetype === 'text/csv' || ext === 'csv') {
        extractedText = file.buffer.toString('utf-8').trim();
      } else if (file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || ext === 'docx') {
        const result = await mammoth.extractRawText({ buffer: file.buffer });
        extractedText = result.value.trim();
      } else {
        throw new BadRequestException('Unsupported format. Supported: PDF, Markdown, TXT, JSON, CSV, DOCX.');
      }

      this.logger.log(`${(ext || 'unknown').toUpperCase()} processed: ${extractedText.length} characters extracted`);

      const chunks = this.chunkText(extractedText, 1000);
      const batchSize = 5;

      for (let i = 0; i < chunks.length; i += batchSize) {
        const batch = chunks.slice(i, i + batchSize);

        await Promise.all(
          batch.map(chunk => this.knowledgeService.ingestText(tenantId, chunk))
        );
        
        this.logger.log(`Processed ${Math.min(i + batchSize, chunks.length)} of ${chunks.length} chunks`);
      }

      return {
        message: 'File processed and ingested into the AI knowledge base',
        chars: extractedText.length,
        chunks: chunks.length
      };

    } catch (error) {
      this.logger.error('Error processing uploaded file:', error);
      throw new BadRequestException('Could not process the file. Is it corrupted?');
    }
  }
}