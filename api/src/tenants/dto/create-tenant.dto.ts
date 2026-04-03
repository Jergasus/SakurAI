export class CreateTenantDto {
  name: string;
  niche?: string;
  systemPrompt?: string;
  allowedTools?: string[];
}
