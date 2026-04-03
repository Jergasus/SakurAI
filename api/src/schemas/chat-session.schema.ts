import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ChatSessionDocument = ChatSession & Document;

@Schema({ timestamps: true })
export class ChatSession {
  @Prop({ required: true, unique: true })
  sessionId: string;

  @Prop({ required: true })
  tenantId: string;

  @Prop({ type: String, default: '' })
  summary: string;

  @Prop({ type: Array, default: [] })
  history: any[];
}

export const ChatSessionSchema = SchemaFactory.createForClass(ChatSession);
