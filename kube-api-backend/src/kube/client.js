import * as k8s from "@kubernetes/client-node";

const kc = new k8s.KubeConfig();

if (process.env.KUBECONFIG) {
  kc.loadFromFile(process.env.KUBECONFIG);
} else {
  kc.loadFromDefault();
}

if (process.env.KUBE_CONTEXT) {
  kc.setCurrentContext(process.env.KUBE_CONTEXT);
}

export const coreV1 = kc.makeApiClient(k8s.CoreV1Api);
export const rbacV1 = kc.makeApiClient(k8s.RbacAuthorizationV1Api);
export const authV1 = kc.makeApiClient(k8s.AuthorizationV1Api);
export const certV1 = kc.makeApiClient(k8s.CertificatesV1Api);

export default kc;
