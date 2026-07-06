import test from "node:test";
import assert from "node:assert/strict";
import { buildSessionOptions, matchesStudentSessionFilter } from "./subjectDetailSessionUtils";

test("buildSessionOptions returns sorted unique session choices", () => {
  const options = buildSessionOptions([
    { sessionId: "session-2", sessionNumber: 2, title: "Second Session" },
    { sessionId: "session-1", sessionNumber: 1, title: "First Session" },
    { sessionId: "session-2", sessionNumber: 2, title: "Second Session" },
  ]);

  assert.deepEqual(options, [
    { sessionId: "session-1", sessionNumber: 1, title: "First Session" },
    { sessionId: "session-2", sessionNumber: 2, title: "Second Session" },
  ]);
});

test("matchesStudentSessionFilter uses session ids when present", () => {
  assert.equal(matchesStudentSessionFilter({ sessionId: "session-1" }, "session-1"), true);
  assert.equal(matchesStudentSessionFilter({ sessionIds: ["session-2", "session-3"] }, "session-3"), true);
  assert.equal(matchesStudentSessionFilter({ sessionIds: ["session-2"] }, "session-1"), false);
  assert.equal(matchesStudentSessionFilter({ sessionIds: ["session-2"] }, ""), true);
});
