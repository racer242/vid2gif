export const findSheet = (sheets,name) =>
{
  if (!sheets) return null;
  let result=null;
  for (let i = 0; i < sheets.length; i++) {
    if (sheets[i].name===name) {
      return sheets[i];
    }
  }
  return result;
}

export const findProp = (sheet,name,index) =>
{
  if (!sheet) return null;
  if (!sheet.data) return null;
  if (!index) index=0;
  let result=null;
  for (let i = 0; i < sheet.data.length; i++) {
    if (sheet.data[i][index]===name) {
      return sheet.data[i];
    }
  }
  return result;
}
