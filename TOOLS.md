# Creating Custom Tools

Tools give your AI agent the ability to **do things** beyond just answering questions — check a database, call an API, perform calculations, etc. When the AI decides it needs to use a tool, it calls it automatically and incorporates the result into its response.

## How Tools Work

1. You define a tool with a name, description, and parameters
2. You register it in the tool registry
3. You enable it for your agent in the admin dashboard (Skills section)
4. When a user asks something relevant, Gemini automatically calls your tool and uses the result

## Step-by-Step: Create a Tool

### 1. Create the tool file

Create a new file in `api/src/tools/implementations/`. For example, `weather.tools.ts`:

```typescript
import { SchemaType } from '@google/generative-ai';
import { AgentTool } from '../interfaces/tool.interface';

export const weatherTools: AgentTool[] = [
  {
    id: 'get_weather',           // Unique ID — used to enable/disable in the dashboard
    icon: '🌤️',                  // Shown in the admin dashboard
    displayName: 'Check Weather', // Human-readable name
    declaration: {
      name: 'get_weather',       // Function name Gemini will call
      description: 'Gets the current weather for a given city.', // Helps Gemini decide when to use it
      parameters: {
        type: SchemaType.OBJECT,
        properties: {
          city: {
            type: SchemaType.STRING,
            description: 'The city name (e.g., New York, London)',
          },
        },
        required: ['city'],
      },
    },
    execute: async (args, context) => {
      // `args` contains the parameters Gemini filled in
      // `context` contains { tenantId: string }
      
      const city = args['city'];
      
      // Your logic here — call an API, query a database, etc.
      const response = await fetch(
        `https://api.weatherapi.com/v1/current.json?key=YOUR_KEY&q=${city}`
      );
      const data = await response.json();
      
      // Return an object — Gemini will read this and formulate a response
      return {
        city: city,
        temperature: data.current.temp_c,
        condition: data.current.condition.text,
      };
    },
  },
];
```

### 2. Register the tool

Open `api/src/tools/tool-registry.service.ts` and add your import + registration:

```typescript
import { Injectable } from '@nestjs/common';
import { FunctionDeclaration } from '@google/generative-ai';
import { AgentTool } from './interfaces/tool.interface';
import { weatherTools } from './implementations/weather.tools';  // Add this

@Injectable()
export class ToolRegistryService {
  private tools = new Map<string, AgentTool>();

  constructor() {
    weatherTools.forEach(tool => this.registerTool(tool));  // Add this
  }

  // ... rest of the file stays the same
```

### 3. Enable it in the dashboard

> [!IMPORTANT]
> After adding or modifying tools, you must restart the API container for changes to take effect.

1. Restart the API (`docker-compose restart api`)
2. Go to the admin dashboard → **Skills (Tools)**
3. Your new tool will appear — check the box to enable it
4. Click **Save Changes**

### 4. Test it

Open the chat widget and ask something that should trigger the tool:
> "What's the weather in London?"

The AI will call `get_weather` with `{ city: "London" }`, receive the result, and give a natural-language response.

## The AgentTool Interface

```typescript
interface AgentTool {
  id: string;                    // Unique identifier
  icon?: string;                 // Emoji for the dashboard
  displayName?: string;          // Human-readable name
  declaration: FunctionDeclaration; // Gemini function declaration (name, description, parameters)
  execute: (
    args: any,                   // Parameters filled by Gemini
    context: {
      tenantId: string;          // The current tenant's ID
      [key: string]: any;        // Extensible for custom context
    }
  ) => Promise<any>;             // Return value is sent back to Gemini
}
```

## Tips

> [!TIP]
> Write good descriptions — Gemini uses the `description` field to decide when to call the tool. Be specific: *"Checks real-time inventory for a product in the warehouse database"* is better than *"Checks stock."*

- **Keep return values simple.** Return plain objects with descriptive keys. Gemini reads the JSON and turns it into a natural response.
- **Handle errors gracefully.** If your API call fails, return `{ error: "Could not fetch weather data" }` instead of throwing — Gemini will tell the user something went wrong.
- **Multiple tools in one file.** Export an array, so you can group related tools together (e.g., `get_weather` and `get_forecast` in the same file).
- **Access external services.** Tools can call any API, query databases, read files, or do anything Node.js can do.
