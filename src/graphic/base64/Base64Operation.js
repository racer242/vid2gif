import base64Img from 'base64-img'
import AsyncOperation from "../../abstracts/async/AsyncOperation"

class Base64Operation extends AsyncOperation {

  constructor(id,source,callback) {
    super(id,callback);
    this.source=source;
  }

  run()
  {
    base64Img.base64(this.source, (err, info) => {
      this.complete(err,info);
    })
  }

}

export default Base64Operation;
