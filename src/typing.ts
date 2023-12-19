export const removeSemiColon = (value: string) => {
  value = value.trim();
  return value.endsWith(";") ? value.slice(0, -1) : value;
};

function parseType(typeString: string) {
  // Remove single-line comments
  const content = typeString.replace(/\/\/.*$/gm, "");

  // Remove multi-line comments
  const contentWithoutComments = content.replace(
    /\/\*[\s\S]*?\*\/|\/\/.*/g,
    ""
  );

  // Replace export statement and type declaration
  const propsContent = contentWithoutComments
    .replace(/export default Props;/, "")
    .replace(/type Props =/, "")
    .trim();

  return propsContent || "any";
}

export function createDeclaration(
  name: string,
  props: string | null = null,
  docs: string | null = null,
  esmodule: boolean = false
): string {
  const esmCode = esmodule ? "export const " : "";
  const readDocs = docs ? docs.trim() : "";
  if (!props) {
    return "";
  }
  const propsText = parseType(props);
  return `${readDocs}\n${esmCode}${name}: ${propsText}`.trim();
}
