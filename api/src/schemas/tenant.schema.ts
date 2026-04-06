import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

// Esto le dice a TypeScript cómo se verá un "Documento" de esta colección
export type TenantDocument = HydratedDocument<Tenant>;

@Schema({ timestamps: true }) // Automáticamente añade 'createdAt' y 'updatedAt'
export class Tenant {
  @Prop({ required: true, unique: true })
  name: string; // Ejemplo: "Floristería Pepe"

  // 👉 NUEVO: Nicho de negocio
  @Prop({ required: true, default: 'restaurant' })
  niche: string;

  // 👉 NUEVO: Email único para hacer login
  @Prop({ required: true, unique: true })
  email: string;

  // 👉 NUEVO: Contraseña encriptada
  @Prop({ required: true })
  password: string;

  @Prop({ required: true, unique: true })
  apiKey: string; // Una clave secreta única para que el frontend de Pepe se conecte

  @Prop({ default: 'You are a helpful and polite assistant.' })
  systemPrompt: string;

  // 👉 NUEVO: Personalización del Widget
  @Prop({ default: '#2563EB' }) // Azul por defecto
  primaryColor: string;

  @Prop({ default: 'Virtual Assistant' })
  chatTitle: string;

  // Aquí está la clave de tu idea de "2 clicks": Las herramientas activas
  @Prop({ type: [String], default: [] })
  allowedTools: string[]; // Ejemplo: ['rag_search', 'check_stock']
}

// Generamos el esquema real que Mongoose utilizará
export const TenantSchema = SchemaFactory.createForClass(Tenant);