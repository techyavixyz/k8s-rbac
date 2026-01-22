import { Router } from "express";
import {
  createGroup,
  listGroups,
  addUserToGroup
} from "../controllers/group.controller.js";

const r = Router();

r.post("/", createGroup);
r.get("/", listGroups);
r.post("/:group/users", addUserToGroup);

export default r;
