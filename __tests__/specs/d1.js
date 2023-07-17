// @ts-check
import { deepStrictEqual } from "node:assert";
import {
  createRunner,
  equalRejectedResult,
  sleepAfterRejectedResult,
} from "../test-utils.js";

/**
 * @param {D1ExecResult} actual
 * @param {D1ExecResult} expect
 */
const _equalD1ExecResult = (actual, expect) => {
  deepStrictEqual(actual.count, expect.count);
  deepStrictEqual(typeof actual.duration, typeof expect.duration);
};

/**
 * @param {PromiseSettledResult<unknown>} aRes
 * @param {PromiseSettledResult<unknown>} eRes
 */
const equalD1ExecResult = (aRes, eRes) => {
  if (aRes.status === "fulfilled" && eRes.status === "fulfilled")
    return _equalD1ExecResult(
      /** @type {D1ExecResult} */ (aRes.value),
      /** @type {D1ExecResult} */ (eRes.value),
    );

  deepStrictEqual(aRes, eRes);
};

/** @param {[D1Database, D1Database]} bindings */
export const createSpecs = ([ACTUAL, EXPECT]) => {
  const beforeEach = async () => {
    /** @type {[{ results: any[] }, { results: any[] }]} */
    const [{ results: aResults }, { results: eResults }] = await Promise.all([
      ACTUAL.prepare("PRAGMA table_list").all(),
      EXPECT.prepare("PRAGMA table_list").all(),
    ]);
    const [aTableNames, eTableNames] = [
      aResults
        .filter((r) => r.type === "table" && !r.name.startsWith("sqlite_"))
        .map((r) => r.name),
      eResults
        .filter((r) => r.type === "table" && !r.name.startsWith("sqlite_"))
        .map((r) => r.name),
    ];

    await Promise.all([
      ACTUAL.exec(
        aTableNames.map((n) => `DROP TABLE IF EXISTS ${n};`).join("\n"),
      ).catch(() => {}),
      EXPECT.exec(
        eTableNames.map((n) => `DROP TABLE IF EXISTS ${n};`).join("\n"),
      ).catch(() => {}),
    ]);
  };

  /** @type {[name: string, spec: () => Promise<void>][]} */
  const specs = [];
  const run = createRunner([ACTUAL, EXPECT]);

  // D1.prepare()
  // D1PraparedStatement.bind()
  // D1PraparedStatement.all()
  // D1PraparedStatement.first()
  // D1PraparedStatement.run()
  // D1PraparedStatement.raw()

  specs.push([
    "D1.dump()",
    async () => {
      let dumpRes = await run((D1) => D1.dump());
      deepStrictEqual(dumpRes[0], dumpRes[1]);
    },
  ]);

  // D1.batch()
  // D1.exec()

  specs.push([
    "D1.exec(query)",
    async () => {
      let execRes = await run((D1) => D1.exec("INVALID"));
      equalRejectedResult(execRes[0], execRes[1]);
      await sleepAfterRejectedResult();

      execRes = await run((D1) =>
        D1.exec(
          [
            "DROP TABLE IF EXISTS Customers;",
            "CREATE TABLE Customers (CustomerId INTEGER PRIMARY KEY, CompanyName TEXT, ContactName TEXT);",
            "INSERT INTO Customers VALUES (1, 'Alfreds Futterkiste', 'Maria Anders');",
          ].join("\n"),
        ),
      );
      equalD1ExecResult(execRes[0], execRes[1]);
    },
  ]);

  return { beforeEach, specs };
};
