import { debugLog } from "@/constants/debug";
import { SERVER_URL } from "@/constants/server";
import { ApiRequest, ApiResponse } from "@/types/api";
import { getFromSecureStore } from "@/utiles/secure-storage";
import NetInfo from "@react-native-community/netinfo";
import axios, { AxiosError, AxiosResponse } from "axios";
import { Platform } from "react-native";

// API Base URLs
const GIGGLAM_API_BASE = "https://nirvanatechlabs.in/gigglam/api";
const DATA_API_BASE = `${GIGGLAM_API_BASE}/data`;
const UPLOAD_API_BASE = GIGGLAM_API_BASE;

// Legacy API for room management
const api = axios.create({
  baseURL: SERVER_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Data API for authentication and general data operations
const dataApi = axios.create({
  baseURL: DATA_API_BASE,
  headers: {
    "Content-Type": "application/json",
    app_secret: "_g_i_g_g_l_a_m_",
  },
  timeout: 30000,
});

// Upload API for file uploads and contest operations
const uploadApi = axios.create({
  baseURL: UPLOAD_API_BASE,
  headers: {
    app_secret: "_g_i_g_g_l_a_m_",
  },
  timeout: 30000,
});

// Check internet before making requests
const checkInternetInterceptor = async (config: any) => {
  const netInfo = await NetInfo.fetch();
  if (!netInfo.isConnected) {
    return Promise.reject(new Error("No internet connection"));
  }
  return config;
};

// Add internet check to all API instances
dataApi.interceptors.request.use(checkInternetInterceptor);
uploadApi.interceptors.request.use(checkInternetInterceptor);
api.interceptors.request.use(checkInternetInterceptor);

// Request interceptor for uploadApi to automatically add auth tokens
uploadApi.interceptors.request.use(
  async (config) => {
    try {
      const token = await getFromSecureStore("userToken");
      const userId = await getFromSecureStore("userId");

      if (token && userId) {
        config.headers.Authorization = `Bearer ${token}`;
      } else {
        debugLog.warn(
          "⚠️ Missing authentication data, attempting to refresh from storage",
          {
            hasToken: !!token,
            hasUserId: !!userId,
          }
        );

        // Try to get fresh tokens from storage one more time
        const freshToken = await getFromSecureStore("userToken");
        const freshUserId = await getFromSecureStore("userId");

        if (freshToken && freshUserId) {
          debugLog.info("✅ Found fresh tokens in storage, using them");
          config.headers.Authorization = `Bearer ${freshToken}`;
          // Also set the auth token for future requests
          dataApi.defaults.headers.common[
            "Authorization"
          ] = `Bearer ${freshToken}`;
          uploadApi.defaults.headers.common[
            "Authorization"
          ] = `Bearer ${freshToken}`;
        } else {
          debugLog.error("❌ Authentication failed - no valid tokens found", {
            hasFreshToken: !!freshToken,
            hasFreshUserId: !!freshUserId,
          });
          return Promise.reject(
            new Error(
              `Authentication failed: ${
                !freshToken ? "token" : "userId"
              } is missing from secure storage`
            )
          );
        }
      }

      // Remove Content-Type for FormData requests to let axios set it automatically
      if (config.data instanceof FormData) {
        delete config.headers["Content-Type"];
      }
    } catch (error) {
      debugLog.error("Error getting auth token:", error);
      return Promise.reject(error);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for uploadApi
uploadApi.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    debugLog.error("❌ Upload API Error", {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
    });
    return Promise.reject(error);
  }
);

dataApi.interceptors.request.use(
  async (config) => {
    try {
      const token = await getFromSecureStore("userToken");

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      } else {
        // If no token is available, check if this is a request that requires auth
        const requiresAuth =
          config.data?.eventName &&
          ![
            "send_otp",
            "verify_otp",
            "app_user_register",
            "fetch_acc",
          ].includes(config.data.eventName);

        if (requiresAuth) {
          debugLog.warn(
            "🚫 Blocking authenticated request - no token available",
            {
              eventName: config.data.eventName,
            }
          );
          return Promise.reject(
            new Error("Authentication required - user not logged in")
          );
        }
      }
    } catch (error) {
      debugLog.error("Error getting auth token for data API:", error);
      return Promise.reject(error);
    }

    return config;
  },
  (error: AxiosError) => {
    debugLog.error("❌ Data API Request Error", error);
    return Promise.reject(error);
  }
);

dataApi.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error: AxiosError) => {
    const errorInfo = {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      config: {
        url: error.config?.url,
        method: error.config?.method,
        data: error.config?.data,
      },
    };

    debugLog.error("❌ API Response Error", errorInfo);

    if (error.code === "ECONNABORTED") {
      debugLog.error("⏰ API Request Timeout", {
        timeout: error.config?.timeout,
      });
    } else if (error.code === "ERR_NETWORK") {
      debugLog.error("🌐 Network Error", {
        message: "No internet connection or server unreachable",
      });
    } else if (error.response?.status === 401) {
      debugLog.warn("🔐 Authentication Error", {
        message: "Unauthorized - token may be expired",
      });
    } else if (error.response?.status === 500) {
      debugLog.error("🔥 Server Error", { message: "Internal server error" });
    }

    return Promise.reject(error);
  }
);

