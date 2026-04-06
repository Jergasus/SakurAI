import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { Tenant, TenantDocument } from '../schemas/tenant.schema';
import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class TenantsService {
  // Aquí "inyectamos" el modelo de Mongoose que creamos antes
  constructor(
    @InjectModel(Tenant.name) private tenantModel: Model<TenantDocument>,
  ) {}

  // Función para CREAR un agente
  async create(createTenantDto: CreateTenantDto) {
    
    // 1. Generamos una API Key súper segura (estilo Stripe u OpenAI)
    // Ejemplo de resultado: sk_a1b2c3d4e5f6...
    const generatedApiKey = 'sk_' + crypto.randomBytes(24).toString('hex');

    // 2. Juntamos los datos que mandó Angular + la API Key generada
    const newTenant = new this.tenantModel({
      ...createTenantDto,
      apiKey: generatedApiKey,
    });

    // 3. Lo guardamos físicamente en MongoDB y devolvemos el resultado
    return await newTenant.save();
  }

  // Nueva función para ACTUALIZAR un agente
  async update(id: string, updateData: any) {
    // Hemos cambiado 'new: true' por 'returnDocument: "after"'
    return await this.tenantModel.findByIdAndUpdate(id, updateData, { returnDocument: 'after' }).exec();
  }

  async findById(id: string) {
    return await this.tenantModel.findById(id).select('-password').exec();
  }

  // Public lookup by API Key — excludes sensitive fields
  async findByApiKey(apiKey: string) {
    return await this.tenantModel.findOne({ apiKey }).select('-password -email').exec();
  }

  async updateAccount(id: string, payload: { email?: string; currentPassword?: string; newPassword?: string }) {
    const tenant = await this.tenantModel.findById(id);
    if (!tenant) throw new BadRequestException('Tenant not found');

    if (payload.email && payload.email !== tenant.email) {
      const existing = await this.tenantModel.findOne({ email: payload.email });
      if (existing) throw new BadRequestException('Email already in use');
      tenant.email = payload.email;
    }

    if (payload.newPassword) {
      if (!payload.currentPassword) {
        throw new BadRequestException('Current password is required');
      }
      const isMatch = await bcrypt.compare(payload.currentPassword, tenant.password);
      if (!isMatch) throw new UnauthorizedException('Current password is incorrect');
      tenant.password = await bcrypt.hash(payload.newPassword, 10);
    }

    await tenant.save();
    return { message: 'Account updated successfully' };
  }
}