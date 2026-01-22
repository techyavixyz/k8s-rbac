import { useEffect, useState } from "react";
import { api } from "../api";

export default function Audit() {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    api("/audit").then(setLogs);
  }, []);

  return (
    <div>
      <h3>Audit Logs</h3>
      <pre>{JSON.stringify(logs, null, 2)}</pre>
    </div>
  );
}
