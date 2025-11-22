import React from 'react';
import { z, ZodObject } from 'zod';
import {
  Input,
  InputNumber,
  Select,
  Radio,
  DatePicker,
  Checkbox,
  Rate,
  Slider,
  Switch,
} from '@arco-design/web-react';

import { ToolForm } from './type';

class FieldManager {
  private fieldMap = new Map<
    keyof ToolForm.ItemComponent,
    {
      propsDesc: ZodObject;
      component: React.FC<any>;
    }
  >();

  use(
    type: keyof ToolForm.ItemComponent,
    propsDesc: ZodObject,
    component: React.FC<any>
  ) {
    this.fieldMap.set(type, { propsDesc, component });
    return this;
  }

  getComponent(type: keyof ToolForm.ItemComponent) {
    return this.fieldMap.get(type)?.component;
  }

  getAllDescription() {
    const keys = [...this.fieldMap.keys()];

    return keys.map((key) => {
      const p = this.fieldMap.get(key)?.propsDesc;

      return z.object({
        type: z.literal(key),
        props: p,
      });
    });
  }
}

const fieldManager = new FieldManager();
fieldManager.use(
  'string',
  z.object({
    allowClear: z.boolean().nullable(),
    placeholder: z.string().nullable(),
    size: z.enum(['mini', 'small', 'default', 'large']).nullable(),
  }),
  Input
);
fieldManager.use(
  'textarea',
  z.object({
    placeholder: z.string().nullable(),
    autoSize: z
      .union([
        z.object({
          minRows: z.number().nullable(),
          maxRows: z.number().nullable(),
        }),
        z.boolean(),
      ])
      .nullable(),
  }),
  Input.TextArea
);
fieldManager.use(
  'password',
  z.object({
    allowClear: z.boolean().nullable(),
    placeholder: z.string().nullable(),
    size: z.enum(['mini', 'small', 'default', 'large']).nullable(),
    visibilityToggle: z
      .boolean()
      .nullable()
      .describe('是否显示切换密码可见状态的按钮'),
  }),
  Input.Password
);
fieldManager.use(
  'number',
  z.object({
    placeholder: z.string().nullable(),
    hideControl: z.boolean().nullable().describe('是否隐藏右侧按钮'),
    max: z.number().nullable().describe('最大值'),
    min: z.number().nullable().describe('最小值'),
    precision: z.number().nullable().describe('精度'),
    step: z.number().nullable().describe('步长'),
    size: z.enum(['mini', 'small', 'default', 'large']).nullable(),
  }),
  InputNumber
);
fieldManager.use(
  'select',
  z.object({
    allowClear: z.boolean().nullable(),
    defaultActiveFirstOption: z
      .boolean()
      .nullable()
      .describe('是否默认激活第一个选项'),
    placeholder: z.string().nullable(),
    mode: z.enum(['multiple', 'tags']).nullable(),
    size: z.enum(['mini', 'small', 'default', 'large']).nullable(),
    options: z.array(
      z.object({
        label: z.string().describe('选项标签'),
        value: z.string().describe('选项值'),
      })
    ),
  }),
  Select
);
fieldManager.use(
  'radio',
  z.object({
    direction: z.enum(['horizontal', 'vertical']).nullable(),
    size: z.enum(['mini', 'small', 'default', 'large']).nullable(),
    type: z.enum(['button', 'radio']).nullable(),
    options: z.array(
      z.object({
        label: z.string().describe('选项标签'),
        value: z.string().describe('选项值'),
      })
    ),
  }),
  Radio.Group
);
fieldManager.use(
  'date',
  z.object({
    allowClear: z.boolean().nullable(),
    editable: z.boolean().nullable().describe('是否可输入'),
    size: z.enum(['mini', 'small', 'default', 'large']).nullable(),
    placeholder: z.string().nullable(),
    showTime: z.boolean().nullable().describe('是否显示时间选择器'),
    showNowBtn: z.boolean().nullable().describe('是否显示现在按钮'),
    format: z.string().nullable().describe('日期格式'),
  }),
  DatePicker as any
);
fieldManager.use(
  'checkbox',
  z.object({
    direction: z.enum(['horizontal', 'vertical']).nullable(),
    options: z.array(
      z.object({
        label: z.string().describe('选项标签'),
        value: z.string().describe('选项值'),
      })
    ),
  }),
  Checkbox.Group
);
fieldManager.use(
  'rate',
  z.object({
    allowClear: z.boolean().nullable(),
    allowHalf: z.boolean().nullable(),
    grading: z.boolean().nullable().describe('是否启用笑脸分级'),
    count: z.number().nullable().describe('评分数量'),
    tooltips: z.array(z.string()).nullable().describe('评分提示'),
  }),
  Rate
);
fieldManager.use(
  'slider',
  z.object({
    showTicks: z.boolean().nullable().describe('是否显示刻度'),
    tooltipVisible: z.boolean().nullable().describe('是否一直显示提示'),
    vertical: z.boolean().nullable().describe('是否垂直方向'),
    max: z.number().nullable().describe('最大值'),
    min: z.number().nullable().describe('最小值'),
    step: z.number().nullable().describe('步长'),
  }),
  Slider
);
fieldManager.use(
  'switch',
  z.object({
    size: z.enum(['small', 'default']).nullable(),
    type: z.enum(['circle', 'round', 'line']).nullable(),
    checkedText: z.string().nullable().describe('打开时的文本'),
    uncheckedText: z.string().nullable().describe('关闭时的文本'),
  }),
  Switch
);

export default fieldManager;
