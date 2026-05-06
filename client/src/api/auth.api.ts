import { api } from './axios';
import { ApiResponse, User } from '@/types';
import {
  LoginFormData,
  RegisterFormData,
  RegisterUserFormData,
  RegisterTechnicianFormData,
} from '@/lib/validations';

type AnyRegisterFormData =
  | RegisterFormData
  | RegisterUserFormData
  | RegisterTechnicianFormData;

export const authApi = {
  login: async (data: LoginFormData) => {
    const res = await api.post<ApiResponse<User>>('/auth/login', data);
    return res.data;
  },

  register: async (data: AnyRegisterFormData) => {
    const res = await api.post<ApiResponse<User>>('/auth/register', data);
    return res.data;
  },

  getMe: async () => {
    const res = await api.get<ApiResponse<User>>('/auth/me');
    return res.data;
  },

  logout: async () => {
    const res = await api.post<ApiResponse<null>>('/auth/logout');
    return res.data;
  },
};
