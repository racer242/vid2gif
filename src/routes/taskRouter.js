import express from "express";
import dictionary from "../configuration/dictionary.js";
import settings from "../configuration/settings.js";
import { testTask } from "../helpers/taskTools.js";

var router = express.Router();

/* GET home page. */
router.post("/*", async (req, res, next) => {
  let appState = req.app.get("appState");

  appState.server = req.protocol + "://" + req.get("host");

  if (!appState.queue) appState.queue = [];
  let queue = appState.queue;

  let task = {
    time: Date.now(),
    ...req.body,
    status: "init",
  };

  let findTask = queue.filter(
    (v) => v.id === task.id && v.status != "ready" && v.status != "error"
  );

  if (findTask.length > 0) {
    res.status(400).json(dictionary.responces.taskExists);
  } else {
    if (!testTask(task, settings.secretKey)) {
      res.status(400).json(dictionary.responces.taskCorrupted);
    } else {
      task.status = "wait";
      queue.push(task);
      res.status(200).json(dictionary.responces.taskAccepted);
    }
  }
});

export default router;
