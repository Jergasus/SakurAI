import { Controller, Get, Query } from '@nestjs/common';
import { ToolRegistryService } from './tool-registry.service';

@Controller('tools')
export class ToolsController {
  constructor(private readonly toolRegistryService: ToolRegistryService) {}

  @Get()
  getAllTools(@Query('niche') niche?: string) {
    return this.toolRegistryService.getAllToolsMetadata(niche);
  }
}
