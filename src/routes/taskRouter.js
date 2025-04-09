import express from "express";
import dictionary from "../configuration/dictionary.js";
import { pathExists } from "../helpers/fileTools.js";
import path from "path";
import appRoot from "app-root-path";
import settings from "../configuration/settings.js";

var router = express.Router();

/* GET home page. */
router.post("/*", async (req, res, next) => {
  let id = req.query.id;

  let filePath = path.join(appRoot.path, settings.outputPath, id + ".gif");
  if (pathExists(filePath)) {
    res.sendFile(filePath);
    return;
  }

  let appState = req.app.get("appState");
  if (appState.task && appState.task.status != "ready") {
    res.json(dictionary.taskExists);
  } else {
    appState.task = {
      time: Date.now(),
      url: req.query.url,
      type: req.query.type,
      id,
      status: "init",
    };

    res.json(dictionary.taskAccepted);
  }
});

export default router;