/**
 * Sets authentication token for API requests
 * @param token - The JWT token for authenticated requests
 */
export const setApiAuthToken = (token: string) => {
  dataApi.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  uploadApi.defaults.headers.common["Authorization"] = `Bearer ${token}`;

  // Clear auth cache since token changed
  authCache = null;
};

// Cache for authentication status to prevent redundant calls
let authCache: {
  timestamp: number;
  result: {
    success: boolean;
    hasToken: boolean;
    hasUserId: boolean;
    token?: string;
    userId?: string;
  };
} | null = null;

const AUTH_CACHE_DURATION = 30000; // 30 seconds

/**
 * Initialize authentication when app starts or when navigating to authenticated screens
 * Uses caching to prevent redundant calls within 30 seconds
 */
export const initializeAuth = async (
  forceRefresh = false
): Promise<{
  success: boolean;
  hasToken: boolean;
  hasUserId: boolean;
  token?: string;
  userId?: string;
}> => {
  try {
    // Check cache first (unless forced refresh)
    const now = Date.now();
    if (
      !forceRefresh &&
      authCache &&
      now - authCache.timestamp < AUTH_CACHE_DURATION
    ) {
      return authCache.result;
    }

    const token = await getFromSecureStore("userToken");
    const userId = await getFromSecureStore("userId");

    const result = {
      success: !!(token && userId),
      hasToken: !!token,
      hasUserId: !!userId,
      token: token || undefined,
      userId: userId || undefined,
    };

    if (token && userId) {
      // Set the tokens globally for all API instances
      setApiAuthToken(token);
    } else {
      debugLog.warn("⚠️ Authentication data incomplete - user needs to login", {
        missingToken: !token,
        missingUserId: !userId,
      });
    }

    // Update cache
    authCache = {
      timestamp: now,
      result,
    };

    return result;
  } catch (error) {
    const errorResult = { success: false, hasToken: false, hasUserId: false };

    authCache = {
      timestamp: Date.now(),
      result: errorResult,
    };

    return errorResult;
  }
};

/**
 * Clear authentication cache - useful when auth state changes
 */
export const clearAuthCache = () => {
  authCache = null;
};

/**
 * Legacy function - use initializeAuth instead
 * @deprecated Use initializeAuth for better functionality
 */
export const reinitializeAuth = async (): Promise<{
  success: boolean;
  hasToken: boolean;
  hasUserId: boolean;
}> => {
  const result = await initializeAuth(true); // Force refresh for legacy compatibility
  return {
    success: result.success,
    hasToken: result.hasToken,
    hasUserId: result.hasUserId,
  };
};

/**
 * Check if user is properly authenticated for API calls
 */
export const checkAuthStatus = async (): Promise<{
  isAuthenticated: boolean;
  hasToken: boolean;
  hasUserId: boolean;
  message: string;
}> => {
  try {
    const token = await getFromSecureStore("userToken");
    const userId = await getFromSecureStore("userId");

    const hasToken = !!token;
    const hasUserId = !!userId;
    const isAuthenticated = hasToken && hasUserId;

    let message = "";
    if (isAuthenticated) {
      message = "User is properly authenticated";
    } else if (!hasToken && !hasUserId) {
      message = "User needs to login - missing both token and userId";
    } else if (!hasToken) {
      message = "User needs to login - missing authentication token";
    } else if (!hasUserId) {
      message = "User needs to login - missing userId";
    }

    return { isAuthenticated, hasToken, hasUserId, message };
  } catch (error) {
    debugLog.error("❌ Error checking auth status:", error);
    return {
      isAuthenticated: false,
      hasToken: false,
      hasUserId: false,
      message: "Error checking authentication status",
    };
  }
};

