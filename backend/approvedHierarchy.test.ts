import assert from "node:assert/strict";

async function main() {
  process.env.NODE_ENV = "test";
  const { buildApprovedTheoryHierarchy } = await import("./server.ts");

  const rawExtraction = {
    classes: [
      {
        class_name: "Class XII",
        subject: "Chemistry",
        units: [
          { unit_id: "U1", unit_name: "Unit 1: Solutions", marks: 7 },
          { unit_id: "U2", unit_name: "Unit 2: Electrochemistry", marks: 9 },
          { unit_id: "U3", unit_name: "Unit 3: Chemical Kinetics", marks: 7 },
          { unit_id: "U4", unit_name: "Unit 4: d-and f-Block Elements", marks: 7 },
          { unit_id: "U5", unit_name: "Unit 5: Coordination Compounds", marks: 7 },
        ],
      },
    ],
    chapters: [
      { class_name: "Class XII", subject: "", unit_id: "U6", unit_name: "Unit 6: Haloalkanes and Haloarenes Classification, Nomenclature, Nature of C-X bond", chapter_name: "" },
      { class_name: "Class XII", subject: "CHEMISTRY THEORY", unit_id: "U7", unit_name: "Unit 7: Alcohols, Phenols and Ethers", chapter_name: "Alcohols, Phenols and Ethers" },
      { class_name: "Class XII", subject: "Chemistry", unit_id: "U8", unit_name: "Unit 8: Aldehydes, Ketones and Carboxylic Acids", chapter_name: "Aldehydes, Ketones and Carboxylic Acids" },
      { class_name: "Class XII", subject: "Chemistry", unit_id: "U9", unit_name: "Unit 9: Amines", chapter_name: "Amines" },
      { class_name: "Class XII", subject: "Chemistry", unit_id: "U10", unit_name: "Unit 10: Biomolecules", chapter_name: "Biomolecules" },
    ],
  };

  const approvedHierarchy = buildApprovedTheoryHierarchy(rawExtraction, { classes: [] });
  const restoredUnitIds = (approvedHierarchy.classes[0]?.units || []).map((unit: any) => unit.unit_id);

  assert.deepEqual(
    restoredUnitIds,
    ["U1", "U2", "U3", "U4", "U5", "U6", "U7", "U8", "U9", "U10"],
    "approvedHierarchy should recover theory units from Stage 1 chapters[] when units[] is incomplete"
  );

  const recoveredUnit = (approvedHierarchy.classes[0]?.units || []).find((unit: any) => unit.unit_id === "U6");
  assert.equal(recoveredUnit?.unit_name, "Unit 6: Haloalkanes and Haloarenes");
  assert.equal(recoveredUnit?.chapters?.[0]?.chapter_name, "Haloalkanes and Haloarenes");

  console.log("approvedHierarchy regression passed");
}

void main();
