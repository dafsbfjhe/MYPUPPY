interface KakaoAuthResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  scope: string;
}

interface KakaoUserResponse {
  id: number;
  connected_at: string;
  properties: {
    nickname: string;
    profile_image: string;
    thumbnail_image: string;
  };
  kakao_account: {
    profile_nickname_needs_agreement: boolean;
    profile_image_needs_agreement: boolean;
    profile: {
      nickname: string;
      thumbnail_image_url: string;
      profile_image_url: string;
      is_default_image: boolean;
    };
    has_email: boolean;
    email_needs_agreement: boolean;
    is_email_valid: boolean;
    is_email_verified: boolean;
    email: string;
  };
}

interface Kakao {
  init: (apiKey: string) => void;
  isInitialized: () => boolean;
  Auth: {
    login: (options: {
      success: (authObj: KakaoAuthResponse) => void;
      fail: (err: any) => void;
    }) => void;
    logout: () => void;
  };
  API: {
    request: (options: {
      url: string;
      success: (response: KakaoUserResponse) => void;
      fail: (err: any) => void;
    }) => void;
  };
}

declare global {
  interface Window {
    Kakao: Kakao;
  }
}

export {};
