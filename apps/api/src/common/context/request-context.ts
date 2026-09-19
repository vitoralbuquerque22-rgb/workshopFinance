import { AsyncLocalStorage } from 'async_hooks';

export interface RequestContextData {
  requestId: string;
  tenantId?: string;
  userId?: string;
}

export const RequestContext = new AsyncLocalStorage<RequestContextData>();
