import express from "express";
import path from "path";
import settings from "../configuration/settings.js";
import { pathExists } from "../helpers/fileTools.js";

// Создаем роутер
const resourceRouter = express.Router();

// Определяем обработчик любого URL
resourceRouter.get("/api/image1/:id", function (req, res, next) {
  let id = req.params.id;
  let filePath = path.join(settings.outputLocation, id + "_preview1.png");
  if (pathExists(filePath)) {
    res.sendFile(filePath);
    return;
  }
  next();
});
resourceRouter.get("/api/image2/:id", function (req, res, next) {
  let id = req.params.id;
  let filePath = path.join(settings.outputLocation, id + "_preview2.png");
  if (pathExists(filePath)) {
    res.sendFile(filePath);
    return;
  }
  next();
});
resourceRouter.get("/api/gif/:id", function (req, res, next) {
  let id = req.params.id;
  let filePath = path.join(settings.outputLocation, id + "_video.gif");
  if (pathExists(filePath)) {
    res.sendFile(filePath);
    return;
  }
  next();
});

export default resourceRouter;
