import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "https://student-os-backend-44v4.onrender.com";
const bs = BACKEND_URL.replace(/\/$/, "") + "/api";
console.log(`🚀 [AuthContext] Actual API URL being called:`, bs);

export const xs = axios.create({ baseURL: bs, timeout: 60000 });

xs.defaults.headers.common[`bypass-tunnel-reminder`] = `true`;
xs.defaults.headers.common[`ngrok-skip-browser-warning`] = `true`;

// Self health check
(async () => {
  try {
    let e = bs.replace(/\/api$/, ``);
    let { data: t } = await axios.get(e, { timeout: 15000 });
    console.log(`🟢 [Health Check] Backend is UP:`, t);
    return true;
  } catch (e) {
    console.warn(`🔴 [Health Check] Backend might be down or waking up:`, e.message);
    return false;
  }
})();

const retryRequest = async (config) => {
  config.__retryCount = config.__retryCount || 0;
  if (config.__retryCount >= 3) return null;
  config.__retryCount += 1;
  let t = 2 ** config.__retryCount * 1000 + Math.random() * 500;
  await new Promise((resolve) => setTimeout(resolve, t));
  return xs(config);
};

xs.interceptors.request.use((config) => {
  let t = localStorage.getItem(`sos_token`);
  if (t) {
    config.headers.Authorization = `Bearer ${t}`;
  }
  return config;
});

let isRefreshing = false;
let refreshQueue = [];
const processQueue = (error, token = null) => {
  refreshQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  refreshQueue = [];
};

