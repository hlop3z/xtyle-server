import xtyle from "../dist/index.js";

const demoData = (name) => {
  return {
    name: name,
    theme: "demo",
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

xtyle.component(data[0]).then((result) => {
  console.log(result);
});

/*
xtyle
  .plugin({
    name: "my_plugin",
    components: data,
  })
  .then((result) => {
    console.log(result);
  });
*/
