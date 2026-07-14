const { withSettingsGradle } = require('@expo/config-plugins');

const JITPACK_LINE = "        maven { url 'https://jitpack.io' }";

// Enregistre le repo JitPack dans settings.gradle (dependencyResolutionManagement),
// requis pour resoudre 'com.github.GIMPAY:paybutton'. Expo SDK 56 / Gradle 8
// centralisent les repos dans settings.gradle plutot que dans build.gradle
// (allprojects). Si le template genere differe, ajuster ce plugin en consequence.
function withPayButtonJitpack(config) {
  return withSettingsGradle(config, gradleConfig => {
    if (gradleConfig.contents.includes(JITPACK_LINE.trim())) {
      return gradleConfig;
    }

    const repositoriesBlockMatch = gradleConfig.contents.match(
      /(dependencyResolutionManagement\s*{[\s\S]*?repositories\s*{)/,
    );

    if (!repositoriesBlockMatch) {
      console.warn(
        '[withPayButtonJitpack] Bloc dependencyResolutionManagement.repositories introuvable dans settings.gradle. ' +
          "Ajoute manuellement `maven { url 'https://jitpack.io' }` dans le bloc repositories.",
      );
      return gradleConfig;
    }

    gradleConfig.contents = gradleConfig.contents.replace(
      repositoriesBlockMatch[1],
      `${repositoriesBlockMatch[1]}\n${JITPACK_LINE}`,
    );

    return gradleConfig;
  });
}

module.exports = withPayButtonJitpack;
