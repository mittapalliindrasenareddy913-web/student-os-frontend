# ============================================================================
# Production-Ready ProGuard / R8 Rules for Student OS (Android 15 SDK 35)
# ============================================================================

# Optimization & Obfuscation Settings
-optimizationpasses 5
-dontusemixedcaseclassnames
-dontskipnonpubliclibraryclasses
-dontpreverify
-verbose
-allowaccessmodification

# Keep source file names and line numbers for stack trace demangling
-keepattributes SourceFile,LineNumberTable,Signature,InnerClasses,EnclosingMethod,*Annotation*,Exceptions,JavascriptInterface

# ----------------------------------------------------------------------------
# WebView & Capacitor Bridge Rules
# ----------------------------------------------------------------------------
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}
-keep class com.getcapacitor.** { *; }
-keep interface com.getcapacitor.** { *; }
-keep class org.apache.cordova.** { *; }

# ----------------------------------------------------------------------------
# Google Play Services & Google Auth Plugins
# ----------------------------------------------------------------------------
-keep class com.google.android.gms.** { *; }
-dontwarn com.google.android.gms.**
-keep class com.codetrixstudio.capacitor.googleauth.** { *; }

# ----------------------------------------------------------------------------
# Firebase Rules
# ----------------------------------------------------------------------------
-keep class com.google.firebase.** { *; }
-dontwarn com.google.firebase.**
-keepclassmembers class com.google.firebase.** { *; }

# ----------------------------------------------------------------------------
# Networking (OkHttp / Retrofit) & Notifications
# ----------------------------------------------------------------------------
-keep class okhttp3.** { *; }
-keep interface okhttp3.** { *; }
-dontwarn okhttp3.**
-dontwarn okio.**

# ----------------------------------------------------------------------------
# AndroidX & Material Components
# ----------------------------------------------------------------------------
-keep class androidx.** { *; }
-dontwarn androidx.**
-keep class com.google.android.material.** { *; }

# ----------------------------------------------------------------------------
# General Reflection & Serialization Guards
# ----------------------------------------------------------------------------
-keepclasseswithmembernames class * {
    native <methods>;
}

-keepclassmembers enum * {
    public static **[] values();
    public static ** valueOf(java.lang.String);
}

-keep class * implements android.os.Parcelable {
    public static final android.os.Parcelable$Creator *;
}

-keepclassmembers class * implements java.io.Serializable {
    static final long serialVersionUID;
    private static final java.io.ObjectStreamField[] serialPersistentFields;
    private void writeObject(java.io.ObjectOutputStream);
    private void readObject(java.io.ObjectInputStream);
    java.lang.Object writeReplace();
    java.lang.Object readResolve();
}
