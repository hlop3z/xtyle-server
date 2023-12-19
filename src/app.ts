// @ts-nocheck
import { removeSemiColon, createDeclaration } from "./typing.js";

interface VarName {
  index: string;
  style: string;
}

type ComponentInput = {
  name?: string;
  code?: string;
  props?: string;
  style?: string;
  docs?: string;
  theme?: string;
};

type ComponentResult = {
  name: string;
  index: string;
  style: string;
  props: string;
  docs: string;
  buildIndex: string;
  buildStyle: string;
  declaration: string;
};

type PluginInput = {
  name?: string;
  components?: ComponentInput[] = [];
  install?: string | null = null;
};

type XtyleUtil = Record<string, () => Promise<string>>;

/**
 * @Declarations
 */

function createPluginDeclarations(
  name: string,
  content: string,
  esmodule: boolean = false
): string {
  return esmodule
    ? `declare module ${name} {\n${content}\n}`
    : `declare const ${name}: {\n${content}\n}`;
}

function selfStartingFunction(javascript: string): string {
  const _javascript = javascript || "";
  const code = _javascript.replace(/export default/g, "return");
  return `(function() { ${code} })();`;
}

function selfStartingComponent(name: string, javascript: string): string {
  return `const ${name} = ${selfStartingFunction(javascript)}`;
}

function selfStartingPlugin(
  name: string,
  javascript: string,
  esmodule: boolean = false
): string {
  const declaration = esmodule ? "const " : "var ";
  return `${declaration}${name} = ${selfStartingFunction(javascript)}`;
}

function goodJavaScriptEnd(stringComponents: string): string {
  const ensureSafeCode = stringComponents.trim().endsWith(";") ? "" : ";";
  return `${stringComponents}${ensureSafeCode}`;
}

function removeExportDefault(code: string): string {
  return code ? code.replace("export default", "").trim() : "null";
}

function ensureValueGlobal(code: string): string {
  return code ? removeSemiColon(selfStartingFunction(code)) : "null";
}

function hyphenatedToTitleCase(inputString: string): string {
  return inputString
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join("");
}

async function createComponent(
  util: XtyleUtil,
  { name, code, props, style, docs, theme }: ComponentInput,
  esmodule: boolean = false
): Promise<ComponentResult> {
  const className = hyphenatedToTitleCase(name || "").replace("-", "");

  // const themeName = theme ? `${theme}__` : "";
  // const js_name = `const $NAME = "${themeName}${className}";\n`;
  // const css_name = `$NAME: "${themeName}${className}";\n`;

  const codeString = `${code || ""}`;
  const styleString = `${style || ""}`;

  const codeLive = selfStartingComponent(className, codeString);

  const declaration = createDeclaration(className, props, docs, esmodule);

  const [renderIndex, renderStyle] = await Promise.all([
    util.tsx(codeLive),
    util.css(styleString),
  ]);

  return {
    name: className,
    index: codeString,
    style: styleString,
    props: props || "",
    docs: docs || "",
    buildIndex: renderIndex,
    buildStyle: renderStyle,
    declaration,
  };
}

async function buildXtylePlugin(
  util: XtyleUtil,
  pluginName: string,
  componentsList: ComponentResult[],
  installCode: string | null = null,
  esmodule: boolean = false
): Promise<Record<string, string>> {
  const names = new Set<string>();
  const styles: string[] = [];
  const components: string[] = [];
  const declarations: string[] = [];

  for (const component of componentsList) {
    const name = component.name || "";
    const index = component.buildIndex || "";
    const style = component.buildStyle || "";
    const declaration = component.declaration || "";
    names.add(name);
    components.push(index);
    declarations.push(declaration);
    if (style && style !== "") {
      styles.push(style);
    }
  }

  const stringNames = [...names].join(", ");
  const stringStyles = styles.join("\n");
  const stringComponents = components.join("\n");
  const stringDeclarations = declarations.join("\n\n");

  const pluginString = selfStartingPlugin(
    pluginName,
    `${goodJavaScriptEnd(stringComponents)} return { ${stringNames} }`,
    esmodule
  );

  const finalJsx = await util.minify(
    `${goodJavaScriptEnd(
      pluginString
    )}${pluginName}.install = ${removeExportDefault(installCode)};` +
      (esmodule ? `export default ${pluginName};` : "")
  );

  const finalCss = await util.css(stringStyles);
  const finalDeclarations = createPluginDeclarations(
    pluginName,
    stringDeclarations,
    esmodule
  );

  return {
    javascript: finalJsx,
    style: finalCss,
    declarations: finalDeclarations,
  };
}

function installCodeString(props: any): string {
  props = props || {};
  if (Object.keys(props).length === 0) {
    return "";
  }
  return `
export default function install(self, option) {
    return {
        init: ${ensureValueGlobal(props.init)},
        store: ${ensureValueGlobal(props.store)},
        globals: ${ensureValueGlobal(props.globals)},
        directives: ${ensureValueGlobal(props.directives)},
        actions: ${ensureValueGlobal(props.actions)},
        models: ${ensureValueGlobal(props.models)},
        router: ${ensureValueGlobal(props.router)},
      };
}
`;
}

export default function (util: XtyleUtil) {
  const core = {
    component: async (
      props: ComponentInput = {},
      esmodule: boolean = false
    ): Promise<ComponentResult> => createComponent(util, props, esmodule),

    plugin: async (
      props: PluginInput = {},
      esmodule: boolean = false
    ): Promise<Record<string, string>> => {
      const { name, components, install } = props;

      const allComponents = await Promise.all(
        components.map((row) =>
          core.component({ ...row, theme: name }, esmodule, name)
        )
      );

      const finalPlugin = buildXtylePlugin(
        util,
        name,
        allComponents,
        installCodeString(install),
        esmodule
      );
      return finalPlugin;
    },
  };

  // Simplify the common pattern for wrapping an async function
  const asyncWrapper = async (func: Function, ...args: any[]) =>
    await func(...args);

  return {
    ...util,
    component: asyncWrapper.bind(null, core.component),
    plugin: asyncWrapper.bind(null, core.plugin),
  };
}
