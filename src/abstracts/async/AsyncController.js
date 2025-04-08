import {objectIsEmpty} from "../../helpers/objectTools"

class AsyncController {

  constructor(callback) {
    this.callback=callback;
    this.operations={};
  }

  destroy()
  {
    for (let id in this.operations) {
      this.operations[id].destroy();
    }
    this.operations=null;
    this.callback=null;
  }

  addOperations()
  {

  }

  run()
  {
    this.results=[];
    this.operations={};
    this.addOperations();
    if (this.results.length>0) {
      this.complete();
    } else {
      if (!objectIsEmpty(this.operations)) {
        for (let id in this.operations) {
          this.operations[id].run();
        }
      } else {
        this.complete();
      }
    }
  }

  checkOperation(id)
  {
    if (this.operations[id]) {
      this.operations[id].destroy();
      delete this.operations[id];
    }
    this.checkComplete();
  }

  checkComplete()
  {
    if (objectIsEmpty(this.operations)) {
      this.complete();
    }
  }

  complete()
  {
    if (this.results.length===0) {
      this.results=null;
    }
    if (this.callback) {
      setTimeout(()=>{this.callback(this.results);},0);

    }
  }

}

export default AsyncController;
