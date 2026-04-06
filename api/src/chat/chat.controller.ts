import { Controller, Post, Body, Headers, Get, Param, UseGuards, Delete, Req, ForbiddenException } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { ChatService } from './chat.service';
import { AuthGuard } from '../auth/auth.guard';
import { SendMessageDto } from './dto/send-message.dto';

@ApiTags('Chat')
@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post()
  @Throttle({ default: { ttl: 60000, limit: 20 } }) // 20 messages per minute per IP
  async chat(
    @Headers('x-api-key') apiKey: string,
    @Body() dto: SendMessageDto,
  ) {
    return this.chatService.sendMessage(apiKey, dto.message, dto.sessionId);
  }

  @Get('history/:sessionId')
  async getHistory(
    @Param('sessionId') sessionId: string,
    @Headers('x-api-key') apiKey: string,
  ) {
    return this.chatService.getSessionHistory(sessionId, apiKey);
  }

  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @Get('analytics/:tenantId')
  async getAnalytics(@Param('tenantId') tenantId: string, @Req() req: any) {
    if (tenantId !== req.user.sub) throw new ForbiddenException('You can only view your own analytics');
    return this.chatService.getAnalytics(tenantId);
  }

  @Delete('history/:sessionId')
  async deleteHistory(
    @Param('sessionId') sessionId: string,
    @Headers('x-api-key') apiKey: string,
  ) {
    return this.chatService.deleteSessionHistory(sessionId, apiKey);
  }
}
