import {
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { Tenant, TenantDocument } from '../schemas/tenant.schema';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(Tenant.name) private tenantModel: Model<TenantDocument>,
    private jwtService: JwtService,
  ) {}

  async login(email: string, pass: string) {
    const tenant = await this.tenantModel.findOne({ email });
    if (!tenant) throw new UnauthorizedException('Invalid credentials');

    const isMatch = await bcrypt.compare(pass, tenant.password);
    if (!isMatch) throw new UnauthorizedException('Invalid credentials');

    const payload = { sub: tenant._id, email: tenant.email };
    return {
      access_token: await this.jwtService.signAsync(payload),
      tenantId: tenant._id,
      name: tenant.name,
    };
  }
}
