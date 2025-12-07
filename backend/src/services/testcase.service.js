// src/services/testcase.service.js
// import db from "../models/index.js"; // Remove direct import

export async function create(db, payload, userId) {
  const rec = await db.TestCase.create({
    title: payload.title,
    description: payload.description || "",
    steps: payload.steps || [],
    expectedResult: payload.expectedResult || "",
    userId: userId || null,
  });
  return rec.toJSON();
}

export async function list(db) {
  const rows = await db.TestCase.findAll({ order: [["createdAt", "DESC"]] });
  return rows.map((r) => r.toJSON());
}

export async function getById(db, id) {
  const r = await db.TestCase.findByPk(id);
  return r ? r.toJSON() : null;
}

export async function update(db, id, patch) {
  const r = await db.TestCase.findByPk(id);
  if (!r) throw new Error("Not found");
  await r.update(patch);
  return r.toJSON();
}

export async function remove(db, id) {
  const r = await db.TestCase.findByPk(id);
  if (!r) return;
  await r.destroy();
}
