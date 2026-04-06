import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type TenantDocument = HydratedDocument<Tenant>;

@Schema({ timestamps: true })
export class Tenant {
  @Prop({ required: true, unique: true })
  name: string;

  @Prop({ required: true, default: 'restaurant' })
  niche: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({ required: true, unique: true })
  apiKey: string;

  @Prop({ default: 'You are a helpful and polite assistant.' })
  systemPrompt: string;

  @Prop({ default: '#2563EB' })
  primaryColor: string;

  @Prop({ default: 'Virtual Assistant' })
  chatTitle: string;

  @Prop({ type: [String], default: [] })
  allowedTools: string[];
}

export const TenantSchema = SchemaFactory.createForClass(Tenant);