import { Controller, Get, Post, Body, Patch, Param, UseGuards, Req, ForbiddenException } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { TenantsService } from './tenants.service';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { AuthGuard } from '../auth/auth.guard';

@ApiTags('Tenants')
@Controller('tenants')
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @Post()
  create(@Body() createTenantDto: CreateTenantDto) {
    return this.tenantsService.create(createTenantDto);
  }

  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @Get()
  findOwn(@Req() req: any) {
    return this.tenantsService.findById(req.user.sub);
  }

  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateData: UpdateTenantDto, @Req() req: any) {
    if (id !== req.user.sub) throw new ForbiddenException('You can only update your own tenant');
    return this.tenantsService.update(id, updateData);
  }

  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @Patch(':id/account')
  updateAccount(@Param('id') id: string, @Body() payload: { email?: string; currentPassword?: string; newPassword?: string }, @Req() req: any) {
    if (id !== req.user.sub) throw new ForbiddenException('You can only update your own account');
    return this.tenantsService.updateAccount(id, payload);
  }

  @Get('public/:apiKey')
  getPublicConfig(@Param('apiKey') apiKey: string) {
    return this.tenantsService.findByApiKey(apiKey);
  }
}