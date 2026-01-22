import { execSync } from "child_process";

/**
 * Run command and print output (no return)
 */
export function run(cmd) {
  const kubeconfig = process.env.KUBECONFIG;
  const context = process.env.KUBE_CONTEXT;

  let finalCmd = cmd;

  if (cmd.startsWith("kubectl")) {
    finalCmd = `kubectl --kubeconfig ${kubeconfig} --context ${context} ${cmd.replace(
      /^kubectl\s*/,
      ""
    )}`;
  }

  console.log("▶", finalCmd);

  execSync(finalCmd, {
    stdio: "inherit",
    env: {
      ...process.env,
      KUBECONFIG: kubeconfig,
      HOME: process.env.HOME
    }
  });
}

/**
 * Run command and return stdout (string)
 */
export function runOut(cmd) {
  const kubeconfig = process.env.KUBECONFIG;
  const context = process.env.KUBE_CONTEXT;

  let finalCmd = cmd;

  if (cmd.startsWith("kubectl")) {
    finalCmd = `kubectl --kubeconfig ${kubeconfig} --context ${context} ${cmd.replace(
      /^kubectl\s*/,
      ""
    )}`;
  }

  return execSync(finalCmd, {
    encoding: "utf-8",
    env: {
      ...process.env,
      KUBECONFIG: kubeconfig,
      HOME: process.env.HOME
    }
  }).trim();
}
