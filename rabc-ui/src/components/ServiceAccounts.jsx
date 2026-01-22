import { useEffect, useState } from "react";
import { apiGet, apiPost, apiDelete } from "../api";

export default function ServiceAccounts() {
  const [sas, setSAs] = useState([]);
  const [name, setName] = useState("");
  const [namespace, setNamespace] = useState("");

  const load = async () => {
    setSAs(await apiGet("/serviceaccounts"));
  };

  useEffect(() => {
    load();
  }, []);

  const create = async () => {
    await apiPost("/serviceaccounts", { name, namespace });
    setName("");
    setNamespace("");
    load();
  };

  const download = (sa, ns) => {
    window.location.href =
      `http://localhost:3001/api/serviceaccounts/${sa}/${ns}/kubeconfig`;
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
                <button onClick={() => download(sa.name, sa.namespace)}>Download</button>
                <button className="danger" onClick={() => remove(sa.name, sa.namespace)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
