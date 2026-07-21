plugins {
    id("com.android.application")
    // The Flutter Gradle Plugin must be applied after the Android and Kotlin Gradle plugins.
    id("dev.flutter.flutter-gradle-plugin")
}

android {
    namespace = "com.reverb.mobile"
    compileSdk = flutter.compileSdkVersion
    ndkVersion = flutter.ndkVersion

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    defaultConfig {
        // TODO: Specify your own unique Application ID (https://developer.android.com/studio/build/application-id.html).
        applicationId = "com.reverb.mobile"
        // You can update the following values to match your application needs.
        // For more information, see: https://flutter.dev/to/review-gradle-config.
        minSdk = flutter.minSdkVersion
        targetSdk = flutter.targetSdkVersion
        versionCode = flutter.versionCode
        versionName = flutter.versionName
    }

    // Clé de signature de release fournie par l'environnement (CI : secrets
    // GitHub, jamais dans le dépôt). Une clé stable est indispensable à
    // Google Sign-In : Google vérifie l'empreinte SHA-1 de la clé qui signe
    // l'APK contre celle déclarée dans la console Google Cloud - la clé de
    // debug des runners CI, régénérée à chaque build, ne peut pas y être
    // déclarée (connexion Google silencieusement refusée sur l'APK publié).
    val releaseKeystorePath: String? = System.getenv("ANDROID_KEYSTORE_PATH")

    signingConfigs {
        create("release") {
            if (releaseKeystorePath != null) {
                storeFile = file(releaseKeystorePath)
                storePassword = System.getenv("ANDROID_KEYSTORE_PASSWORD")
                keyAlias = System.getenv("ANDROID_KEY_ALIAS") ?: "reverb"
                keyPassword = System.getenv("ANDROID_KEY_PASSWORD")
                    ?: System.getenv("ANDROID_KEYSTORE_PASSWORD")
            }
        }
    }

    buildTypes {
        release {
            // Sans clé fournie (poste de dev), repli sur la clé de debug pour
            // que `flutter run --release` local reste possible.
            signingConfig = if (releaseKeystorePath != null) {
                signingConfigs.getByName("release")
            } else {
                signingConfigs.getByName("debug")
            }
        }
    }
}

kotlin {
    compilerOptions {
        jvmTarget = org.jetbrains.kotlin.gradle.dsl.JvmTarget.JVM_17
    }
}

flutter {
    source = "../.."
}
