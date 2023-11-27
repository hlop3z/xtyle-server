import { transformSync } from "@swc/core";
import { minify } from "terser";

const PRAGMA = "h";

// TypeScript (TSX)
const tsxParser = (code: any) => {
  try {
    const result = transformSync(code, {
      jsc: {
        target: "es2020",
        parser: {
          syntax: "typescript",
          tsx: true,
        },
      },
      minify: true,
    });
    return result.code.replace(/React.createElement/g, PRAGMA);
  } catch (error: any) {
    console.error("Error parsing TSX:", error.message);
    throw error;
  }
};

const jsMinify = async (code: any) => {
  try {
    const result = await minify(code || "");
    return result.code;
  } catch (error: any) {
    console.error("Error minifying JS:", error.message);
    throw error;
  }
};

export default {
  minify: jsMinify,
  tsx: async (code: any) => {
    const output = await tsxParser(code);
    return await jsMinify(output);
  },
};
