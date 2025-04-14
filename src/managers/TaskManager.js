/**
 * Менеджер управления задачей
 */

import AbstractManager from "../abstracts/AbstractManager";
import path from "path";
import fs from "fs";
import axios from "axios";
import settings from "../configuration/settings";
import { deleteFile, makeDir, writeFile } from "../helpers/fileTools";
import ffmpeg from "ffmpeg-cli";
import { log } from "../services/Logger";
import dictionary from "../configuration/dictionary";
import { sendPostRequest } from "../helpers/httpTools";
import md5 from "md5";
import { asyncSleep } from "../helpers/timerTools";

class TaskManager extends AbstractManager {
  /**
   * Конструктор
   */
  constructor(id, data, appState, finishCallback, createdCallback) {
    super(id, data, finishCallback, createdCallback);
    this.appState = appState;
    this.task = {};
  }

  async startTask(task) {
    this.task = task;

    switch (task.format) {
      case "Mp4":
        await this.startMp4Task(task);
        break;
      case "Gif":
        await this.startGifTask(task);
        break;
      default:
        this.task.status = "error";
        log(this, dictionary.log.wrongFormatErrer, this.task.id);
        this.finishTask();
        return;
    }
  }

  async startMp4Task(task) {
    this.saveTaskConfig();
    this.task.status = "run";
    log(
      this,
      dictionary.log.taskStarted,
      this.task.id,
      "Формат: " + this.task.format
    );
    this.task.status = "download";
    try {
      await this.downloadVideo();
    } catch (error) {
      log(
        this,
        dictionary.log.downloadVideoError,
        this.task.videoUrl,
        this.task.videoPath,
        error.message
      );
      this.task.status = "error";
      this.task.error = "Download video error";
      this.deleteConfig();
      await this.sendCallback({
        ...dictionary.responces.downloadError,
        errorData: this.task.videoUrl,
      });
      this.finishTask();
      return;
    }
    log(
      this,
      dictionary.log.taskVideoDownloaded,
      this.task.id,
      this.task.videoUrl
    );
    this.task.status = "convertToMp4";
    try {
      await this.convertToMp4Task();
    } catch (error) {
      log(
        this,
        dictionary.log.convertMp4Error,
        this.task.videoPath,
        this.task.mp4Path,
        error.message
      );
      this.task.status = "error";
      this.task.error = "Convert error";
      this.deleteConfig();
      this.deleteVideo();
      await this.sendCallback({
        ...dictionary.responces.convertError,
        errorData: this.task.mp4Path,
      });
      this.finishTask();
      return;
    }
    log(this, dictionary.log.taskMp4Converted, this.task.id);

    this.deleteConfig();
    this.deleteVideo();

    this.task.status = "callback";
    await this.sendSuccessMp4Callback();

    this.task.status = "ready";
    this.task.error = "";

    this.finishTask();
  }

  async startGifTask(task) {
    this.saveTaskConfig();
    this.task.status = "run";
    log(
      this,
      dictionary.log.taskStarted,
      this.task.id,
      "Формат: " + this.task.format
    );

    this.task.status = "download";
    try {
      await this.downloadVideo();
    } catch (error) {
      log(
        this,
        dictionary.log.downloadVideoError,
        this.task.videoUrl,
        this.task.videoPath,
        error.message
      );
      this.task.status = "error";
      this.task.error = "Download video error";
      this.deleteConfig();
      await this.sendCallback({
        ...dictionary.responces.downloadError,
        errorData: this.task.videoUrl,
      });
      this.finishTask();
      return;
    }
    log(
      this,
      dictionary.log.taskVideoDownloaded,
      this.task.id,
      this.task.videoUrl
    );

    try {
      await this.downloadImage();
    } catch (error) {
      log(
        this,
        dictionary.log.downloadImageError,
        this.task.bubbleUrl,
        this.task.imagePath,
        error.message
      );
      this.task.status = "error";
      this.task.error = "Download image error";
      this.deleteConfig();
      this.deleteVideo();
      await this.sendCallback({
        ...dictionary.responces.downloadError,
        errorData: this.task.bubbleUrl,
      });
      this.finishTask();
      return;
    }
    log(
      this,
      dictionary.log.taskImageDownloaded,
      this.task.id,
      this.task.bubbleUrl
    );

    this.task.status = "convertToPreview1";
    try {
      await this.convertToPreview1Task();
    } catch (error) {
      log(
        this,
        dictionary.log.convertPreviewError,
        this.task.videoPath,
        this.task.preview1Path,
        error.message
      );
      this.task.status = "error";
      this.task.error = "Convert error";
      this.deleteConfig();
      this.deleteVideo();
      this.deleteImage();
      await this.sendCallback({
        ...dictionary.responces.convertError,
        errorData: this.task.preview1Path,
      });
      this.finishTask();
      return;
    }
    log(this, dictionary.log.taskPreview1Converted, this.task.id);

    this.task.status = "convertToPreview2";
    try {
      await this.convertToPreview2Task();
    } catch (error) {
      log(
        this,
        dictionary.log.convertPreviewError,
        this.task.videoPath,
        this.task.preview2Path,
        error.message
      );
      this.task.status = "error";
      this.task.error = "Convert error";
      this.deleteConfig();
      this.deleteVideo();
      this.deleteImage();
      await this.sendCallback({
        ...dictionary.responces.convertError,
        errorData: this.task.preview2Path,
      });
      this.finishTask();
      return;
    }
    log(this, dictionary.log.taskPreview2Converted, this.task.id);

    this.task.status = "convertToGif";
    try {
      await this.convertToGifTask();
    } catch (error) {
      log(
        this,
        dictionary.log.convertGifError,
        this.task.videoPath,
        this.task.gifPath,
        error.message
      );
      this.task.status = "error";
      this.task.error = "Convert error";
      this.deleteConfig();
      this.deleteVideo();
      this.deleteImage();
      await this.sendCallback({
        ...dictionary.responces.convertError,
        errorData: this.task.gifPath,
      });
      this.finishTask();
      return;
    }
    log(this, dictionary.log.taskGifConverted, this.task.id);

    this.deleteConfig();
    this.deleteVideo();
    this.deleteImage();

    this.task.status = "callback";
    await this.sendSuccessGifCallback();

    this.task.status = "ready";
    this.task.error = "";

    this.finishTask();
  }

