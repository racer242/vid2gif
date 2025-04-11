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
import { sendGetRequest, sendPostRequest } from "../helpers/httpTools";

class TaskManager extends AbstractManager {
  /**
   * Конструктор
   */
  constructor(id, data, finishCallback, createdCallback) {
    super(id, data, finishCallback, createdCallback);
    this.task = {};
  }

  async startTask(task) {
    this.task = task;
    this.task.status = "run";

    log(this, dictionary.log.taskStarted, this.task.id);

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
      await this.sendCallback(dictionary.responces.downloadVideoError);
      this.finishTask();
      return;
    }
    log(this, dictionary.log.taskVideoDownloaded, this.task.id, this.task.url);

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
      this.deleteVideo();
      await this.sendCallback(dictionary.responces.downloadImageError);
      this.finishTask();
      return;
    }
    log(this, dictionary.log.taskImageDownloaded, this.task.id, this.task.img);

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
      this.deleteVideo();
      this.deleteImage();
      await this.sendCallback(dictionary.responces.convertError);
      this.finishTask();
      return;
    }
    log(this, dictionary.log.taskConverted, this.task.id);

    this.task.status = "ready";
    this.task.error = "";

    this.deleteVideo();
    this.deleteImage();
    await this.sendCallback();
    this.finishTask();
  }

  async downloadVideo() {
    let fileDir = settings.tempLocation;
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
    const writeStream = fs.createWriteStream(this.task.videoPath);
    await response.data.pipe(writeStream);
    async function write() {
      return new Promise((resolve, reject) => {
        writeStream.on("finish", resolve);
        writeStream.on("error", reject);
      });
    }
    await write();
  }

  async downloadImage() {
    let fileDir = settings.tempLocation;
    makeDir(fileDir);
    this.task.imagePath = path.join(fileDir, this.task.id + ".png");
    let url = encodeURI(this.task.img);
    const response = await axios({
      method: "GET",
      url,
      responseType: "stream",
    });
    const writeStream = fs.createWriteStream(this.task.imagePath);
    await response.data.pipe(writeStream);
    async function write() {
      return new Promise((resolve, reject) => {
        writeStream.on("finish", resolve);
        writeStream.on("error", reject);
      });
    }
    await write();
  }

  async convertTask() {
    let fileDir = settings.outputLocation;
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

  async sendCallback(request) {
    try {
      await sendPostRequest(this.task.callback, {
        ...request,
        id: this.task.id,
      });
    } catch (error) {
      log(this, dictionary.log.callbackError, this.task.callback, error);
    }
    log(this, dictionary.log.taskCallback, this.task.id);
  }

  deleteVideo() {
    if (!deleteFile(this.task.videoPath)) {
      log(this, dictionary.log.deleteError, this.task.videoPath);
    }
  }

  deleteImage() {
    if (!deleteFile(this.task.imagePath)) {
      log(this, dictionary.log.deleteError, this.task.imagePath);
    }
  }

  finishTask() {
    this.finishCallback(this);
  }
}

export default TaskManager;
