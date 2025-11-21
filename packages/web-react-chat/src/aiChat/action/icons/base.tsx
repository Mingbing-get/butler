export interface IconProps
  extends Omit<
    React.SVGProps<SVGSVGElement>,
    'fill' | 'viewBox' | 'version' | 'xmlns'
  > {}

export default function BaseIcon(props: IconProps) {
  return (
    <svg
      {...props}
      width={props.width || '1rem'}
      fill="currentColor"
      viewBox="0 0 1024 1024"
      version="1.1"
      xmlns="http://www.w3.org/2000/svg"
    />
  );
}
