import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { Tenant, TenantDocument } from '../schemas/tenant.schema';
import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class TenantsService {
  constructor(
    @InjectModel(Tenant.name) private tenantModel: Model<TenantDocument>,
  ) {}

  async create(createTenantDto: CreateTenantDto) {
    const generatedApiKey = 'sk_' + crypto.randomBytes(24).toString('hex');

    const newTenant = new this.tenantModel({
      ...createTenantDto,
      apiKey: generatedApiKey,
    });

    return await newTenant.save();
  }

  async update(id: string, updateData: any) {
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
      if (payload.newPassword.length < 6) {
        throw new BadRequestException('New password must be at least 6 characters');
      }
      const isMatch = await bcrypt.compare(payload.currentPassword, tenant.password);
      if (!isMatch) throw new UnauthorizedException('Current password is incorrect');
      tenant.password = await bcrypt.hash(payload.newPassword, 10);
    }

    await tenant.save();
    return { message: 'Account updated successfully' };
  }
}