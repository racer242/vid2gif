export const isObject = (object) => {
  return object.constructor === Object;
}

export const objectIsEmpty = (object) => {
  return Object.keys(object).length === 0 && object.constructor === Object;
}

export const cloneObject = (object) => {
   return JSON.parse(JSON.stringify(object));
}

export const concatObjects = (object1,object2) => {
  let result={};
  let keys=[...Object.keys(object1),...Object.keys(object2)];
  for (let i = 0; i < keys.length; i++) {
    if ((object1[keys[i]]!==undefined)&&(object1[keys[i]]!==null)&&(object1[keys[i]]!=='')) {
      result[keys[i]]=object1[keys[i]];
    } else
    if ((object2[keys[i]]!==undefined)&&(object2[keys[i]]!==null)&&(object2[keys[i]]!=='')) {
      result[keys[i]]=object2[keys[i]];
    }
  }
  return result;
}

export const concatToObject = (object,data) => {
  let keys=[...Object.keys(object),...Object.keys(data)];
  for (let i = 0; i < keys.length; i++) {
    if ((object[keys[i]]!==undefined)&&(object[keys[i]]!==null)&&(object[keys[i]]!=='')) {
    } else
    if ((data[keys[i]]!==undefined)&&(data[keys[i]]!==null)&&(data[keys[i]]!=='')) {
      object[keys[i]]=data[keys[i]];
    }
  }
}

export const copyObjects = (object,data) => {
  let keys=Object.keys(data);
  let result={
    ...object,
  };
  for (let i = 0; i < keys.length; i++) {
    if ((data[keys[i]]!==undefined)&&(data[keys[i]]!==null)&&(data[keys[i]]!=='')) {
      result[keys[i]]=data[keys[i]];
    }
  }
  return result;
}

export const copyToObject = (object,data) => {
  let keys=Object.keys(data);
  for (let i = 0; i < keys.length; i++) {
    if ((data[keys[i]]!==undefined)&&(data[keys[i]]!==null)&&(data[keys[i]]!=='')) {
      object[keys[i]]=data[keys[i]];
    }
  }
}

export const deepCopyToObject = (object,data) => {
  let keys=Object.keys(data);
  for (let i = 0; i < keys.length; i++) {
    if ((data[keys[i]]!==undefined)&&(data[keys[i]]!==null)&&(data[keys[i]]!=='')) {
      if (
          ((object[keys[i]])&&(object[keys[i]].constructor === Object))&&
          ((data[keys[i]])&&(data[keys[i]].constructor === Object))
      )
      {
        deepCopyToObject(object[keys[i]],data[keys[i]]);
      } else {
        object[keys[i]]=data[keys[i]];
      }
    }
  }
}

export const copyToObjectForKeys = (keyList,object,data) => {
  for (let i = 0; i < keyList.length; i++) {
    if ((data[keyList[i]]!==undefined)&&(data[keyList[i]]!==null)&&(data[keyList[i]]!=='')) {
      object[keyList[i]]=data[keyList[i]];
    }
  }
}

export const copyToObjectByKeyObject = (keyObject,object,data) => {
  let keys=Object.keys(keyObject);
  for (let i = 0; i < keys.length; i++) {
    if ((data[keys[i]]!==undefined)&&(data[keys[i]]!==null)&&(data[keys[i]]!=='')) {
      object[keys[i]]=data[keys[i]];
    }
  }
}

export const objectToArrayByIndex = (object) => {
  let result=[];
  for (let id in object) {
    result.push(object[id]);
  }
  result.sort((a,b)=>{
    return (a.index>b.index)?1:(a.index==b.index)?0:-1;
  });
  return result;
}

export const objectToObjectByIndex = (object) => {
  let result={};
  for (let id in object) {
    result[object[id].index]=object[id];
  }
  return result;
}