/**
 * Removes authentication token from API requests
 */
export const clearApiAuthToken = () => {
  delete dataApi.defaults.headers.common["Authorization"];
  delete uploadApi.defaults.headers.common["Authorization"];

  // Also clear from legacy API
  delete api.defaults.headers.common["Authorization"];

  // Clear auth cache when logging out
  clearAuthCache();
};

/**
 * Legacy: Sets device header for old API endpoints
 * @param deviceId - The unique ID of the user's device
 */
export const setApiDeviceHeader = (deviceId: string) => {
  api.defaults.headers.common["x-device-id"] = deviceId;
};

const handleApiError = (error: AxiosError, eventName: string): never => {
  const errorMessage =
    error.response?.data || error.message || "Unknown error occurred";
  const statusCode = error.response?.status || 0;

  const enhancedError = new Error(`API Error (${eventName}): ${errorMessage}`);
  (enhancedError as any).statusCode = statusCode;
  (enhancedError as any).eventName = eventName;
  (enhancedError as any).originalError = error;

  throw enhancedError;
};

export const makeApiRequest = async <T>(
  request: ApiRequest
): Promise<ApiResponse<T>> => {
  try {
    const response = await dataApi.post<ApiResponse<T>>("", request);
    return response.data;
  } catch (error) {
    return handleApiError(error as AxiosError, request.eventName);
  }
};

export const updateProfile = async (
  imageUri: string,
  name: string
): Promise<{ success: boolean; message: string; data?: any }> => {
  try {
    const token = await getFromSecureStore("userToken");
    if (!token) {
      throw new Error("Authentication token is required");
    }

    const fileExtension = imageUri.split(".").pop()?.toLowerCase() || "jpg";
    const fileName = `profile_image_${Date.now()}.${fileExtension}`;
    const mimeType = `image/${
      fileExtension === "jpg" ? "jpeg" : fileExtension
    }`;

    const formData = new FormData();
    formData.append("eventName", "update_profile");
    formData.append("file_to", "profile_image");
    formData.append("file", {
      uri:
        Platform.OS === "android" ? imageUri : imageUri.replace("file://", ""),
      type: mimeType,
      name: fileName,
    } as any);
    formData.append("name", name);

    const response = await axios.post(
      "https://nirvanatechlabs.in/gigglam/api/upload",
      formData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          app_secret: "_g_i_g_g_l_a_m_",
          "Content-Type": "multipart/form-data",
        },
      }
    );

    return {
      success: true,
      message: response.data.message || "Profile updated successfully!",
      data: response.data,
    };
  } catch (error: AxiosError | any) {
    const axiosError = error as AxiosError;
    const errorData = axiosError.response?.data as any;
    const statusCode = axiosError.response?.status || 0;
    const errorMessage =
      errorData?.message ||
      axiosError.message ||
      "Network error occurred while updating profile";

    return {
      success: false,
      message: errorMessage,
      data: { statusCode, error: errorData },
    };
  }
};

// Legal Documents API
export interface LegalDocument {
  _id: string;
  title: string;
  content: string;
  version: string;
  updatedAt: string;
}

export const getPrivacyPolicy = async (): Promise<
  ApiResponse<LegalDocument>
> => {
  try {
    const response = await dataApi.post("", {
      eventName: "get_privacy_policy",
    });

    return response.data;
  } catch (error) {
    debugLog.error("❌ Error fetching privacy policy", error);
    throw error;
  }
};

export const getTermsOfUse = async (): Promise<ApiResponse<LegalDocument>> => {
  try {
    const response = await dataApi.post("", {
      eventName: "get_terms_of_use",
    });

    return response.data;
  } catch (error) {
    debugLog.error("❌ Error fetching terms of use", error);
    throw error;
  }
};

export const getLibraryLicense = async (): Promise<
  ApiResponse<LegalDocument>
> => {
  try {
    const response = await dataApi.post("", {
      eventName: "get_library_license",
    });

    return response.data;
  } catch (error) {
    debugLog.error("❌ Error fetching library license", error);
    throw error;
  }
};
