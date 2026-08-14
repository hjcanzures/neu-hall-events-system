import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL, // CRA reads REACT_APP_ prefixed vars via process.env
  withCredentials: true,
});

export default api;