xs.interceptors.response.use(
  (response) => response,
  async (error) => {
    let { config, message, code } = error;
    let isLoginPost = config && config.method === `post` && config.url.includes(`/auth/login`);
    
    // Auto retry connection/server errors
    if (
      config &&
      (!error.response || error.response.status >= 500) &&
      (config.method !== `post` || isLoginPost) &&
      (code === `ECONNABORTED` ||
        message === `Network Error` ||
        error.response?.status === 502 ||
        error.response?.status === 503 ||
        error.response?.status === 504)
    ) {
      let res = await retryRequest(config);
      if (res) return res;
    }

    // Refresh token logic
    if (error.response?.status === 401 && !config._retry) {
      let rToken = localStorage.getItem(`sos_refresh_token`);
      if (
        config.url.includes(`/auth/login`) ||
        config.url.includes(`/auth/refresh`) ||
        !rToken
      ) {
        window.dispatchEvent(new Event(`sos-unauthorized`));
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise(function (resolve, reject) {
          refreshQueue.push({ resolve, reject });
        })
          .then((token) => {
            config.headers.Authorization = `Bearer ` + token;
            return xs(config);
          })
          .catch((err) => Promise.reject(err));
      }

      config._retry = true;
      isRefreshing = true;
      try {
        let tokenRes = await axios.post(`${bs}/auth/refresh`, { token: rToken });
        let newToken = tokenRes.data.token;
        let newRefreshToken = tokenRes.data.refreshToken;
        localStorage.setItem(`sos_token`, newToken);
        // Store rotated refresh token if backend returned one
        if (newRefreshToken) {
          localStorage.setItem(`sos_refresh_token`, newRefreshToken);
        }
        xs.defaults.headers.common.Authorization = `Bearer ` + newToken;
        processQueue(null, newToken);
        config.headers.Authorization = `Bearer ` + newToken;
        return xs(config);
      } catch (err) {
        processQueue(err, null);
        window.dispatchEvent(new Event(`sos-unauthorized`));
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }

    if (!(
      config?.url &&
      (config.url.includes(`/auth/login`) ||
        config.url.includes(`/auth/register`) ||
        config.url.includes(`/auth/profile`) ||
        config.url.includes(`/auth/refresh`) ||
        config.url.includes(`/ai`))
    )) {
      let errMsg = error.response?.data?.message || (error.response ? `Request failed with status ${error.response.status}` : `Connection issue detected. Retrying...`);
      if (
        error.response?.status === 502 ||
        error.response?.status === 503 ||
        error.response?.status === 504
      ) {
        errMsg = `Cloud services are starting. This may take a few seconds.`;
        toast(errMsg, { icon: `⏳`, duration: 4000 });
      } else {
        if (!error.response && (code === `ECONNABORTED` || message === `Network Error` || message?.includes('Network'))) {
          errMsg = `Connection issue detected. Retrying...`;
        }
        toast.error(errMsg);
      }
    }
    return Promise.reject(error);
  }
);

export const AuthContext = createContext(null);

export const useAuth = () => {
  let context = useContext(AuthContext);
  if (!context) throw Error(`useAuth must be used inside AuthProvider`);
  return context;
};

export const AuthProvider = ({ children }) => {
  let [user, setUser] = useState(() => {
    let savedUser = localStorage.getItem(`sos_user`);
    if (savedUser) {
      try {
        return JSON.parse(savedUser);
      } catch {}
    }
    return null;
  });
  
  let [loading, setLoading] = useState(() => {
    let token = localStorage.getItem(`sos_token`);
    let savedUser = localStorage.getItem(`sos_user`);
    return !!(token && !savedUser);
  });

  let [error, setError] = useState(null);

  const saveAuthData = (userData) => {
    if (userData.token) localStorage.setItem(`sos_token`, userData.token);
    if (userData.refreshToken) localStorage.setItem(`sos_refresh_token`, userData.refreshToken);
    localStorage.setItem(`sos_user`, JSON.stringify(userData));
    setUser(userData);
  };

  const logoutAction = () => {
    let rToken = localStorage.getItem(`sos_refresh_token`);
    if (rToken) {
      axios.post(`${bs}/auth/logout`, { token: rToken }).catch(() => {});
    }
    localStorage.removeItem(`sos_token`);
    localStorage.removeItem(`sos_refresh_token`);
    localStorage.removeItem(`sos_user`);
    setUser(null);
  };

  useEffect(() => {
    (async () => {
      if (!localStorage.getItem(`sos_token`)) {
        setLoading(false);
        return;
      }
      if (localStorage.getItem(`sos_user`)) {
        setLoading(false);
      }
      try {
        let { data: profile } = await xs.get(`/auth/profile`);
        saveAuthData(profile);
      } catch (e) {
        if (e.response?.status === 401) {
          logoutAction();
        } else {
          let savedUser = localStorage.getItem(`sos_user`);
          if (savedUser) {
            try {
              setUser(JSON.parse(savedUser));
            } catch {}
          } else {
            logoutAction();
          }
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  let [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleUnauthorized = () => {
      logoutAction();
      toast.error(`Session expired. Please log in again.`, { duration: 4000 });
    };
    window.addEventListener(`sos-unauthorized`, handleUnauthorized);

    const handleOnline = () => {
      setIsOnline(true);
      toast.success(`✅ Connection Restored ⚡`, {
        id: `network-status`,
        duration: 4000,
        style: {
          background: `rgba(16, 185, 129, 0.95)`,
          color: `#fff`,
          backdropFilter: `blur(10px)`,
          border: `1px solid rgba(255, 255, 255, 0.2)`,
          borderRadius: `16px`,
        },
      });
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast.error(`❌ Offline Mode Enabled`, {
        id: `network-status`,
        duration: 5000,
        style: {
          background: `rgba(239, 68, 68, 0.95)`,
          color: `#fff`,
          backdropFilter: `blur(10px)`,
          border: `1px solid rgba(255, 255, 255, 0.2)`,
          borderRadius: `16px`,
        },
      });
    };

    window.addEventListener(`online`, handleOnline);
    window.addEventListener(`offline`, handleOffline);

    return () => {
      window.removeEventListener(`sos-unauthorized`, handleUnauthorized);
      window.removeEventListener(`online`, handleOnline);
      window.removeEventListener(`offline`, handleOffline);
    };
  }, []);

  const register = useCallback(async (formData) => {
    setError(null);
    try {
      let { data } = await xs.post(`/auth/register`, formData);
      saveAuthData(data);
      return { ok: true };
    } catch (e) {
      let msg =
        e.code === `ECONNABORTED` ||
        e.message === `Network Error` ||
        !e.response
          ? `Cannot reach server. Check your internet connection or make sure the backend is running.`
          : e.response?.data?.message || `Registration failed. Please try again.`;
      setError(msg);
      return { ok: false, message: msg };
    }
  }, []);

  const login = useCallback(async (email, password) => {
    setError(null);
    try {
      let { data } = await xs.post(`/auth/login`, { email, password });
      saveAuthData(data);
      return { ok: true, data };
    } catch (e) {
      let msg =
        e.code === `ECONNABORTED` ||
        e.message === `Network Error` ||
        !e.response
          ? `Cannot reach server. Check your internet connection or make sure the backend is running.`
          : e.response?.data?.message || `Login failed. Check your credentials.`;
      setError(msg);
      return { ok: false, message: msg };
    }
  }, []);

  const collegeLogin = useCallback(async (collegeCode, rollNumber, password) => {
    setError(null);
    try {
      let { data } = await xs.post(`/auth/college-login`, { collegeCode, rollNumber, password });
      saveAuthData(data);
      return { ok: true, data };
    } catch (e) {
      let msg = e.response?.data?.message || `College login failed. Check your credentials.`;
      setError(msg);
      return { ok: false, message: msg };
    }
  }, []);

  const changePassword = useCallback(async (currentPassword, newPassword) => {
    try {
      let { data } = await xs.put(`/auth/change-password`, { currentPassword, newPassword });
      saveAuthData(data.user); // updates active session profile
      return { ok: true };
    } catch (e) {
      return { ok: false, message: e.response?.data?.message || `Password change failed.` };
    }
  }, []);

  const linkCollegeAccount = useCallback(async (collegeCode, rollNumber, password) => {
    try {
      let { data } = await xs.post(`/auth/colleges/link`, { collegeCode, rollNumber, password });
      saveAuthData(data.user); // updates active session profile
      return { ok: true };
    } catch (e) {
      return { ok: false, message: e.response?.data?.message || `Account linking failed.` };
    }
  }, []);

  const loginWithGoogle = useCallback(async (token) => {
    setError(null);
    try {
      let { data } = await xs.post(`/auth/google-login`, { token });
      saveAuthData(data);
      return { ok: true };
    } catch (e) {
      let msg = e.response?.data?.message || `Google Sign-in failed.`;
      setError(msg);
      return { ok: false, message: msg };
    }
  }, []);

  const logout = useCallback(() => {
    logoutAction();
  }, []);

  const updateProfile = useCallback(async (profileData) => {
    try {
      let { data } = await xs.put(`/auth/profile`, profileData);
      setUser((current) => {
        let updated = { ...current, ...data };
        localStorage.setItem(`sos_user`, JSON.stringify(updated));
        return updated;
      });
      return { ok: true };
    } catch (e) {
      return {
        ok: false,
        message: e.response?.data?.message || `Update failed.`,
      };
    }
  }, []);

  const fetchDashboard = useCallback(async () => {
    try {
      let { data } = await xs.get(`/auth/dashboard`);
      return { ok: true, data };
    } catch {
      return { ok: false };
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        register,
        login,
        collegeLogin,
        changePassword,
        linkCollegeAccount,
        loginWithGoogle,
        logout,
        updateProfile,
        fetchDashboard,
        clearError,
        isOnline,
        API: xs,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
