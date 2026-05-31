export enum ClientErrorKind {
  RENDER = 'RENDER',
  QUERY = 'QUERY',
  MUTATION = 'MUTATION',
  NETWORK = 'NETWORK',
  JSON = 'JSON',
}

export interface ClientErrorCreateDto {
  kind: ClientErrorKind;
  message: string;
  stack?: string;
  screen?: string;
  apiPath?: string;
  deviceId?: string;
  platform?: string;
  appVersion?: string;
}

export interface ClientErrorReportDto {
  id: string;
  kind: ClientErrorKind;
  message: string;
  stack: string | null;
  screen: string | null;
  apiPath: string | null;
  deviceId: string | null;
  platform: string | null;
  appVersion: string | null;
  createdAt: string;
}
