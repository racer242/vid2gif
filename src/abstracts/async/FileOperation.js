import AsyncOperation from "../../abstracts/async/AsyncOperation"

class FileOperation extends AsyncOperation {

  constructor(id,source,destination,params,callback) {
    super(id,callback);
    this.source=source;
    this.destination=destination;
    this.params=params;
  }

  destroy()
  {
    this.params=null;
    super.destroy();
  }

}

export default FileOperation;
