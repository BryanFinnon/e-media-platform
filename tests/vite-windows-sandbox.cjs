/*
 * Vite probes Windows network-drive mappings with `net use` before resolving
 * the project root. Managed CI sandboxes can forbid that unrelated child
 * process. Return a failed probe so Vite uses its normal local-drive path.
 */
if (process.platform === "win32") {
  const childProcess = require("node:child_process");
  const { syncBuiltinESMExports } = require("node:module");
  const originalExec = childProcess.exec;
  childProcess.exec = function sandboxAwareExec(command, ...args) {
    if (command === "net use") {
      const callback = args.findLast((value) => typeof value === "function");
      if (callback) process.nextTick(() => callback(new Error("Network-drive probe disabled"), "", ""));
      return undefined;
    }
    return originalExec.call(this, command, ...args);
  };
  syncBuiltinESMExports();
}
