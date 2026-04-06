import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { TenantsModule } from './tenants/tenants.module';
import { ChatModule } from './chat/chat.module';
import { Knowledge, KnowledgeSchema } from './schemas/knowledge.schema';
import { KnowledgeModule } from './knowledge/knowledge.module';
import { AuthModule } from './auth/auth.module';
import { BootstrapModule } from './bootstrap/bootstrap.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../.env'],
    }),

    MongooseModule.forRoot(process.env.MONGO_URI!),

    ThrottlerModule.forRoot([{
      ttl: parseInt(process.env.THROTTLE_TTL || '60000', 10),
      limit: parseInt(process.env.THROTTLE_LIMIT || '60', 10),
    }]),

    MongooseModule.forFeature([{ name: Knowledge.name, schema: KnowledgeSchema }]),

    TenantsModule,
    ChatModule,
    KnowledgeModule,
    AuthModule,
    BootstrapModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    }
  ],
})
export class AppModule {}
