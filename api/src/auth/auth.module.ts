import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { Tenant, TenantSchema } from '../schemas/tenant.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Tenant.name, schema: TenantSchema }]),
    JwtModule.registerAsync({
      global: true,
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const secret = config.get<string>('JWT_SECRET');
        if (!secret) {
          if (process.env.NODE_ENV === 'production') {
            throw new Error('JWT_SECRET environment variable is required in production');
          }
          // Only allow default in development
          return { secret: 'change-me-in-production', signOptions: { expiresIn: '1d' } };
        }
        return { secret, signOptions: { expiresIn: '1d' } };
      },
    }),
  ],
  providers: [AuthService],
  controllers: [AuthController]
})
export class AuthModule {}