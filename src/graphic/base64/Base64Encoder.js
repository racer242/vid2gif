import AsyncController from "../../abstracts/async/AsyncController"
import Base64Operation from "./Base64Operation"
import path from 'path';

class Base64Encoder extends AsyncController {

  constructor(images,callback) {
    super(callback)
    this.images=images;
  }

  addOperations()
  {
    for (let id in this.images) {
      let image=this.images[id];

      this.operations[id]=new Base64Operation(id,path.join(image.collectionPath,image.name),(operation,error,info) => {
        if (error) {
          this.results.push({message:error.message,data:operation.source,error:error});
        }
        if (info) {
          this.images[operation.id].base64=info;
        } else {
          this.images[operation.id].base64="";
        }
        this.checkOperation(operation.id);
      });
    }
  }

}

export default Base64Encoder;
