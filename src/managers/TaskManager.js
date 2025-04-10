/**
 * Менеджер управления задачей
 */

import AbstractManager from "../abstracts/AbstractManager";
import path from "path";
import appRoot from "app-root-path";
import fs from "fs";
import axios from "axios";
import settings from "../configuration/settings";
import { deleteFile, makeDir } from "../helpers/fileTools";
import ffmpeg from "ffmpeg-cli";
import { log } from "../services/Logger";
import dictionary from "../configuration/dictionary";

class CacheManager extends AbstractManager {
  /**
   * Конструктор
   */
  constructor(id, data, finishCallback, createdCallback) {
    super(id, data, finishCallback, createdCallback);
    this.lastTime = 0;
    this.task = {};
  }

  update(data) {
    if (this.data.taskCheckInterval <= Date.now() - this.lastTime) {
      if (data.task && data.task.status === "init") {
        this.startTask(data.task);
      }
    }
  }

  async startTask(task) {
    this.task = task;

    this.task.status = "download";
    try {
      await this.downloadVideo();
    } catch (error) {
      log(
        this,
        dictionary.log.downloadVideoError,
        this.task.url,
        this.task.videoPath,
        error
      );
      this.task.status = "error";
      this.task.error = "Download video error";
      return;
    }

    try {
      await this.downloadImage();
    } catch (error) {
      log(
        this,
        dictionary.log.downloadImageError,
        this.task.img,
        this.task.imagePath,
        error
      );
      this.task.status = "error";
      this.task.error = "Download image error";
      return;
    }

    this.task.status = "convert";
    try {
      await this.convertTask();
    } catch (error) {
      log(
        this,
        dictionary.log.convertError,
        this.task.videoPath,
        this.task.gifPath,
        error
      );
      task.status = "error";
      task.error = "Convert error";
      return;
    }

    this.task.status = "ready";
    this.task.error = "";
    this.finishTask();
  }

  async downloadVideo() {
    let fileDir = path.join(appRoot.path, settings.tempPath);
    makeDir(fileDir);
    this.task.videoPath = path.join(
      fileDir,
      this.task.id + "." + this.task.type
    );
    let url = encodeURI(this.task.url);
    const response = await axios({
      method: "GET",
      url,
      responseType: "stream",
    });
    response.data.pipe(fs.createWriteStream(this.task.videoPath));
    return new Promise((resolve, reject) => {
      response.data.on("end", () => {
        resolve();
      });
      response.data.on("error", () => {
        reject();
      });
    });
  }

  async downloadImage() {
    let fileDir = path.join(appRoot.path, settings.tempPath);
    makeDir(fileDir);
    this.task.imagePath = path.join(fileDir, this.task.id + ".png");
    let url = encodeURI(this.task.img);
    const response = await axios({
      method: "GET",
      url,
      responseType: "stream",
    });
    response.data.pipe(fs.createWriteStream(this.task.imagePath));
    return new Promise((resolve, reject) => {
      response.data.on("end", () => {
        resolve();
      });
      response.data.on("error", () => {
        reject();
      });
    });
  }

  async convertTask() {
    let fileDir = path.join(appRoot.path, settings.outputPath);
    makeDir(fileDir);
    this.task.gifPath = path.join(fileDir, this.task.id + ".gif");
    let options = [];
    options.push({ cmd: "-ss", param: this.data.videoStart });
    options.push({ cmd: "-t", param: this.data.videoDuration });
    options.push({ cmd: "-i", param: this.task.videoPath });
    options.push({ cmd: "-i", param: this.task.imagePath });
    options.push({
      cmd: "-filter_complex",
      param:
        '"fps=' +
        this.data.videoFps +
        "," +
        "scale='if(gte(iw,ih)," +
        this.data.videoSize +
        ",-1)':'if(gte(iw,ih),-1," +
        this.data.videoSize +
        ")'" +
        ":flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][1:v]overlay=" +
        this.task.x +
        ":" +
        this.task.y +
        '[s2];[s2][p]paletteuse"',
    });
    options.push({ cmd: "-loop", param: 0 });
    options.push({ param: this.task.gifPath });

    let commandLine = options.reduce((a, v) => {
      if (v.cmd) {
        a += v.cmd + " " + v.param;
      } else {
        a += v.param;
      }
      a += " ";
      return a;
    }, "");

    await ffmpeg.run(commandLine);

    // options.push({ cmd: "-filter_complex", param: '"[0:v][1:v]overlay=0:0"' });
    // ffmpeg -ss 30 -t 3 -i input.mp4 -vf "fps=10,scale=320:-1:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse" -loop 0 output.gif
    // ",crop='min(ih,iw)':'min(ih,iw)',scale=" +
    // cmd: "-vf",
    // param:
    //   '"fps=' +
    //   this.data.videoFps +
    //   "," +
    //   // ",crop='min(ih,iw)':'min(ih,iw)',scale=" +
    //   "scale='if(gte(iw,ih)," +
    //   this.data.videoSize +
    //   ",-1)':'if(gte(iw,ih),-1," +
    //   this.data.videoSize +
    //   ")'" +
    //   ':flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse"',
  }

  finishTask() {
    if (!deleteFile(this.task.videoPath)) {
      log(this, dictionary.log.deleteError, this.task.videoPath);
    }
    if (!deleteFile(this.task.imagePath)) {
      log(this, dictionary.log.deleteError, this.task.imagePath);
    }
  }
}

export default CacheManager;
