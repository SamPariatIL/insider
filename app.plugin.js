const {
  withPlugins,
  withDangerousMod,
  withAndroidManifest,
  withStringsXml,
  withProjectBuildGradle,
  withAppBuildGradle,
} = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

function withGoogleServicesJson(config) {
  return withDangerousMod(config, [
    'android',
    async (config) => {
      const targetPath = path.join(
        config.modRequest.projectRoot,
        'android',
        'app',
        'google-services.json',
      );

      const googleServicesJsonContent = `{
        "project_info": {
          "project_number": "754166946116",
          "firebase_url": "https://matahari-android.firebaseio.com",
          "project_id": "matahari-android",
          "storage_bucket": "matahari-android.appspot.com"
        },
        "client": [
          {
            "client_info": {
              "mobilesdk_app_id": "1:754166946116:android:529c134dcb2a2c9c",
              "android_client_info": {
                "package_name": "app.ndtv.matahari"
              }
            },
            "oauth_client": [
              {
                "client_id": "754166946116-293auo2n2n1hlp7vnk68i2k0ammtv0gh.apps.googleusercontent.com",
                "client_type": 1,
                "android_info": {
                  "package_name": "app.ndtv.matahari",
                  "certificate_hash": "12e2747704bff1b5e118c08aa6bd47041acd4b02"
                }
              }
            ],
            "api_key": [
              {
                "current_key": "AIzaSyAIX0OOdPPQ3RLgEMXfESPYthJlYhjVgww"
              }
            ],
            "services": {
              "appinvite_service": {
                "other_platform_oauth_client": []
              }
            }
          }
        ],
        "configuration_version": "1"
      }`;

      fs.writeFileSync(targetPath, googleServicesJsonContent.trim());
      return config;
    },
  ]);
}

function withCustomAndroidManifest(config) {
  return withAndroidManifest(config, (config) => {
    const manifest = config.modResults;
    const permissions = [
      'android.permission.ACCESS_FINE_LOCATION',
      'android.permission.ACCESS_COARSE_LOCATION',
      'android.permission.ACCESS_BACKGROUND_LOCATION',
      'android.permission.POST_NOTIFICATIONS',
    ];

    manifest.manifest['uses-permission'] ||= [];
    permissions.forEach((perm) => {
      if (
        !manifest.manifest['uses-permission'].some(
          (p) => p.$['android:name'] === perm,
        )
      ) {
        manifest.manifest['uses-permission'].push({
          $: { 'android:name': perm },
        });
      }
    });

    const app = manifest.manifest.application[0];
    app.activity?.forEach((activity) => {
      if (activity.$['android:name'] === '.MainActivity') {
        activity.$['android:launchMode'] = 'singleTask';
      }
    });

    if (app.$?.['android:allowBackup'] === 'false') {
      delete app.$['android:allowBackup'];
    }

    return config;
  });
}

function withInsiderStrings(config) {
  return withStringsXml(config, async (config) => {
    const exists = config.modResults.resources?.string?.some(
      (item) => item.$?.name === 'insider_notification_icon',
    );

    if (!exists) {
      config.modResults.resources.string.push({
        $: { name: 'insider_notification_icon', translatable: 'false' },
        _: 'ic_notification_icon',
      });
    }

    return config;
  });
}

function withMavenRepos(config) {
  return withProjectBuildGradle(config, (config) => {
    const snippet = `
        maven { url "https://mobilesdk.useinsider.com/android" }
        maven { url "https://developer.huawei.com/repo/" }`;

    if (!config.modResults.contents.includes('mobilesdk.useinsider.com')) {
      config.modResults.contents = config.modResults.contents.replace(
        /allprojects\s*{[^}]*repositories\s*{/,
        (match) => `${match}${snippet}`,
      );
    }

    return config;
  });
}

function withInsiderDependencies(config) {
  return withAppBuildGradle(config, (config) => {
    const dependencies = [
      `implementation 'com.useinsider:insider:14.2.7'`,
      `implementation 'com.useinsider:insiderhybrid:1.1.5'`,
      `implementation 'com.huawei.hms:push:6.5.0.300'`,
      `implementation 'com.huawei.hms:ads-identifier:3.4.39.302'`,
      `implementation 'com.huawei.hms:location:6.4.0.300'`,
    ];

    config.modResults.contents = config.modResults.contents.replace(
      /defaultConfig\s*{([\s\S]*?)}/,
      (match, p1) => {
        if (!p1.includes('manifestPlaceholders')) {
          return match.replace(
            p1,
            `${p1}\n        manifestPlaceholders = [partner: \"mataharitest\"]`,
          );
        }
        return match;
      },
    );

    config.modResults.contents = config.modResults.contents.replace(
      /dependencies\s*{([\s\S]*?)\n}/,
      (match, existingDeps) => {
        const depSet = new Set(
          existingDeps
            .trim()
            .split('\n')
            .map((d) => d.trim()),
        );
        const newDeps = dependencies.filter((d) => !depSet.has(d.trim()));
        return `dependencies {\n${existingDeps}${
          newDeps.length ? '\n' + newDeps.join('\n') : ''
        }\n}`;
      },
    );

    return config;
  });
}

function withProguardRules(config) {
  return withDangerousMod(config, [
    'android',
    async (config) => {
      const proguardPath = path.join(
        config.modRequest.projectRoot,
        'android',
        'app',
        'proguard-rules.pro',
      );

      const rules = `
# Insider ProGuard
-keep class com.useinsider.insider.** { *; }
-dontwarn com.useinsider.insider.**
-keep interface com.useinsider.** { *; }
-keep class org.openudid.** { *; }`;

      const existing = fs.readFileSync(proguardPath, 'utf8');
      if (!existing.includes('com.useinsider')) {
        fs.appendFileSync(proguardPath, rules);
      }

      return config;
    },
  ]);
}

function withAppDelegateDotMM(config) {
  return withDangerousMod(config, [
    'ios',
    (config) => {
      const appDelegateDotMMPath = path.join(
        config.modRequest.projectRoot,
        'ios',
        'AppmakerRuntime',
        'AppDelegate.mm',
      );

      let appDelegateDotMMContent = fs.readFileSync(
        appDelegateDotMMPath,
        'utf8',
      );

      appDelegateDotMMContent = appDelegateDotMMContent.replace(
        `
  return [super application:application didFinishLaunchingWithOptions:launchOptions];
`,
        `
  UNUserNotificationCenter.currentNotificationCenter.delegate = self;

  return [super application:application didFinishLaunchingWithOptions:launchOptions];
`,
      );

      fs.writeFileSync(appDelegateDotMMPath, appDelegateDotMMContent);

      return config;
    },
  ]);
}

module.exports = function withCustom(config) {
  return withPlugins(config, [
    withGoogleServicesJson,
    withCustomAndroidManifest,
    withInsiderStrings,
    withMavenRepos,
    withInsiderDependencies,
    withProguardRules,
    withAppDelegateDotMM,
  ]);
};
