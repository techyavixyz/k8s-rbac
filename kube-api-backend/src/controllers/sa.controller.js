import { coreV1 } from "../kube/client.js";
import ServiceAccount from "../models/ServiceAccount.js";
import { generateSAKubeconfig } from "../services/kubeconfig.service.js";

export async function createSA(req, res) {
  const { name, namespace } = req.body;

  await coreV1.createNamespacedServiceAccount(namespace, {
    metadata: { name }
  });

  const { body } =
    await coreV1.createNamespacedServiceAccountToken(
      name,
      namespace,
      { spec: {} }
    );

  const token = body.status.token;
  const kubeconfigPath = generateSAKubeconfig(name, namespace, token);

  const sa = await ServiceAccount.create({
    name,
    namespace,
    token,
    kubeconfigPath
  });

  res.json(sa);
}

export async function listSA(req, res) {
  res.json(await ServiceAccount.find());
}
