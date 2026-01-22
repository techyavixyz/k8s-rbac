import { useEffect, useMemo, useState } from "react";
import { apiGet, apiPost, apiDelete } from "../api";

export default function ServiceAccounts() {
  const [sas, setSAs] = useState([]);
  const [name, setName] = useState("");
  const [namespace, setNamespace] = useState("");

  /* NEW */
  const [advanced, setAdvanced] = useState(false);
  const [yaml, setYaml] = useState("");

  const load = async () => {
    setSAs(await apiGet("/serviceaccounts"));
  };

  useEffect(() => {
    load();
  }, []);

  const yamlPreview = useMemo(() => `
apiVersion: v1
kind: ServiceAccount
metadata:
  name: ${name || "<name>"}
  namespace: ${namespace || "<namespace>"}
`.trim(), [name, namespace]);

  const create = async () => {
    await apiPost("/serviceaccounts", { name, namespace });
    setName("");
    setNamespace("");
    load();
  };

  /* NEW: load YAML */
  const loadYaml = async (sa) => {
    const res = await apiGet(
      `/serviceaccounts/yaml?name=${sa.name}&namespace=${sa.namespace}`
    );
    setYaml(res.yaml);
    setAdvanced(true);
  };

  /* NEW: apply YAML */
  const applyYaml = async () => {
    await apiPost("/serviceaccounts/apply-yaml", { yaml });
    alert("ServiceAccount applied");
    load();
  };

  const remove = async (sa, ns) => {
    if (!confirm("Delete ServiceAccount?")) return;
    await apiDelete(`/serviceaccounts/${sa}/${ns}`);
    load();
  };

  return (
    <div>
      <h3>Create Service Account</h3>
      <input placeholder="name" value={name} onChange={e => setName(e.target.value)} />
      <input placeholder="namespace" value={namespace} onChange={e => setNamespace(e.target.value)} />
      <button onClick={create}>Create</button>

      <h4>Generated YAML (read-only)</h4>
      <pre style={{ background: "#f3f4f6", padding: 12 }}>
        {yamlPreview}
      </pre>

      {/* NEW */}
      {advanced && (
        <>
          <h4>Edit YAML</h4>
          <textarea
            rows={14}
            style={{ width: "100%" }}
            value={yaml}
            onChange={e => setYaml(e.target.value)}
          />
          <button onClick={applyYaml}>Apply YAML</button>
        </>
      )}

      <h3>Service Accounts</h3>
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Namespace</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {sas.map(sa => (
            <tr key={`${sa.name}-${sa.namespace}`}>
              <td>{sa.name}</td>
              <td>{sa.namespace}</td>
              <td>
                <button onClick={() => loadYaml(sa)}>Edit</button>
                <button className="danger" onClick={() => remove(sa.name, sa.namespace)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
