import {
  FormProps,
  FormItemProps,
  InputProps,
  TextAreaProps,
  InputNumberProps,
  SelectProps,
  RadioGroupProps,
  DatePickerProps,
  CheckboxGroupProps,
  RateProps,
  SliderProps,
  SwitchProps,
} from '@arco-design/web-react';

export namespace ToolForm {
  export interface ItemComponent {
    string: InputProps;
    password: InputProps & {
      defaultVisibility?: boolean;
      visibility?: boolean;
      visibilityToggle?: boolean;
      onVisibilityChange?: (visible: boolean) => void;
    };
    textarea: TextAreaProps;
    number: InputNumberProps;
    select: SelectProps;
    radio: RadioGroupProps;
    date: DatePickerProps;
    checkbox: CheckboxGroupProps<string>;
    rate: RateProps;
    slider: SliderProps;
    switch: SwitchProps;
  }

  export interface ItemProps extends Omit<FormItemProps, 'field'> {
    name: string;
    component: {
      [K in keyof ItemComponent]: {
        type: K;
        props?: ItemComponent[K];
      };
    }[keyof ItemComponent];
  }

  export interface Props extends FormProps {
    fields: ItemProps[];
    value?: Record<string, any>;
  }
}
