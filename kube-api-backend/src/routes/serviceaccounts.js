import { Router } from "express";
import { createSA, listSA } from "../controllers/sa.controller.js";

const r = Router();
r.post("/", createSA);
r.get("/", listSA);
export default r;
