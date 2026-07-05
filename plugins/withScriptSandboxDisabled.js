const { withXcodeProject } = require('@expo/config-plugins');

/**
 * Disables Xcode's "User Script Sandboxing" for all build configurations. With it enabled
 * (the modern Xcode default), the React Native "Bundle React Native code and images" phase
 * is denied permission to overwrite main.jsbundle on rebuilds, failing the build with
 * `Sandbox: deny(1) file-write-unlink … main.jsbundle`.
 */
module.exports = function withScriptSandboxDisabled(config) {
  return withXcodeProject(config, (cfg) => {
    const project = cfg.modResults;
    const configs = project.pbxXCBuildConfigurationSection();
    for (const key of Object.keys(configs)) {
      const buildSettings = configs[key] && configs[key].buildSettings;
      if (buildSettings) {
        buildSettings.ENABLE_USER_SCRIPT_SANDBOXING = 'NO';
      }
    }
    return cfg;
  });
};
