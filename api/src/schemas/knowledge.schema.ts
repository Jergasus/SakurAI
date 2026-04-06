import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type KnowledgeDocument = HydratedDocument<Knowledge>;

@Schema({ timestamps: true })
export class Knowledge {
  // 1. FUNDAMENTAL: A quién pertenece esta información
  @Prop({ required: true, index: true })
  tenantId: string; // Guardaremos el ID de la Floristería Pepe aquí

  // 2. El texto real que la IA debe leer
  @Prop({ required: true })
  content: string; // Ej: "Oferta San Valentín: Ramo de Rosas Rojas a 25€"

  // 3. LA MAGIA DEL RAG: El Vector
  // Guardamos un array de números que representa el significado del texto
  @Prop({ type: [Number] })
  embedding: number[]; 
}

export const KnowledgeSchema = SchemaFactory.createForClass(Knowledge);