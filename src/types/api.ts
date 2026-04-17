export interface ApiResponse<T> {
  data?: T;
  error?: string;
  details?: unknown;
}
