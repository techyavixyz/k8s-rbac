import { useEffect, useState } from "react";
import { apiGet } from "../api";

export default function RBACGraph() {
  const [graph, setGraph] = useState(null);

  useEffect(() => {
    apiGet("/rbac/graph").then(setGraph);
  }, []);

  return (
    <div>
      <h3>RBAC Graph (Data)</h3>
      <pre>{JSON.stringify(graph, null, 2)}</pre>
    </div>
  );
}
