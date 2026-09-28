<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/30f6ff5b-f666-4e27-b8f4-83a9638fdca7

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Android APK

The project is configured for Android using Capacitor.

### Local

```bash
npm install
npm run build
npx cap add android
npx cap sync android
cd android
./gradlew assembleDebug
```

The debug APK will be generated at:
`android/app/build/outputs/apk/debug/app-debug.apk`

### GitHub Actions

The workflow at `.github/workflows/build-android.yml` builds the web app, creates/syncs the Android project, builds the debug APK, and uploads it as the `Fake-App-APK` artifact.
