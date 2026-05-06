import { api } from './axios';
import { ApiResponse, AIAnalysis } from '@/types';

export const AI_ANALYSIS_ENABLED =
  import.meta.env['VITE_AI_ANALYSIS_ENABLED'] === 'true';

export const aiApi = {
  analyzeImage: async (imageBase64: string): Promise<AIAnalysis> => {
    const res = await api.post<ApiResponse<AIAnalysis>>('/ai/analyze-image', { imageBase64 });
    return res.data.data;
  },
};
