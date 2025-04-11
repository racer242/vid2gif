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

  let filePath = path.join(settings.outputLocation, id + ".gif");
  if (pathExists(filePath)) {
    res.sendFile(filePath);
    return;
  }

  let appState = req.app.get("appState");

  if (!appState.queue) appState.queue = [];
  let queue = appState.queue;

  let task = {
    time: Date.now(),
    ...req.query,
    status: "init",
  };

  let findTask = queue.filter(
    (v) => v.id === task.id && v.status != "ready" && v.status != "error"
  );

  if (findTask.length > 0) {
    res.json(dictionary.responces.taskExists);
  } else {
    if (!testTask(task)) {
      res.json(dictionary.responces.taskCorrupted);
    } else {
      task.status = "wait";
      queue.push(task);
      res.json(dictionary.responces.taskAccepted);
    }
  }
});

export default router;
