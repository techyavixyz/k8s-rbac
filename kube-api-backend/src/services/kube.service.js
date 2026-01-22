import yaml from "js-yaml";
import { kc } from "../utils/k8s.js";

export async function applyYAML(yamlText) {
  const obj = yaml.load(yamlText);
  const api = kc.makeApiClient(
    kc.getApiVersion(obj.apiVersion)
  );

  await api.patch(
    `/apis/${obj.apiVersion}/namespaces/${obj.metadata.namespace}/${obj.kind.toLowerCase()}s/${obj.metadata.name}`,
    obj,
    undefined,
    undefined,
    undefined,
    {
      headers: {
        "Content-Type": "application/apply-patch+yaml"
      }
    }
  );
}
