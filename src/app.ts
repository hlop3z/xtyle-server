// @ts-nocheck
interface VarName {
  index: string;
  style: string;
}

type ComponentRow = {
  name?: string;
  code?: string;
  props?: string;
  style?: string;
  docs?: string;
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

type XtyleUtil = Record<string, () => Promise<string>>;

function componentProps(code: string | null): string {
  const clean = (code || "any")
    .split("export default Props;")[0]
    .replace("type Props = ", "")
    .trim();
  return clean.endsWith(";") ? clean.slice(0, -1) : clean;
}

function createDeclaration(
  name: string,
  props: string | null = null,
  docs: string | null = null,
  esmodule: boolean = false
): string {
  const esmCode = esmodule ? "export const " : "";
  const readDocs = docs ? docs.trim() : "";
  return `${readDocs}\n${esmCode}${name}: (props: ${componentProps(
    props
  )}) => object;`.trim();
}

function createPluginDeclarations(
  name: string,
  content: string,
  esmodule: boolean = false
): string {
  return esmodule
    ? `declare module ${name} {\n${content}\n}`
    : `declare const ${name}: {\n${content}\n}`;
}

function selfStartingComponent(name: string, javascript: string): string {
  const code = javascript.replace(/export default/g, "return");
  return `const ${name} = (function() { ${code} })();`;
}

function selfStartingPlugin(
  name: string,
  javascript: string,
  esmodule: boolean = false
): string {
  const code = javascript.replace(/export default/g, "return");
  const declaration = esmodule ? "const " : "var ";
  return `${declaration}${name} = (function() { ${code} })();`;
}

function goodJavaScriptEnd(stringComponents: string): string {
  const ensureSafeCode = stringComponents.trim().endsWith(";") ? "" : ";";
  return `${stringComponents}${ensureSafeCode}`;
}

function removeExportDefault(code: string): string {
  return code ? code.replace("export default", "").trim() : "";
}

function ensureValueGlobal(code: string): string {
  const text = removeExportDefault(code);
  return text === "" ? "undefined" : text;
}

function hyphenatedToTitleCase(inputString: string): string {
  return inputString
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join("");
}

function installCodeString(props: any): string {
  return `
export default function install(self, option) {
    return {
        init: ${ensureValueGlobal(props.init)},
        store: ${ensureValueGlobal(props.store)},
        globals: ${ensureValueGlobal(props.globals)},
        directives: ${ensureValueGlobal(props.directives)},
    };
}
`;
}

async function createComponent(
  util: XtyleUtil,
  rowConfig: ComponentRow,
  esmodule: boolean = false
): Promise<ComponentResult> {
  const { name, code, props, style, docs } = rowConfig;
  const className = hyphenatedToTitleCase(name || "").replace("-", "");
  const varName: VarName = {
    index: `const $NAME = "${className}";\n`,
    style: `$NAME: "${className}";\n${style || ""}`,
  };

  // Pre-Setup
  const styleString = varName.style;
  const codeString = varName.index + (code || "");
  const codeLive = selfStartingComponent(className, codeString);

  // Declaration
  const declaration = createDeclaration(className, props, docs, esmodule);

  // Renders
  const renderIndex = await util.tsx(codeLive);
  const renderStyle = await util.css(styleString);

  // Component
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
    )}${pluginName}.install = ${removeExportDefault(installCode || "null")};` +
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

export default function (util: XtyleUtil) {
  const core = {
    component: async (
      row: ComponentRow,
      esmodule: boolean = false
    ): Promise<ComponentResult> => createComponent(util, row, esmodule),

    plugin: async (
      pluginName: string,
      inputArray: ComponentRow[] = [],
      installCode: string | null = null,
      esmodule: boolean = false
    ): Promise<Record<string, string>> => {
      const allComponents = await Promise.all(
        inputArray.map((row) => core.component(row, esmodule))
      );
      return buildXtylePlugin(
        util,
        pluginName,
        allComponents,
        installCode,
        esmodule
      );
    },
  };

  async function buildPlugin(
    pluginName: string,
    inputArray: ComponentRow[] = [],
    installCode: string | null = null,
    esmodule: boolean = false
  ): Promise<Record<string, string>> {
    const allComponents = await Promise.all(
      inputArray.map((row) => core.component(row, esmodule))
    );
    return buildXtylePlugin(
      util,
      pluginName,
      allComponents,
      installCode,
      esmodule
    );
  }

  return {
    ...util,
    component: core.component,
    async component(row) {
      return await core.component(row);
    },
    async plugin(props) {
      return await buildPlugin(
        props.name,
        props.components,
        installCodeString(props.install || {})
      );
    },
  };
}
