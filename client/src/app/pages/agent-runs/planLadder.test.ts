import type { PlanEntry } from "./planLadder";
import {
  planEntries,
  planRungMeta,
  planTurns,
  rungElapsed,
  timeRungs,
} from "./planLadder";

/** One task rung as the harness publishes it (agentic-controller#268). */
const TASK_RUNG = {
  content: "task: migrate the JAX-RS resources — turn 12 of 40",
  priority: "medium",
  status: "in_progress",
  _meta: {
    "konveyor.io/plan": {
      rung: "task",
      task: "migrate the JAX-RS resources",
      stage: 2,
      stageCount: 3,
      model: "claude-sonnet-4-5",
      turnsUsed: 12,
      maxTurns: 40,
    },
  },
};

describe("planRungMeta", () => {
  it("reads the fields the harness publishes", () => {
    expect(planRungMeta(TASK_RUNG)).toEqual({
      rung: "task",
      task: "migrate the JAX-RS resources",
      stage: 2,
      stageCount: 3,
      model: "claude-sonnet-4-5",
      turnsUsed: 12,
      maxTurns: 40,
      repo: undefined,
      branch: undefined,
      insights: undefined,
      goal: undefined,
      pushes: undefined,
      commits: undefined,
    });
  });

  it("keeps a published zero, which does not mean absent", () => {
    const prep = {
      content: "prep: cloned coolstore",
      _meta: { "konveyor.io/plan": { rung: "prep", insights: 0 } },
    };
    expect(planRungMeta(prep).insights).toBe(0);
  });

  it("is empty for a harness that publishes no fields", () => {
    expect(planRungMeta({ content: "task: …", status: "in_progress" })).toEqual(
      {}
    );
  });

  it("is empty for metadata that is not ours", () => {
    expect(planRungMeta({ _meta: { "zed.dev/debugMode": true } })).toEqual({});
    expect(planRungMeta({ _meta: "not an object" })).toEqual({});
    expect(planRungMeta(undefined)).toEqual({});
  });

  it("ignores a value of the wrong type rather than trusting it", () => {
    const meta = planRungMeta({
      _meta: {
        "konveyor.io/plan": { turnsUsed: "12", maxTurns: NaN, rung: 7 },
      },
    });
    expect(meta.turnsUsed).toBeUndefined();
    expect(meta.maxTurns).toBeUndefined();
    expect(meta.rung).toBeUndefined();
  });
});

describe("planEntries", () => {
  it("maps a ladder, defaulting an unstated status to pending", () => {
    expect(
      planEntries([{ content: "prep: cloned coolstore" }, TASK_RUNG])
    ).toEqual([
      { content: "prep: cloned coolstore", status: "pending", meta: {} },
      {
        content: TASK_RUNG.content,
        status: "in_progress",
        meta: planRungMeta(TASK_RUNG),
      },
    ]);
  });

  it("drops a rung with no sentence, and anything that is not a ladder", () => {
    expect(planEntries([{ status: "pending" }, "nonsense"])).toEqual([]);
    expect(planEntries(undefined)).toEqual([]);
  });
});

describe("timeRungs", () => {
  const ladder = (...statuses: string[]): PlanEntry[] =>
    statuses.map((status, i) => ({ content: `rung ${i}`, status, meta: {} }));

  it("leaves the first ladder unstamped: no transition was witnessed", () => {
    const first = timeRungs([], ladder("completed", "in_progress", "pending"));
    expect(first.map((e) => e.since)).toEqual([
      undefined,
      undefined,
      undefined,
    ]);
  });

  it("stamps only the rung whose status changed", () => {
    const prev = ladder("completed", "in_progress", "pending");
    const next = timeRungs(
      prev,
      ladder("completed", "completed", "pending"),
      1_000
    );
    expect(next.map((e) => e.since)).toEqual([undefined, 1_000, undefined]);
  });

  it("carries an existing stamp across an update that changes nothing", () => {
    const prev = timeRungs(
      ladder("completed", "pending", "pending"),
      ladder("completed", "in_progress", "pending"),
      1_000
    );
    const next = timeRungs(
      prev,
      ladder("completed", "in_progress", "pending"),
      9_000
    );
    expect(next[1]?.since).toBe(1_000);
  });
});

describe("rungElapsed", () => {
  const running = (since?: number): PlanEntry => ({
    content: "task: …",
    status: "in_progress",
    meta: {},
    since,
  });

  it("times the rung in progress from when it started", () => {
    expect(rungElapsed(running(1_000), 135_000)).toBe("2m 14s");
  });

  it("says nothing about a rung it never saw start", () => {
    expect(rungElapsed(running(undefined), 135_000)).toBeNull();
  });

  it("says nothing about a rung that is not running", () => {
    const done: PlanEntry = { ...running(1_000), status: "completed" };
    expect(rungElapsed(done, 135_000)).toBeNull();
    expect(rungElapsed({ ...done, status: "pending" }, 135_000)).toBeNull();
  });
});

describe("planTurns", () => {
  it("finds the rung that reports turns, wherever it sits", () => {
    const entries = planEntries([{ content: "prep: …" }, TASK_RUNG]);
    expect(planTurns(entries)).toEqual(
      expect.objectContaining({ turnsUsed: 12, maxTurns: 40 })
    );
  });

  it("reports nothing from a harness that publishes no fields", () => {
    expect(
      planTurns(planEntries([{ content: "task: … turn 12" }]))
    ).toBeUndefined();
  });
});
