import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { Tenant, TenantDocument } from '../schemas/tenant.schema';

@Injectable()
export class BootstrapService implements OnApplicationBootstrap {
  private readonly logger = new Logger(BootstrapService.name);

  constructor(
    @InjectModel(Tenant.name) private tenantModel: Model<TenantDocument>,
  ) {}

  async onApplicationBootstrap() {
    const count = await this.tenantModel.countDocuments();
    if (count > 0) {
      this.logger.log(`Found ${count} existing tenant(s). Skipping bootstrap.`);
      return;
    }

    this.logger.log('No tenants found. Creating default admin...');

    const email = process.env.DEFAULT_ADMIN_EMAIL || 'admin@sakurai.com';
    const password = process.env.DEFAULT_ADMIN_PASSWORD || 'admin123';
    const name = process.env.DEFAULT_ADMIN_NAME || 'My Agent';
    const niche = process.env.DEFAULT_ADMIN_NICHE || 'restaurant';

    const hashedPassword = await bcrypt.hash(password, 10);
    const apiKey = 'sk_' + crypto.randomBytes(24).toString('hex');

    const tenant = new this.tenantModel({
      name,
      email,
      niche,
      password: hashedPassword,
      apiKey,
      systemPrompt: 'You are a helpful and polite assistant.',
      primaryColor: '#2563EB',
      chatTitle: 'AI Assistant',
      allowedTools: [],
    });

    await tenant.save();

    this.logger.log('================================================');
    this.logger.log('  DEFAULT ADMIN CREATED');
    this.logger.log(`  Email:    ${email}`);
    this.logger.log(`  Password: ${'*'.repeat(password.length)}`);
    this.logger.log(`  API Key:  ${apiKey.substring(0, 6)}...`);
    this.logger.log('================================================');
    this.logger.log('Default credentials: admin@sakurai.com / admin123');
    this.logger.log('Change these credentials after first login!');
  }
}
