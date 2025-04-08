class AsyncOperation {

  constructor(id,callback) {
    this.id=id;
    this.callback=callback;
  }

  destroy()
  {
    this.callback=null;
  }

  run()
  {
  }

  complete(error, info) {
    if (this.callback) {
      this.callback(this,error,info);
    }
  }

}

export default AsyncOperation;
