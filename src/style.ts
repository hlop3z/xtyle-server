import * as sass from "sass";
import postcss from "postcss";
import cssnano from "cssnano";
import autoprefixer from "autoprefixer";

// CSS + SASS (SCSS)
const cssMinify = async (code: any) => {
  try {
    const output = await postcss([cssnano, autoprefixer]).process(code, {
      from: undefined,
    });
    return output.css;
  } catch (error: any) {
    console.error("Error minifying CSS:", error.message);
    throw error;
  }
};

const sassParser = (code: any) => {
  try {
    const cssResult = sass.renderSync({
      data: code,
    });
    return cssResult.css.toString();
  } catch (error: any) {
    console.error("Error parsing SASS:", error.message);
    throw error;
  }
};

export default async function scssUtil(code: any) {
  const output = sassParser(code);
  return await cssMinify(output);
}
