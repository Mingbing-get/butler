import { z } from 'zod';
import { toolManager } from '@butler/web-ai';
import '@butler/web-react-chat';

export * from './type';
import { default as fieldManager } from './fieldManager';
import { default as ArcoForm } from './render';

export { fieldManager, ArcoForm };

declare module '@butler/web-ai' {
  export namespace AIChat {
    export namespace FunctionTool {
      export interface PluginMap {
        'arco-form': {};
      }
    }
  }
}

export function addArcoFormTool() {
  toolManager.add(
    {
      name: 'arco-form',
      description: 'Render a form using arco-design form',
      parameters: z.object({
        title: z.string().nullable().describe('Title of the form'),
        labelAlign: z.enum(['left', 'right']).nullable(),
        size: z.enum(['mini', 'small', 'default', 'large']).nullable(),
        initialValues: z
          .record(z.string(), z.any())
          .nullable()
          .describe('Initial values of the form'),
        fields: z
          .array(
            z.object({
              name: z.string().describe('Name of the field'),
              component: z
                .union(fieldManager.getAllDescription())
                .describe('Input component of the field'),
              disabled: z.boolean().nullable(),
              required: z.boolean().nullable(),
              extra: z.string().nullable().describe('Extra text of the field'),
              help: z.string().nullable().describe('Help text of the field'),
              label: z.string().nullable().describe('Label text of the field'),
              rules: z.array(z.object({})).nullable(),
            })
          )
          .describe('Fields of the form'),
      }),
    },
    {
      type: 'function-render',
      render: ArcoForm,
      reportName: 'onSubmit',
      reportResultName: 'value',
    }
  );
}
