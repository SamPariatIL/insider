// app.plugin.js
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
        'google-services.json'
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
        },
        {
          "client_id": "754166946116-5g8sbdlsgn5evcv6d3bl2ji4oh5q196t.apps.googleusercontent.com",
          "client_type": 1,
          "android_info": {
            "package_name": "app.ndtv.matahari",
            "certificate_hash": "5e8f16062ea3cd2c4a0d547876baa6f38cabf625"
          }
        },
        {
          "client_id": "754166946116-vr5am89348c1gginc2b48c0p1t17v3em.apps.googleusercontent.com",
          "client_type": 1,
          "android_info": {
            "package_name": "app.ndtv.matahari",
            "certificate_hash": "1c8046b09f97323f3168600fbfb1de2b6991ad6c"
          }
        },
        {
          "client_id": "754166946116-ja290ie3jkjg46vr8m46cr6j7lm2ockp.apps.googleusercontent.com",
          "client_type": 3
        }
      ],
      "api_key": [
        {
          "current_key": "AIzaSyAIX0OOdPPQ3RLgEMXfESPYthJlYhjVgww"
        }
      ],
      "services": {
        "appinvite_service": {
          "other_platform_oauth_client": [
            {
              "client_id": "754166946116-ja290ie3jkjg46vr8m46cr6j7lm2ockp.apps.googleusercontent.com",
              "client_type": 3
            },
            {
              "client_id": "754166946116-1tgkaa5hgkcv6kgv8almfijfkd02tr76.apps.googleusercontent.com",
              "client_type": 2,
              "ios_info": {
                "bundle_id": "com.matahari.com"
              }
            }
          ]
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
    const permissionsToAdd = [
      { $: { 'android:name': 'android.permission.ACCESS_FINE_LOCATION' } },
      { $: { 'android:name': 'android.permission.ACCESS_COARSE_LOCATION' } },
      { $: { 'android:name': 'android.permission.ACCESS_BACKGROUND_LOCATION' } },
      { $: { 'android:name': 'android.permission.POST_NOTIFICATIONS' } },
    ];

    manifest.manifest['uses-permission'] =
      manifest.manifest['uses-permission'] || [];
    permissionsToAdd.forEach((permission) => {
      if (!manifest.manifest['uses-permission'].some(
        (existing) => existing.$['android:name'] === permission.$['android:name']
      )) {
        manifest.manifest['uses-permission'].push(permission);
      }
    });

    const app = manifest.manifest.application[0];
    if (app['activity']) {
      app['activity'].forEach((activity) => {
        if (activity['$']['android:name'] === '.MainActivity') {
          activity['$']['android:launchMode'] = 'singleTask';
        }
      });
    }

    // Remove android:allowBackup="false"
    if (app['$'] && app['$']['android:allowBackup'] === 'false') {
      delete app['$']['android:allowBackup'];
    }

    return config;
  });
}

function withInsiderStrings(config) {
  return withStringsXml(config, async (config) => {
    const iconKey = 'insider_notification_icon';
    const alreadyExists = config.modResults.resources?.string?.some(
      (item) => item.$?.name === iconKey
    );

    if (!alreadyExists) {
      config.modResults.resources.string.push({
        $: { name: iconKey, translatable: 'false' },
        _: 'ic_notification_icon',
      });
    }

    return config;
  });
}

function withMavenRepos(config) {
  return withProjectBuildGradle(config, (config) => {
    const repoSnippet = `maven { url \"https://mobilesdk.useinsider.com/android\" }\nmaven { url \"https://developer.huawei.com/repo/\" }`;
    if (!config.modResults.contents.includes('mobilesdk.useinsider.com')) {
      config.modResults.contents = config.modResults.contents.replace(
        /allprojects[\s\S]*?repositories[\s\S]*?{/,
        (match) => `${match}\n        ${repoSnippet}`
      );
    }
    return config;
  });
}

function withInsiderDependencies(config) {
  return withAppBuildGradle(config, (config) => {
    const dependenciesToAdd = [
      `    implementation 'com.useinsider:insider:14.2.7'`,
      `    implementation 'com.useinsider:insiderhybrid:1.1.5'`,
      `    implementation 'com.huawei.hms:push:6.5.0.300'`,
      `    implementation 'com.huawei.hms:ads-identifier:3.4.39.302'`,
      `    implementation 'com.huawei.hms:location:6.4.0.300'`
    ];

    // Add manifestPlaceholders
    config.modResults.contents = config.modResults.contents.replace(
      /defaultConfig\s*{([\s\S]*?)}/,
      (match, p1) => {
        if (!p1.includes('manifestPlaceholders')) {
          return match.replace(
            p1,
            `${p1}\n        manifestPlaceholders = [partner:\"mataharitest\"]`
          );
        }
        return match;
      }
    );

    config.modResults.contents = config.modResults.contents.replace(
      /dependencies\s*{([\s\S]*?)\n}/,
      (match, deps) => {
        const existingLines = deps.split('\n').map(line => line.trim());
        const newDeps = dependenciesToAdd.filter(
          (dep) => !existingLines.includes(dep.trim())
        );
        return `dependencies {\n${deps}${newDeps.length ? '\n' + newDeps.join('\n') : ''}\n}`;
      }
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
        'proguard-rules.pro'
      );
      const rules = `
-keep class com.useinsider.insider.Insider { *; }
-keep interface com.useinsider.insider.InsiderCallback { *; }
-keep class com.useinsider.insider.InsiderUser { *; }
-keep class com.useinsider.insider.InsiderProduct { *; }
-keep class com.useinsider.insider.InsiderEvent { *; }
-keep class com.useinsider.insider.InsiderCallbackType { *; }
-keep class com.useinsider.insider.InsiderGender { *; }
-keep class com.useinsider.insider.InsiderIdentifiers { *; }
-keep interface com.useinsider.insider.RecommendationEngine$SmartRecommendation { *; }
-keep interface com.useinsider.insider.MessageCenterData { *; }
-keep class com.useinsider.insider.Geofence { *; }
-keep class com.useinsider.insider.ContentOptimizerDataType { *; }
-keep class org.openudid.** { *; }
-keep class com.useinsider.insider.OpenUDID_manager { *; }`;

      const current = fs.readFileSync(proguardPath, 'utf8');
      if (!current.includes('com.useinsider')) {
        fs.appendFileSync(proguardPath, rules);
      }

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
  ]);
};