  saveTaskConfig() {
    let fileDir = settings.outputLocation;
    makeDir(fileDir);
    this.task.configPath = path.join(fileDir, this.task.id + "_config.json");
    deleteFile(this.task.configPath);
    if (!writeFile(this.task.configPath, JSON.stringify(this.task))) {
      log(this, dictionary.log.saveTaskConfigError, this.task.configPath);
    }
  }

  async downloadVideo() {
    let fileDir = settings.tempLocation;
    makeDir(fileDir);
    this.task.videoPath = path.join(fileDir, this.task.id + "_video");
    let url = encodeURI(this.task.videoUrl);
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
    this.task.imagePath = path.join(fileDir, this.task.id + "_image");
    let url = encodeURI(this.task.bubbleUrl);
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

  async convertToPreview1Task() {
    let fileDir = settings.outputLocation;
    makeDir(fileDir);
    this.task.preview1Path = path.join(fileDir, this.task.id + "_preview1.png");
    deleteFile(this.task.preview1Path);
    let options = [];
    options.push({ cmd: "-ss", param: this.data.previewOffset });
    options.push({ cmd: "-i", param: this.task.videoPath });
    options.push({
      cmd: "-filter_complex",
      param:
        '"' +
        "crop='min(ih,iw)':'min(ih,iw)'" +
        "," +
        "scale=" +
        this.data.videoSize +
        ":" +
        this.data.videoSize +
        ":flags=lanczos" +
        '"',
    });
    options.push({ cmd: "-frames:v", param: 1 });
    options.push({ param: this.task.preview1Path });

    let commandLine = this.makeCommandLine(options);

    await ffmpeg.run(commandLine);
  }

  async convertToPreview2Task() {
    let fileDir = settings.outputLocation;
    makeDir(fileDir);
    this.task.preview2Path = path.join(fileDir, this.task.id + "_preview2.png");
    deleteFile(this.task.preview2Path);
    let options = [];
    options.push({ cmd: "-ss", param: this.data.previewOffset });
    options.push({ cmd: "-i", param: this.task.videoPath });
    options.push({ cmd: "-i", param: this.task.imagePath });
    options.push({
      cmd: "-filter_complex",
      param:
        '"' +
        "crop='min(ih,iw)':'min(ih,iw)'" +
        "," +
        "scale=" +
        this.data.videoSize +
        ":" +
        this.data.videoSize +
        ":flags=lanczos[s1];[s1][1:v]overlay=" +
        Number(this.task.bubbleX) / 100 +
        "*W:" +
        Number(this.task.bubbleY) / 100 +
        '*H"',
    });
    options.push({ cmd: "-frames:v", param: 1 });
    options.push({ param: this.task.preview2Path });

    let commandLine = this.makeCommandLine(options);

    await ffmpeg.run(commandLine);
  }

  async convertToGifTask() {
    let fileDir = settings.outputLocation;
    makeDir(fileDir);
    this.task.gifPath = path.join(fileDir, this.task.id + "_video.gif");
    deleteFile(this.task.gifPath);
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
        "crop='min(ih,iw)':'min(ih,iw)'" +
        "," +
        "scale=" +
        this.data.videoSize +
        ":" +
        this.data.videoSize +
        ":flags=lanczos[ss];[ss][1:v]overlay=" +
        Number(this.task.bubbleX) / 100 +
        "*W:" +
        Number(this.task.bubbleY) / 100 +
        '*H,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse"',
    });
    options.push({ cmd: "-loop", param: 0 });
    options.push({ param: this.task.gifPath });

