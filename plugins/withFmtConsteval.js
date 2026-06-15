// Expo config plugin: make the `fmt` library compile under the iOS 26 SDK
// (Xcode 26). fmt's FMT_STRING uses `consteval`, which the newer Clang rejects
// with "call to consteval function ... is not a constant expression".
// Defining FMT_USE_CONSTEVAL=0 forces fmt to fall back to constexpr.
const { withDangerousMod } = require("@expo/config-plugins");
const fs = require("fs");
const path = require("path");

const MARKER = "# fmt-consteval-fix";
const SNIPPET = `
    ${MARKER}
    installer.pods_project.targets.each do |fmt_target|
      fmt_target.build_configurations.each do |fmt_config|
        defs = fmt_config.build_settings['GCC_PREPROCESSOR_DEFINITIONS'] || ['$(inherited)']
        defs = [defs] unless defs.is_a?(Array)
        defs << 'FMT_USE_CONSTEVAL=0' unless defs.include?('FMT_USE_CONSTEVAL=0')
        fmt_config.build_settings['GCC_PREPROCESSOR_DEFINITIONS'] = defs
      end
    end
`;

module.exports = function withFmtConsteval(config) {
  return withDangerousMod(config, [
    "ios",
    (cfg) => {
      const podfile = path.join(cfg.modRequest.platformProjectRoot, "Podfile");
      let contents = fs.readFileSync(podfile, "utf8");
      if (!contents.includes(MARKER)) {
        contents = contents.replace(
          /post_install do \|installer\|/,
          (m) => m + SNIPPET,
        );
        fs.writeFileSync(podfile, contents);
      }
      return cfg;
    },
  ]);
};
