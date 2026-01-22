import Group from "../models/Group.js";

export async function createGroup(req, res) {
  const group = await Group.create({
    name: req.body.name,
    users: []
  });

  res.json(group);
}

export async function listGroups(req, res) {
  res.json(await Group.find());
}

export async function addUserToGroup(req, res) {
  const { group } = req.params;
  const { user } = req.body;

  if (!user) {
    return res.status(400).json({ error: "User is required" });
  }

  const g = await Group.findOne({ name: group });
  if (!g) {
    return res.status(404).json({ error: "Group not found" });
  }

  // 🛡️ Always safe now
  if (!g.users.includes(user)) {
    g.users.push(user);
    await g.save();
  }

  res.json(g);
}
