const demoData = (name) => {
  return {
    name: name,
    code: `
    export default function Component(props: Props = {}) {
      return (
        <div x-html {...props} class={[$NAME, props.class]}>
          {props.children}
        </div>
      );
    }
        `,
    style: `
    $color: red;
    .#{$NAME} { color: $color; }
        `,
    props: `
    type Props = {
      class?: string | string[] | object;
      style?: string | string[] | object;
      children?: any;
    };
    
    export default Props;
        `,
    docs: `
    /**
     * Component - This is my component.
     */
        `,
  };
};

const data = ["custom-div", "button"].map((name) => demoData(name));

export default data;
