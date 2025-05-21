// Em um arquivo de configuração (ex: src/lib/api.ts)
import axios from "axios";

const api = axios.create({
  baseURL: "/api",
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Tratamento global de erros
    return Promise.reject(error);
  }
);

export default api;
