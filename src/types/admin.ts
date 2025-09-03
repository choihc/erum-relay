// 관리자 관련 타입 정의

export interface GlobalSettings {
  maxParticipants: number;
}

export interface GlobalSettingsResponse {
  success: boolean;
  maxParticipants: number;
}

export interface UpdateGlobalSettingsRequest {
  maxParticipants: number;
}

export interface UpdateGlobalSettingsResponse {
  success: boolean;
  message: string;
  maxParticipants: number;
}

export interface ApiErrorResponse {
  error: string;
}
