import { useEffect, useState } from "react";
import { apiGet } from "../api";

export default function Audit() {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    apiGet("/audit").then(setLogs);
  }, []);

  return (
    <div>
      <h3>Audit Logs</h3>
      <table>
        <thead>
          <tr>
            <th>Actor</th>
            <th>Action</th>
            <th>Target</th>
            <th>Time</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((l, i) => (
            <tr key={i}>
              <td>{l.actor}</td>
              <td>{l.action}</td>
              <td>{l.target}</td>
              <td>{new Date(l.timestamp).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
