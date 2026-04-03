import { Controller, Post, Body, Headers, Get, Param, UseGuards, Delete } from '@nestjs/common';
import { ChatService } from './chat.service';
import { AuthGuard } from '../auth/auth.guard';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post()
  async chat(
    @Headers('x-api-key') apiKey: string,
    @Body('message') message: string,
    @Body('sessionId') sessionId: string,
  ) {
    return this.chatService.sendMessage(apiKey, message, sessionId);
  }

  @Get('history/:sessionId')
  async getHistory(@Param('sessionId') sessionId: string) {
    return this.chatService.getSessionHistory(sessionId);
  }

  @UseGuards(AuthGuard)
  @Get('analytics/:tenantId')
  async getAnalytics(@Param('tenantId') tenantId: string) {
    return this.chatService.getAnalytics(tenantId);
  }

  @Delete('history/:sessionId')
  async deleteHistory(@Param('sessionId') sessionId: string) {
    return this.chatService.deleteSessionHistory(sessionId);
  }
}
