import MultiMap from "../abstracts/MultiMap";

class EmptyMap extends MultiMap {
  constructor(id, data) {
    super(id, data);
  }

  init() {
    return true;
  }

  start() {}

  update(data) {}

  destroy() {
    this.data = null;
  }
}

export default EmptyMap;
