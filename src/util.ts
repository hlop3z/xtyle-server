import App from "./app.js";
import Code from "./code.js";
import Style from "./style.js";

// USAGE
const util = {
  ...Code,
  css: Style,
};

// @ts-ignore
const xtyle = App(util);

export default xtyle;
