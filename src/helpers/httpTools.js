import axios from "axios";

export const sendGetRequest = async (url) => {
  let response;
  response = await axios.get(url);
  return response?.data;
}

export const sendPostRequest = async (url,data,headers) => {
  let response;
  response = await axios({
    method: 'post',
    url: url,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
      ...data
    },
    body: JSON.stringify(data),
  });
  return response?.data;
};