    let commandLine = this.makeCommandLine(options);

    await ffmpeg.run(commandLine);

    // this.data.videoSize +
    // ":flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][1:v]overlay=" +
    // Number(this.task.bubbleX) / 100 +
    // "*W:" +
    // Number(this.task.bubbleY) / 100 +
    // '*H[s2];[s2][p]paletteuse"',

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

    // '"fps=' +
    //     this.data.videoFps +
    //     "," +
    //     "scale='if(gte(ih,iw)," +
    //     this.data.videoSize +
    //     ",-1)':'if(gte(ih,iw),-1," +
    //     this.data.videoSize +
    //     ")'" +
    //     ":flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][1:v]overlay=" +
    //     Number(this.task.bubbleX) / 100 +
    //     "*W:" +
    //     Number(this.task.bubbleY) / 100 +
    //     '*H[s2];[s2][p]paletteuse"',
  }

  async convertToMp4Task() {
    let fileDir = settings.outputLocation;
    makeDir(fileDir);
    this.task.mp4Path = path.join(fileDir, this.task.id + "_video.mp4");
    deleteFile(this.task.mp4Path);
    let options = [];
    options.push({ cmd: "-ss", param: this.data.videoStart });
    options.push({ cmd: "-t", param: this.data.videoDuration });
    options.push({ cmd: "-i", param: this.task.videoPath });
    options.push({
      cmd: "-filter_complex",
      param:
        '"' +
        "crop='min(ih,iw)':'min(ih,iw)'" +
        "," +
        "scale=" +
        this.data.videoSize +
        ":" +
        this.data.videoSize +
        ':flags=lanczos"',
    });
    options.push({ cmd: "-loop", param: 0 });
    options.push({ param: this.task.mp4Path });

    let commandLine = this.makeCommandLine(options);

    await ffmpeg.run(commandLine);
  }

  async sendSuccessGifCallback() {
    let staticPngUrl =
      this.appState.server +
      "/api/image1/" +
      this.task.id +
      "/image1_" +
      this.task.id +
      ".png";
    let staticPngWithBubbleUrl =
      this.appState.server +
      "/api/image2/" +
      this.task.id +
      "/image2_" +
      this.task.id +
      ".png";
    let gifUrl =
      this.appState.server +
      "/api/gif/" +
      this.task.id +
      "/gif_" +
      this.task.id +
      ".gif";
    let hash = md5(staticPngUrl + "" + gifUrl + "" + settings.secretKey);

    await this.sendCallback({
      ...dictionary.responces.taskCompleted,
      staticPngUrl,
      staticPngWithBubbleUrl,
      gifUrl,
      hash,
    });
  }

  async sendSuccessMp4Callback() {
    let videoUrl =
      this.appState.server +
      "/api/mp4/" +
      this.task.id +
      "/video_" +
      this.task.id +
      ".mp4";
    let hash = md5(videoUrl + "" + settings.secretKey);

    await this.sendCallback({
      ...dictionary.responces.taskCompleted,
      videoUrl,
      hash,
    });
  }

  async sendCallback(request) {
    let retries = settings.callbackRetryCount;
    let needToRetry = false;
    let data = {};
    do {
      needToRetry = false;
      try {
        data = await sendPostRequest(this.task.callbackUrl, {
          ...request,
          id: this.task.id,
        });
      } catch (error) {
        needToRetry = true;
        retries--;
        log(
          this,
          dictionary.log.callbackError,
          this.task.callbackUrl,
          "Осталось попыток: " + retries,
          error.message
        );
        await asyncSleep(settings.callbackRetryDuration);
      }
      if (data) {
        if (data.result === "ERROR") {
          needToRetry = true;
          retries--;
          log(
            this,
            dictionary.log.callbackError,
            this.task.callbackUrl,
            "Осталось попыток: " + retries,
            data
          );
        }
      }
      if (!needToRetry) {
        log(this, dictionary.log.taskCallback, this.task.id, request);
        retries = 0;
      }
    } while (retries > 0);
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

  deleteConfig() {
    if (!deleteFile(this.task.configPath)) {
      log(this, dictionary.log.deleteError, this.task.configPath);
    }
  }

  makeCommandLine(options) {
    return options.reduce((a, v) => {
      if (v.cmd) {
        a += v.cmd + " " + v.param;
      } else {
        a += v.param;
      }
      a += " ";
      return a;
    }, "");
  }

  finishTask() {
    this.finishCallback(this);
  }
}

export default TaskManager;
