/**
 * Трекер изменений файла
 *
 * Отслеживает изменение файла
 * При изменении, трекер меняет статус наличия изменения на положительный.
 * Однако, колбек вызывется не сразу после изменения, а только в период
 * итерации обхода.
 */

import fs from "fs";
import watch from "node-watch";
import { log } from "../services/Logger";
import dictionary from "../configuration/dictionary";

class FileUpdateTracker {
  constructor(callback) {
    this.path = null;
    this.callback = callback;
    this.mTime = 0;
    this.isChecked = false;
    this.isWatching = false;
    this.initErrorIsMuted = false;
    this.checkErrorIsMuted = false;
  }

  destroy() {
    this.stopWatching();
    this.callback = null;
  }

  setPath(path) {
    this.path = path;
    this.stopWatching();
    this.startWatching();
  }

  acceptChange(fileName) {
    return true;
  }

  startWatching() {
    this.isWatching = false;
    if (this.path) {
      try {
        this.watcher = watch(
          this.path,
          { recursive: true },
          (event, fileName) => {
            let accepted = this.acceptChange(fileName);
            this.isChecked = !accepted;
            if (accepted) {
              log(this, dictionary.log.trackingFileChanged, event, fileName);
            }
          }
        );

        this.watcher.on("error", (error) => {});

        this.isWatching = true;
        this.initErrorIsMuted = false;

        if (this.watchInitFailed) {
          this.isChecked = false;
          this.watchInitFailed = false;
          log(this, dictionary.log.trackingFileChanged, this.path);
        }
      } catch (error) {
        this.watchInitFailed = true;
        if (!this.initErrorIsMuted) {
          log(this, dictionary.log.watchInitError, this.path, error.message);
          log(this, dictionary.log.errorIsLooping);
          this.initErrorIsMuted = true;
        }
      }
    }
    return this.isWatching;
  }

  stopWatching() {
    if (this.watcher) {
      this.watcher.close();
      this.watcher = null;
    }
    this.isWatching = false;
  }

  check() {
    try {
      fs.stat(this.path, (err, stats) => {
        // console.log("FileUpdateTracker: get stats:",err);
        if (!err) {
          this.isChecked = true;
          let mTime = Math.max(stats.mtime, stats.birthtime);
          if (this.mTime.toString() !== mTime.toString()) {
            if (this.mTime.toString() === "0") {
              log(this, dictionary.log.trackingFileAcquired, this.path);
            } else {
              log(
                this,
                dictionary.log.trackingFileUpdated,
                this.path,
                "(" +
                  new Date(this.mTime).toLocaleString() +
                  " != " +
                  new Date(mTime).toLocaleString() +
                  ")"
              );
            }
            this.mTime = mTime;
            if (this.callback) {
              this.callback();
            }
          }
          this.checkErrorIsMuted = false;
        } else {
          if (!this.checkErrorIsMuted) {
            log(this, dictionary.log.checkFileError, this.path, err);
            this.checkErrorIsMuted = true;
          }
        }
      });
    } catch (error) {
      this.isChecked = false;
      if (!this.checkErrorIsMuted) {
        log(this, dictionary.log.checkFileError, this.path, error);
        log(this, dictionary.log.errorIsLooping);
        this.checkErrorIsMuted = true;
      }
    }
  }

  update() {
    if (!this.isWatching) {
      if (!this.startWatching()) {
        this.isChecked = false;
      }
    }

    if (!this.isChecked && this.path) {
      this.check();
    }
  }
}

export default FileUpdateTracker;
