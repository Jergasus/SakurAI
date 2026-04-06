import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type KnowledgeDocument = HydratedDocument<Knowledge>;

@Schema({ timestamps: true })
export class Knowledge {
  @Prop({ required: true, index: true })
  tenantId: string;

  @Prop({ required: true })
  content: string;

  @Prop({ type: [Number] })
  embedding: number[];
}

export const KnowledgeSchema = SchemaFactory.createForClass(Knowledge);