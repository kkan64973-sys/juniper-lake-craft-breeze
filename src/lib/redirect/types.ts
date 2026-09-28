export type FormInfo = {
  action: string;
  method: string;
  crossHost: boolean;
};

export type PageInfo = {
  title?: string;
  description?: string;
  passwordInputs: number;
  iframes: number;
  forms: FormInfo[];
  metaRefresh?: string;
};

export type Hop = {
  url: string;
  via?: string;
  status?: number;
  location?: string;
  blocked?: string;
  error?: string;
};

export type TraceResult = {
  hops: Hop[];
  final?: string;
  complete: boolean;
  page?: PageInfo;
  warnings: string[];
  note?: string;
  caveat: string;
  error?: string;
};
