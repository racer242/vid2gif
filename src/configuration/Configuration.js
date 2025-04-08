import appRoot from "app-root-path";
import settings from "./settings";
import MultiMap from "../abstracts/MultiMap";

var configurationInstance;

class Configuration extends MultiMap {
  constructor(id, data, changedCallback) {
    super(id, data, changedCallback);
    for (let name in settings.zeroConfiguration) {
      this.data[name] = settings.zeroConfiguration[name];
    }
  }

  newPath() {
    return appRoot + settings.configurationPath;
  }
}

export default Configuration;

export function createConfiguration(id, data, changedCallback) {
  if (!configurationInstance) {
    configurationInstance = new Configuration(id, data, changedCallback);
  }
  return configurationInstance;
}

export function getConfiguration() {
  return configurationInstance.data;
}
