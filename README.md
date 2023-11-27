# xtyle-server

Xtyle Util Server

## File | `index.js`

```js
import xtyle from "xtyle-server";

const port = process.env.PORT || 3000;

xtyle.server(port);
```

## File | `package.json`

```json
{
  "scripts": {
    "app": "node index.js"
  }
}
```

## Utils

```js
import xtyle from "xtyle-server";

xtyle.minify(`/* JS CODE */`);
xtyle.tsx(`/* TSX Render */`);
xtyle.css(`/* SCSS Minify */`);
```

## Component

```js
import xtyle from "xtyle-server";

const example = {
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
   * Component - This is a my component.
   */
      `,
};

// Usage
xtyle.component({
  name: "kebab-case-name",
  code: example.code,
  style: example.style,
  props: example.props,
  docs: example.docs,
});
```

## Plugin

```js
import xtyle from "xtyle-server";

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
   * Component - This is a my component.
   */
      `,
  };
};

const components = [demoData("custom-div"), demoData("button")];
const install_code = {
  init: `export default [() => console.log("Plugin INIT")]`,
};

xtyle.plugin("myPlugin", components, install_code);
```
