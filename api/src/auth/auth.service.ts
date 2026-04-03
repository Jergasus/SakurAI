import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { JwtService } from '@nestjs/jwt';
import { Tenant, TenantDocument } from '../schemas/tenant.schema';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(Tenant.name) private tenantModel: Model<TenantDocument>,
    private jwtService: JwtService,
  ) {}

  // 1. REGISTRO
  async register(name: string, email: string, pass: string, niche: string = 'restaurant') {
    // Comprobamos si el email ya existe
    const existingUser = await this.tenantModel.findOne({ email });
    if (existingUser) throw new ConflictException('Email already in use');

    // Encriptamos la contraseña
    const hashedPassword = await bcrypt.hash(pass, 10);

    // Creamos el cliente Y le generamos su API Key automáticamente
    const newTenant = new this.tenantModel({
      name,
      email,
      niche,
      password: hashedPassword,
      apiKey: 'sk_' + crypto.randomBytes(24).toString('hex'), // <--- ¡AÑADIMOS ESTO!
    });

    await newTenant.save();
    return { message: 'User registered successfully' };
  }

  // 2. LOGIN
  async login(email: string, pass: string) {
    // Buscamos al usuario
    const tenant = await this.tenantModel.findOne({ email });
    if (!tenant) throw new UnauthorizedException('Invalid credentials');

    // Comparamos la contraseña encriptada
    const isMatch = await bcrypt.compare(pass, tenant.password);
    if (!isMatch) throw new UnauthorizedException('Invalid credentials');

    // Generamos el Token JWT (El pase VIP)
    const payload = { sub: tenant._id, email: tenant.email };
    return {
      access_token: await this.jwtService.signAsync(payload),
      tenantId: tenant._id,
      name: tenant.name,
    };
  }
}
