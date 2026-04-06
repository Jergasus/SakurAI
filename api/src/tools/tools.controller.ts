import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ToolRegistryService } from './tool-registry.service';

@ApiTags('Tools')
@Controller('tools')
export class ToolsController {
  constructor(private readonly toolRegistryService: ToolRegistryService) {}

  @Get()
  getAllTools(@Query('niche') niche?: string) {
    return this.toolRegistryService.getAllToolsMetadata(niche);
  }
}
