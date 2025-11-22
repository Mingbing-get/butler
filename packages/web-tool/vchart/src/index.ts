import { z } from 'zod';
import { toolManager } from '@butler/web-ai';
import RenderChart from './render';

import '@butler/web-react-chat';

export { RenderChart };

declare module '@butler/web-ai' {
  namespace AIChat {
    export namespace FunctionTool {
      export interface PluginMap {
        vChart: {};
      }
    }
  }
}

export function addVChartTool() {
  toolManager.add(
    {
      name: 'vChart',
      description: 'Render a chart using VChart',
      parameters: z.object({
        spec: z.object({
          type: z.enum(['line', 'bar', 'area']).describe('The chart type'),
          xField: z.string().describe('The field name for x-axis'),
          yField: z.string().describe('The field name for y-axis'),
          data: z
            .object({
              values: z.array(z.any()).describe('The data values'),
            })
            .describe('The data for the chart'),
        }).describe(`The VChart spec.
            example: {
              type: 'line',
              xField: 'x',
              yField: 'y',
              data: {
                values: [
                  { x: 'A', y: 5 },
                  { x: 'B', y: 2 },
                  { x: 'C', y: 4 },
                ],
              },
            }`),
      }),
    },
    {
      type: 'function-render',
      render: RenderChart,
    }
  );
}
