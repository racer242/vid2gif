/**
 * Менеджер управления задачей
 */

import AbstractManager from "../abstracts/AbstractManager";
import path from "path";
import appRoot from "app-root-path";
import fs from "fs";
import axios from "axios";
import settings from "../configuration/settings";
import { makeDir } from "../helpers/fileTools";

class CacheManager extends AbstractManager {
  /**
   * Конструктор
   */
  constructor(id, data, finishCallback, createdCallback) {
    super(id, data, finishCallback, createdCallback);
    this.lastTime = 0;
    this.status = "ready";
    this.task = {};
  }

  update(data) {
    if (this.data.taskCheckInterval <= Date.now() - this.lastTime) {
      if (this.status === "ready" && data.task && data.task.status === "init") {
        this.startTask(data.task);
      }
    }
  }

  async startTask(task) {
    this.task = task;
    task.status = "download";
    await this.downloadTask();
    task.status = "convert";
    await this.convertTask();
    task.status = "ready";
    this.finishTask();
  }

  async downloadTask() {
    let fileDir = path.join(appRoot.path, settings.tempPath);
    makeDir(fileDir);
    let filePath = path.join(fileDir, this.task.id + "." + this.task.type);
    let url = this.task.url;

    const response = await axios({
      method: "GET",
      url: url,
      responseType: "stream",
    });

    response.data.pipe(fs.createWriteStream(filePath));

    return new Promise((resolve, reject) => {
      response.data.on("end", () => {
        resolve();
      });

      response.data.on("error", () => {
        reject();
      });
    });
  }

  async convertTask() {}

  finishTask() {}
}

export default CacheManager;
