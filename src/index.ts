// @ts-nocheck
import express from "express";
import xtyle from "./util.js";

const App = express();

App.use(express.json());

const handleRequest = async (req, res, transformer) => {
  try {
    const code = req.body.code;
    const result = await transformer(code);
    res.send({ code: result });
  } catch (error) {
    res.send({
      code: null,
    });
  }
};

App.get("/", (req, res) => {
  console.log(xtyle);
  res.send({
    pong: true,
  });
});

App.post("/ping", (req, res) => {
  res.send({
    pong: true,
    data: req.body,
  });
});

App.post("/minify", (req, res) => {
  handleRequest(req, res, xtyle.minify);
});

App.post("/tsx", (req, res) => {
  handleRequest(req, res, xtyle.tsx);
});

App.post("/scss", (req, res) => {
  handleRequest(req, res, xtyle.css);
});

App.post("/component", (req, res) => {
  handleRequest(req, res, xtyle.component);
});

App.post("/plugin", (req, res) => {
  handleRequest(req, res, xtyle.plugin);
});

export default {
  ...xtyle,
  server(port) {
    App.listen(port, () => {
      console.log(`TSX-Server - Listening on port: ${port}`);
    });
  },
};
