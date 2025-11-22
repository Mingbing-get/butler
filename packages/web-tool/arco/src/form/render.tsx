import { Form, Button } from '@arco-design/web-react';
import fieldManager from './fieldManager';

import { ToolForm } from './type';
import { useCallback } from 'react';

const FormItem = Form.Item;

export default function ArcoForm({
  fields,
  title,
  layout = 'vertical',
  initialValues,
  ...props
}: ToolForm.Props) {
  const [formInstance] = Form.useForm();

  const handleSubmit = useCallback(async () => {
    await formInstance.validate();
    props.onSubmit?.(formInstance.getFieldsValue());
  }, [props.onSubmit]);

  return (
    <div style={{ maxWidth: '100%', width: 560 }}>
      <h4 style={{ marginBottom: '1rem', textAlign: 'center' }}>{title}</h4>
      <Form
        {...props}
        initialValues={props.value || initialValues}
        layout={layout}
        form={formInstance}
      >
        {fields.map((item) => {
          const { component, ...reset } = item;
          const Component = fieldManager.getComponent(component.type);

          if (!Component) {
            throw new Error(`Component ${component} is not registered`);
          }

          return (
            <FormItem {...reset} key={reset.name} field={reset.name}>
              <Component {...component.props} />
            </FormItem>
          );
        })}
        <FormItem style={{ textAlign: 'center' }}>
          <Button
            disabled={!!props.value}
            onClick={handleSubmit}
            type="primary"
          >
            提交
          </Button>
        </FormItem>
      </Form>
    </div>
  );
}
