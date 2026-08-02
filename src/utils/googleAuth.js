import { Capacitor } from '@capacitor/core';
import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';

// Web Client ID — must be used for requestIdToken (NOT the Android Client ID)
const WEB_CLIENT_ID = "1032228296518-72v9ta3tvdropgr45h3ptgkktos1o4r4.apps.googleusercontent.com";

// Initialize native google auth once on android with explicit Web Client ID
if (Capacitor.getPlatform() === 'android') {
  try {
    GoogleAuth.initialize({
      clientId: WEB_CLIENT_ID,
      scopes: ['profile', 'email'],
      grantOfflineAccess: false,
    });
    console.log('🤖 [GoogleAuth] Native initialized with Web Client ID.');
  } catch (e) {
    console.warn("⚠️ [GoogleAuth] Native initialize warning:", e.message);
  }
}

/**
 * Returns the correct Google Client ID depending on whether the app is running
 * natively on Android or on the Web browser.
 */
export const getGoogleClientId = () => {
  const isAndroidApp = Capacitor.getPlatform() === 'android';
  console.log(`🤖 [GoogleAuth] Platform: ${Capacitor.getPlatform()} - Using ID: ${isAndroidApp ? 'Android' : 'Web'}`);
  // Always return Web Client ID — used for ID token validation on the backend
  return WEB_CLIENT_ID;
};

/**
 * Triggers native Google Sign-In if on Android, or falls back to Web GSI overlay click.
 */
export const signInWithGoogle = async (loginWithGoogleCallback) => {
  const isAndroidApp = Capacitor.getPlatform() === 'android';
  
  if (isAndroidApp) {
    console.log("🤖 [GoogleAuth] Native Android Login Triggered...");
    try {
      const googleUser = await GoogleAuth.signIn();
      const idToken = googleUser.authentication.idToken;
      if (!idToken) throw new Error("No ID Token returned from native Google Sign-In.");
      
      console.log("🟢 [GoogleAuth] Native Sign-In success! ID Token received.");
      return await loginWithGoogleCallback(idToken);
    } catch (err) {
      console.error("🔴 [GoogleAuth] Native Google Sign-In Error:", err);
      const statusCode = err.code || "";
      const errorMsg = `Google Sign-in failed: ${err.message || "Error"} (Code: ${statusCode})`;
      return { ok: false, message: errorMsg };
    }
  } else {
    console.log("🌐 [GoogleAuth] Web Google GSI is active. Relying on GSI button iframe overlay.");
    return { ok: true, webFallback: true };
  }
};
