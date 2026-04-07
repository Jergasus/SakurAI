import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ToolRegistryService } from './tool-registry.service';

@ApiTags('Tools')
@Controller('tools')
export class ToolsController {
  constructor(private readonly toolRegistryService: ToolRegistryService) {}

  @Get()
  getAllTools() {
    return this.toolRegistryService.getAllToolsMetadata();
  }
}
