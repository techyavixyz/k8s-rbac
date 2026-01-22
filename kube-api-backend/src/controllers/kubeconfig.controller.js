import fs from "fs";
import User from "../models/User.js";
import ServiceAccount from "../models/ServiceAccount.js";

export async function downloadUserKubeconfig(req, res) {
  const { username } = req.params;

  const user = await User.findOne({ username });
  if (!user) return res.status(404).json({ error: "User not found" });

  if (!fs.existsSync(user.kubeconfigPath)) {
    return res.status(404).json({ error: "Kubeconfig file missing" });
  }

  res.download(user.kubeconfigPath, `${username}-kubeconfig.yaml`);
}

export async function downloadSAKubeconfig(req, res) {
  const { name, namespace } = req.params;

  const sa = await ServiceAccount.findOne({ name, namespace });
  if (!sa) return res.status(404).json({ error: "ServiceAccount not found" });

  if (!fs.existsSync(sa.kubeconfigPath)) {
    return res.status(404).json({ error: "Kubeconfig file missing" });
  }

  res.download(
    sa.kubeconfigPath,
    `${name}-${namespace}-kubeconfig.yaml`
  );
}
