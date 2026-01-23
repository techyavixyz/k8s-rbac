import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import { certV1 } from "../kube/client.js";

const BASE = process.env.RABC_DATA_DIR;

/**
 * Create + auto-approve + auto-sign a Kubernetes user certificate
 */
export async function createUserCert(username, groups = []) {
  const dir = path.join(BASE, "users", username);
  fs.mkdirSync(dir, { recursive: true });

  const key = path.join(dir, `${username}.key`);
  const csr = path.join(dir, `${username}.csr`);
  const crt = path.join(dir, `${username}.crt`);

  const sanitizeName = (name) =>
    name
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "-")
      .replace(/^-+/, "")
      .replace(/-+$/, "");

  // const csrName = sanitizeName(`${username}-csr`);

  // console.log(`🎯 Creating certificate for user: ${username}`);
  // console.log(`📄 CSR Name: ${csrName}`);

const csrName = sanitizeName(`${username}-csr-${Date.now()}`);

console.log(`🎯 Creating certificate for user: ${username}`);
console.log(`📄 CSR Name: ${csrName}`);


  /* ============================================================
     1️⃣ Generate private key
  ============================================================ */
  execSync(`openssl genrsa -out ${key} 2048`);

  /* ============================================================
     2️⃣ Generate CSR (CN + O groups)
  ============================================================ */
  const subject =
    `/CN=${username}` + groups.map(g => `/O=${g}`).join("");

  execSync(
    `openssl req -new -key ${key} -out ${csr} -subj "${subject}"`
  );

  const csrBody = {
    apiVersion: "certificates.k8s.io/v1",
    kind: "CertificateSigningRequest",
    metadata: { name: csrName },
    spec: {
      request: fs.readFileSync(csr).toString("base64"),
      signerName: "kubernetes.io/kube-apiserver-client",
      usages: ["client auth"]
    }
  };

  /* ============================================================
     3️⃣ Delete existing CSR (idempotent & SAFE)
  // ============================================================ */
  // try {
  //   await certV1.deleteCertificateSigningRequest({ name: csrName });
  //   console.log(`♻️ Deleted existing CSR: ${csrName}`);
  // } catch (e) {
  //   if (e?.code === 404) {
  //     console.log(`ℹ️ CSR ${csrName} not found, skipping delete`);
  //   } else {
  //     throw e;
  //   }
  // }

  /* ============================================================
     4️⃣ Create CSR
  ============================================================ */
  await certV1.createCertificateSigningRequest({
    body: csrBody
  });

  console.log(`✅ CSR created: ${csrName}`);

  /* ============================================================
     5️⃣ Approve CSR (CORRECT way – approval subresource)
  ============================================================ */
  console.log(`🟢 Approving CSR: ${csrName}`);

  const approvalPatch = [
    {
      op: "add",
      path: "/status/conditions",
      value: [
        {
          type: "Approved",
          status: "True",
          reason: "RABCApprove",
          message: "Approved by RABC backend",
          lastUpdateTime: new Date().toISOString(),
          lastTransitionTime: new Date().toISOString()
        }
      ]
    }
  ];

  await certV1.patchCertificateSigningRequestApproval({
    name: csrName,
    body: approvalPatch,
    headers: {
      "Content-Type": "application/json-patch+json"
    }
  });

  console.log(`✅ CSR approved`);

  /* ============================================================
     6️⃣ Wait for certificate to be signed
  ============================================================ */
  console.log(`⏳ Waiting for certificate issuance...`);

  let certificate;

  for (let i = 1; i <= 30; i++) {
    const res = await certV1.readCertificateSigningRequest({
      name: csrName
    });

    const csrObj = res.body ?? res;
    certificate = csrObj.status?.certificate;

    if (certificate) {
      console.log(`🎉 Certificate issued in ${i * 0.5}s`);
      break;
    }

    await new Promise(r => setTimeout(r, 500));
  }

  if (!certificate) {
    throw new Error("Certificate not signed (check RBAC / signer)");
  }

  /* ============================================================
     7️⃣ Write certificate to disk
  ============================================================ */
  fs.writeFileSync(
    crt,
    Buffer.from(certificate, "base64")
  );

  console.log(`📁 Certificate stored at: ${dir}`);

  return dir;
}
