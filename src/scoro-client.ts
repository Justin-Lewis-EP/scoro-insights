import axios, { AxiosInstance } from 'axios';
import * as dotenv from 'dotenv';

dotenv.config();

interface ScoroRequestBody {
  apiKey: string;
  company_account_id: string;
  lang: string;
  per_page?: number;
  page?: number;
  request?: Record<string, unknown>;
  filter?: Record<string, unknown>;
}

export interface ScoroResponse<T = unknown> {
  status: string;
  statusCode: number;
  messages?: Record<string, string[]>;
  data: T;
}

export class ScoroClient {
  private http: AxiosInstance;
  private basePayload: Pick<ScoroRequestBody, 'apiKey' | 'company_account_id' | 'lang'>;

  constructor() {
    const apiKey = process.env.SCORO_API_KEY;
    const companyAccountId = process.env.SCORO_COMPANY_ACCOUNT_ID;
    const baseURL = process.env.SCORO_BASE_URL;

    if (!apiKey || !companyAccountId || !baseURL) {
      throw new Error('Missing required env vars: SCORO_API_KEY, SCORO_COMPANY_ACCOUNT_ID, SCORO_BASE_URL');
    }

    this.basePayload = {
      apiKey,
      company_account_id: companyAccountId,
      lang: 'eng',
    };

    this.http = axios.create({
      baseURL,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  async list<T>(
    module: string,
    options: { page?: number; perPage?: number; filter?: Record<string, unknown> } = {}
  ): Promise<ScoroResponse<T>> {
    const { page = 1, perPage = 50, filter } = options;
    const payload: ScoroRequestBody = {
      ...this.basePayload,
      page,
      per_page: perPage,
      request: {},
      ...(filter && { filter }),
    };

    const { data } = await this.http.post<ScoroResponse<T>>(`/${module}/list`, payload);
    return data;
  }

  async view<T>(module: string, id: number): Promise<ScoroResponse<T>> {
    const payload: ScoroRequestBody = {
      ...this.basePayload,
      request: {},
    };

    const { data } = await this.http.post<ScoroResponse<T>>(`/${module}/view/${id}`, payload);
    return data;
  }

  async modify<T>(module: string, fields: Record<string, unknown>, id?: number): Promise<ScoroResponse<T>> {
    const payload: ScoroRequestBody = {
      ...this.basePayload,
      request: fields,
    };

    const endpoint = id ? `/${module}/modify/${id}` : `/${module}/modify`;
    const { data } = await this.http.post<ScoroResponse<T>>(endpoint, payload);
    return data;
  }

  async delete<T>(module: string, id: number): Promise<ScoroResponse<T>> {
    const payload: ScoroRequestBody = {
      ...this.basePayload,
      request: {},
    };

    const { data } = await this.http.post<ScoroResponse<T>>(`/${module}/delete/${id}`, payload);
    return data;
  }
}
