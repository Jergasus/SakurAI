import { Controller, Get, Post, Body, Patch, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { TenantsService } from './tenants.service';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { AuthGuard } from '../auth/auth.guard';

@ApiTags('Tenants')
@Controller('tenants')
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  // Cuando Angular haga un POST a /tenants, ejecutamos esto:
  @UseGuards(AuthGuard)
  @Post()
  create(@Body() createTenantDto: CreateTenantDto) {
    // Le pasamos el paquete de datos al "trabajador" (Service)
    return this.tenantsService.create(createTenantDto);
  }

  // Cuando Angular haga un GET a /tenants, devolvemos la lista de clientes:
  @UseGuards(AuthGuard)
  @Get()
  findAll() {
    return this.tenantsService.findAll();
  }

  // 👉 NUEVA RUTA PARA EDITAR (PATCH /tenants/id)
  @UseGuards(AuthGuard)
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateData: any) {
    return this.tenantsService.update(id, updateData);
  }

  @UseGuards(AuthGuard)
  @Patch(':id/account')
  updateAccount(@Param('id') id: string, @Body() payload: { email?: string; currentPassword?: string; newPassword?: string }) {
    return this.tenantsService.updateAccount(id, payload);
  }

  @Get('public/:apiKey')
  getPublicConfig(@Param('apiKey') apiKey: string) {
    return this.tenantsService.findByApiKey(apiKey);
  }
}