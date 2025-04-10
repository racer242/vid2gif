import express from "express";
import dictionary from "../configuration/dictionary.js";
import { pathExists } from "../helpers/fileTools.js";
import path from "path";
import appRoot from "app-root-path";
import settings from "../configuration/settings.js";
import { testTask } from "../helpers/taskTools.js";

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
  if (
    appState.task &&
    appState.task.status != "ready" &&
    appState.task.status != "error"
  ) {
    res.json(dictionary.responces.taskExists);
  } else {
    let task = {
      time: Date.now(),
      ...req.query,
      status: "init",
    };

    if (!testTask(task)) {
      res.json(dictionary.responces.taskCorrupted);
    } else {
      appState.task = task;
      res.json(dictionary.responces.taskAccepted);
    }
  }
});

export default router;
