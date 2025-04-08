import dictionary from "../configuration/dictionary";
import pidusage from "pidusage";
import publicIp from "../improve/get-public-ip";
import getInternalIp from "get-internal-ip";
import AbstractManager from "../abstracts/AbstractManager";
import { log } from "../services/Logger";

/**
 * Stats Manager
 * Собирает статистику по использованию системы
 */
class StatsManager extends AbstractManager {
  /**
   * Конструктор
   */
  constructor(id, data, finishCallback, createdCallback) {
    super(id, data, finishCallback, createdCallback);

    this.requestStats = [];
    this.lastStatsTime = new Date();

    this.lastTime = 0;

    publicIp.getPublicIpFromHTTP((err, address) => {
      if (err) {
        log(this, dictionary.log.publicIpError);
        return;
      }
      let internalIp = "---";
      let ipData = getInternalIp.v4();
      if (ipData) {
        internalIp = ipData[Object.keys(ipData)[0]]?.address;
      }
      this.publicIp = Array.isArray(address) ? address[0] : address;
      this.internalIp = internalIp;

      log(
        this,
        dictionary.log.ipAddressGot,
        this.publicIp + " / " + this.internalIp
      );
    });
  }

  update(data) {
    if (this.data.statsCheckInterval <= Date.now() - this.lastTime) {
      this.updateState(data);
      this.lastTime = Date.now();
    }
  }

  registerRequestStats(stats) {
    this.requestStats.push({
      rq: stats.req.bytes,
      rs: stats.res.bytes,
    });
  }

  updateState(output) {
    if (!output.process) {
      output.process = {};
    }
    if (!output.performance) {
      output.performance = [];
    }
    if (!output.traffic) {
      output.traffic = {
        rq: 0,
        rs: 0,
        rc: 0,
      };
    }
    pidusage(process.pid, (err, stats) => {
      if (stats) {
        output.process.pid = stats.pid;
        output.process.cpu = stats.cpu;
        output.process.memory = stats.memory;
        output.process.elapsed = stats.elapsed;

        let time = new Date();
        let rqSize = this.requestStats.reduce((a, c) => a + c.rq, 0);
        let rsSize = this.requestStats.reduce((a, c) => a + c.rs, 0);
        let dt = (time - this.lastStatsTime) / 1000;
        if (dt == 0) dt = 1;

        output.traffic.rq += rqSize;
        output.traffic.rs += rsSize;
        output.traffic.rc += this.requestStats.length;

        output.performance.push({
          c: stats.cpu,
          m: stats.memory / 1000000,
          rq: rqSize / dt,
          rs: rsSize / dt,
          rc: this.requestStats.length / dt,

          t: `${time.getHours().toString().padStart(2, "0")}:${time
            .getMinutes()
            .toString()
            .padStart(2, "0")}:${time
            .getSeconds()
            .toString()
            .padStart(2, "0")}`,
        });
        if (output.performance.length > this.data.maxHistoryLength) {
          output.performance.splice(0, 1);
        }

        this.requestStats = [];
        this.lastStatsTime = time;
      }
    });
    output.publicIp = this.publicIp;
    output.internalIp = this.internalIp;
  }
}

export default StatsManager;
