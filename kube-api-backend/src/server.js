import "dotenv/config";
import express from "express";
import cors from "cors";
import { connectDB } from "./config/db.js";

import userRoutes from "./routes/users.js";
import groupRoutes from "./routes/groups.js";
import saRoutes from "./routes/serviceaccounts.js";
import roleRoutes from "./routes/roles.js";
import bindingRoutes from "./routes/bindings.js";
import kubeconfigRoutes from "./routes/kubeconfigs.js";
import rbacRoutes from "./routes/rbac.js";
import namespaceRoutes from "./routes/namespaces.js";
import { KubeConfig } from '@kubernetes/client-node';
import { createUserCert } from './services/cert.service.js';
await connectDB();

const kc = new KubeConfig();
kc.loadFromDefault();
const app = express();

console.log('Current context:', kc.getCurrentContext());
console.log('API server:', kc.getCurrentCluster().server);
app.use(cors());
app.use(express.json());
app.use("/api/rbac", rbacRoutes);
app.use("/api/users", userRoutes);
app.use("/api/groups", groupRoutes);
app.use("/api/serviceaccounts", saRoutes);
app.use("/api/roles", roleRoutes);
app.use("/api/bindings", bindingRoutes);
app.use("/api/kubeconfigs", kubeconfigRoutes);
app.use("/api/namespaces", namespaceRoutes);


// Test endpoint
app.post('/api/test-cert', async (req, res) => {
  try {
    const { username } = req.body;
    if (!username) {
      return res.status(400).json({ error: 'Username is required' });
    }
    
    console.log(`Testing certificate creation for: ${username}`);
    const result = await createUserCert(username, ['rabc-users']);
    
    res.json({ 
      success: true, 
      message: 'Certificate created successfully',
      path: result 
    });
  } catch (error) {
    console.error('Test endpoint error:', error);
    res.status(500).json({ 
      error: 'Failed to create certificate',
      details: error.message 
    });
  }
});


const PORT = process.env.PORT || 3001;
app.listen(PORT, () =>
  console.log(` RABC backend running on port ${PORT}`)
);


//  Express error handler
app.use((err, req, res, next) => {
  console.error(" Express Error:", err);
  res.status(500).json({ success: false, error: err.message });
});

//  Promise rejections
process.on("unhandledRejection", (reason) => {
  console.error(" UNHANDLED PROMISE REJECTION");
  console.error(reason);
});

//  Uncaught exceptions
process.on("uncaughtException", (err) => {
  console.error(" UNCAUGHT EXCEPTION");
  console.error(err);
});