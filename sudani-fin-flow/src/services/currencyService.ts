import api from "@/lib/api";

export interface CurrencyRate {
  id: string;
  currency: string;
  rate: number; // EGP per 1 USD
  validFrom: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CurrentRateResponse {
  status: string;
  data: {
    rate: CurrencyRate;
  };
}

export interface RateHistoryResponse {
  status: string;
  data: {
    currency: string;
    history: CurrencyRate[];
    total: number;
  };
}

export interface SetRateResponse {
  status: string;
  data: {
    message: string;
    rate: CurrencyRate;
  };
}

class CurrencyService {
  async getCurrent(): Promise<CurrencyRate> {
    const res = await api.get<CurrentRateResponse>("/currency/current");
    return res.data.data.rate;
  }

  async getHistory(limit = 10): Promise<CurrencyRate[]> {
    const res = await api.get<RateHistoryResponse>(
      `/currency/history?limit=${limit}`
    );
    return res.data.data.history;
  }

  async setRate(rate: number): Promise<CurrencyRate> {
    const res = await api.post<SetRateResponse>("/currency/rate", { rate });
    return res.data.data.rate;
  }

  async initialize(rate: number): Promise<CurrencyRate> {
    const res = await api.post<SetRateResponse>("/currency/initialize", {
      rate,
    });
    return res.data.data.rate;
  }
}

export const currencyService = new CurrencyService();
