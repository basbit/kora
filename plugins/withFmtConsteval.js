// Expo config plugin: make the `fmt` library compile under the iOS 26 SDK
// (Xcode 26).
//
// fmt's base.h enables consteval unconditionally for Apple clang >= 14
// (`#elif defined(__apple_build_version__) && __apple_build_version__ < 14000029L`),
// so a `-DFMT_USE_CONSTEVAL=0` define is redefined away. On Xcode 26 that
// consteval path miscompiles FMT_STRING ("call to consteval function ... is not
// a constant expression"), failing the Release archive.
//
// Fix: in Podfile post_install (after pods are downloaded) patch base.h to drop
// the version check, so consteval stays off for all Apple clang.
const { withDangerousMod } = require("@expo/config-plugins");
const fs = require("fs");
const path = require("path");

const MARKER = "# fmt-consteval-fix";
const SNIPPET = `

    ${MARKER}
    fmt_base = File.join(installer.sandbox.root, 'fmt', 'include', 'fmt', 'base.h')
    if File.exist?(fmt_base)
      fmt_text = File.read(fmt_base)
      fmt_patched = fmt_text.gsub('#elif defined(__apple_build_version__) && __apple_build_version__ < 14000029L', '#elif defined(__apple_build_version__)')
      File.write(fmt_base, fmt_patched) if fmt_patched != fmt_text
    end`;

module.exports = function withFmtConsteval(config) {
  return withDangerousMod(config, [
    "ios",
    (cfg) => {
      const podfile = path.join(cfg.modRequest.platformProjectRoot, "Podfile");
      let contents = fs.readFileSync(podfile, "utf8");
      if (!contents.includes(MARKER)) {
        const call = /react_native_post_install\([^)]*\)/;
        if (call.test(contents)) {
          contents = contents.replace(call, (m) => m + SNIPPET);
        } else {
          contents = contents.replace(
            /post_install do \|installer\|/,
            (m) => m + SNIPPET,
          );
        }
        fs.writeFileSync(podfile, contents);
      }
      return cfg;
    },
  ]);
};
