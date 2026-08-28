# Basecamp Signal for Android

Basecamp Signal is an Android-only companion for Blended Basecamp. The website opens the app through the `basecampsignal://measure` deep link. After explicit Android permission and user confirmation, the app returns the reading to the originating HTTPS page in the URL fragment.

The fragment avoids placing cellular diagnostics in HTTP request logs. Basecamp removes it from the browser URL after importing it.

## Install the current Android beta

Download the APK from the stable release address:

https://github.com/banhannah2025/cornett-inds/releases/download/android-signal-latest/basecamp-signal-android.apk

The Install Android Companion control in Basecamp uses this same stable release address, so future APK releases do not require changing the website link.

## Local build

Install Android SDK 35, JDK 17, and Gradle 8.10.2, then run:

```bash
gradle :app:assembleDebug
```

The APK is written to `app/build/outputs/apk/debug/app-debug.apk`.
