import axios, { AxiosInstance } from "axios";

const API_URL = import.meta.env.VITE_BASE_URL as string;


export const apiClient: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

