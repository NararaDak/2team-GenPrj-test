import axios from 'axios';
import BaseApi from './baseApi';

class ModelApi extends BaseApi {
  getGatewayErrorMessage(statusCode) {
    if (statusCode === 504) {
      return '서버 처리 시간이 초과되었습니다(504 Gateway Time-out). 프론트 타임아웃이 아니라 서버/게이트웨이 제한일 수 있습니다.';
    }
    if (statusCode === 502) {
      return '게이트웨이 연결 오류가 발생했습니다(502 Bad Gateway). 백엔드 서버 상태 또는 프록시 연결을 확인해 주세요.';
    }

    return null;
  }

  async testConnection() {
    return this.get('/model/test');
  }

  async generateImage(prompt, positivePrompt = '', negativePrompt = '') {
    const queryParams = new URLSearchParams({ prompt });
    if (positivePrompt?.trim()) queryParams.set('positive_prompt', positivePrompt.trim());
    if (negativePrompt?.trim()) queryParams.set('negative_prompt', negativePrompt.trim());

    const urlPath = `/model/generate?${queryParams.toString()}`;
    const imageGenerateTimeoutMs = 10 * 60 * 1000;

    try {
      const response = await this.apiClient.get(urlPath, {
        responseType: 'blob',
        timeout: imageGenerateTimeoutMs,
      });

      return {
        ok: true,
        apiUrl: this.buildUrl(urlPath),
        statusCode: response.status,
        blobUrl: URL.createObjectURL(response.data),
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.code === 'ECONNABORTED') {
          return { ok: false, apiUrl: this.buildUrl(urlPath), error: `요청 시간 초과 (${imageGenerateTimeoutMs / 1000}초)` };
        }
        if (error.response) {
          const gatewayMessage = this.getGatewayErrorMessage(error.response.status);
          return {
            ok: false,
            apiUrl: this.buildUrl(urlPath),
            statusCode: error.response.status,
            error: gatewayMessage || `API 오류: ${error.response.statusText}`,
          };
        }

        if (error.request) {
          return {
            ok: false,
            apiUrl: this.buildUrl(urlPath),
            error: this.getNetworkFailureMessage(urlPath),
          };
        }
      }

      return { ok: false, apiUrl: this.buildUrl(urlPath), error: `요청 실패: ${error.message}` };
    }
  }

  async changeImage(prompt, imageBase64, strength = 0.75, positivePrompt = '', negativePrompt = '') {
    const urlPath = '/model/changeimage';
    const imagePromptTimeoutMs = 20 * 60 * 1000;
    const body = {
      prompt,
      positive_prompt: positivePrompt?.trim() || undefined,
      negative_prompt: negativePrompt?.trim() || undefined,
      image_base64: imageBase64,
      strength,
    }; 

    try {
      const response = await this.apiClient.post(urlPath, body, {
        responseType: 'blob',
        timeout: imagePromptTimeoutMs,
      });

      return {
        ok: true,
        apiUrl: this.buildUrl(urlPath),
        statusCode: response.status,
        blobUrl: URL.createObjectURL(response.data),
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.code === 'ECONNABORTED') {
          return { ok: false, apiUrl: this.buildUrl(urlPath), error: `요청 시간 초과 (${imagePromptTimeoutMs}ms)` };
        }
        if (error.response) {
          const gatewayMessage = this.getGatewayErrorMessage(error.response.status);
          return {
            ok: false,
            apiUrl: this.buildUrl(urlPath),
            statusCode: error.response.status,
            error: gatewayMessage || `API 오류: ${error.response.statusText}`,
          };
        }

        if (error.request) {
          return {
            ok: false,
            apiUrl: this.buildUrl(urlPath),
            error: this.getNetworkFailureMessage(urlPath),
          };
        }
      }

      return { ok: false, apiUrl: this.buildUrl(urlPath), error: `요청 실패: ${error.message}` };
    }
  }

  async makeBackgroundImage(imageBase64, prompt = '', positivePrompt = '', negativePrompt = '', taskPrompt = '') {
    const urlPath = '/model/makebgimage';
    const backgroundImageTimeoutMs = 20 * 60 * 1000;
    const body = {
      prompt: prompt?.trim() || undefined,
      positive_prompt: positivePrompt?.trim() || undefined,
      negative_prompt: negativePrompt?.trim() || undefined,
      task_prompt: taskPrompt?.trim() || undefined,
      image_base64: imageBase64,
    };

    try {
      const response = await this.apiClient.post(urlPath, body, {
        responseType: 'blob',
        timeout: backgroundImageTimeoutMs,
      });

      return {
        ok: true,
        apiUrl: this.buildUrl(urlPath),
        statusCode: response.status,
        blobUrl: URL.createObjectURL(response.data),
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.code === 'ECONNABORTED') {
          return { ok: false, apiUrl: this.buildUrl(urlPath), error: `요청 시간 초과 (${backgroundImageTimeoutMs}ms)` };
        }
        if (error.response) {
          const gatewayMessage = this.getGatewayErrorMessage(error.response.status);
          return {
            ok: false,
            apiUrl: this.buildUrl(urlPath),
            statusCode: error.response.status,
            error: gatewayMessage || `API 오류: ${error.response.statusText}`,
          };
        }

        if (error.request) {
          return {
            ok: false,
            apiUrl: this.buildUrl(urlPath),
            error: this.getNetworkFailureMessage(urlPath),
          };
        }
      }

      return { ok: false, apiUrl: this.buildUrl(urlPath), error: `요청 실패: ${error.message}` };
    }
  }
}

export const modelApi = new ModelApi();
export default ModelApi;