import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TenantsService } from './tenants.service';
import { TenantsController } from './tenants.controller';
// Importamos el molde que creaste en el paso anterior
import { Tenant, TenantSchema } from '../schemas/tenant.schema'; 

@Module({
  imports: [
    // Aquí le "registramos" el molde a MongoDB para que pueda usarlo
    MongooseModule.forFeature([{ name: Tenant.name, schema: TenantSchema }])
  ],
  controllers: [TenantsController],
  providers: [TenantsService],
  exports: [TenantsService], // Exportamos el servicio para usarlo en otras partes de la app
})
export class TenantsModule {}