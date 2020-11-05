import * as moment from "moment";
import * as TypeMoq from "typemoq";
import { DatastoreService } from "../../src/service/datastore-service";
import { PostgresService } from "../../src/service/pg-service";
import { QueryComposer } from "../../src/service/query-composer";
import { QueryExecutor } from "../../src/service/query-executor";

describe("Query executor", () => {
  const baseConfig = {
    start: moment.tz("2000-01-01", "America/Mexico_City"),
    end: moment.tz("2999-12-31", "America/Mexico_City"),
    sql: "condition1 AND condition2",
    time: "00:01",
    interval: 7,
    country: "mx",
    timezone: "America/Mexico_City",
  };

  const baseCountryRunStatus = {
    country: "mx",
    lastrun: "2015-12-17",
    running: false,
  };

  const baseCountryStatusGetSql = `SELECT country, lastrun, running FROM country_state WHERE country = 'mx'`;

  const mockPostgresService = TypeMoq.Mock.ofType(PostgresService);
  const mockQueryComposerService = TypeMoq.Mock.ofType(QueryComposer);
  const mockDatastoreService = TypeMoq.Mock.ofType(DatastoreService);

  const underTest = new QueryExecutor(
    mockPostgresService.object,
    mockQueryComposerService.object,
    mockDatastoreService.object,
  );

  beforeEach(() => {
    mockPostgresService.reset();
    mockQueryComposerService.reset();
    mockDatastoreService.reset();
  });

  beforeAll(() => Date.now = jest.fn(() => 1451001600000)); // 2015-12-25 00:00:00 GMT - 2015-12-24 18.00 MX

  it("Given an insert then should execute the query if all conditions are met", async () => {

    mockDatastoreService.setup((instance) => instance.composeMailJobseekerExtractorConfig("mx"))
      .returns(() => Promise.resolve(baseConfig));

    mockQueryComposerService
      .setup((instance) => instance.composeCountryStateGet(baseConfig.country))
      .returns(() => baseCountryStatusGetSql);

    mockPostgresService
      .setup((instance) => instance.execute(baseConfig.country, baseCountryStatusGetSql))
      .returns(() => Promise.resolve({
        rowCount: 1,
        rows: [baseCountryRunStatus],
    }));

    mockQueryComposerService
      .setup((instance) => instance.composeInsert(baseConfig))
      .returns(() => baseConfig.sql);

    mockPostgresService
      .setup((instance) => instance.execute(baseConfig.country, baseConfig.sql))
      .returns(() => Promise.resolve({
        rowCount: 23,
        rows: [],
      }));

    const result = await underTest.insert("mx");
    expect(result).toBe(23);

    mockDatastoreService.verify(
      (instance) => instance.composeMailJobseekerExtractorConfig("mx"),
      TypeMoq.Times.once(),
    );

    mockQueryComposerService.verify(
      (instance) => instance.composeCountryStateGet("mx"),
      TypeMoq.Times.once(),
    );

    mockQueryComposerService.verify(
      (instance) => instance.composeCountryStateUpdate({
        country: "mx",
        lastrun: "2015-12-24",
        running: true,
      }),
      TypeMoq.Times.once(),
    );

    mockQueryComposerService.verify(
      (instance) => instance.composeCountryStateUpdate({
        country: "mx",
        lastrun: "2015-12-24",
        running: false,
      }),
      TypeMoq.Times.once(),
    );

    mockQueryComposerService.verify(
      (instance) => instance.composeInsert(baseConfig),
      TypeMoq.Times.once(),
    );

    mockPostgresService.verify(
      (instance) => instance.execute("mx", baseConfig.sql),
      TypeMoq.Times.once(),
    );
  });

  it("Given an insert then should not execute the query if is already running", async () => {

    const countryRunStatus = {
      ...baseCountryRunStatus,
      running: true,
    };

    mockDatastoreService.setup((instance) => instance.composeMailJobseekerExtractorConfig("mx"))
      .returns(() => Promise.resolve(baseConfig));

    mockQueryComposerService
      .setup((instance) => instance.composeCountryStateGet(baseConfig.country))
      .returns(() => baseCountryStatusGetSql);

    mockPostgresService
      .setup((instance) => instance.execute(baseConfig.country, baseCountryStatusGetSql))
      .returns(() => Promise.resolve({
        rowCount: 1,
        rows: [countryRunStatus],
      }));

    mockQueryComposerService
      .setup((instance) => instance.composeInsert(baseConfig))
      .returns(() => baseConfig.sql);

    mockPostgresService
      .setup((instance) => instance.execute(baseConfig.country, baseConfig.sql))
      .returns(() => Promise.resolve({
        rowCount: 23,
        rows: [],
      }));

    await underTest.insert("mx");

    mockDatastoreService.verify(
      (instance) => instance.composeMailJobseekerExtractorConfig("mx"),
      TypeMoq.Times.once(),
    );

    mockPostgresService.verify(
      (instance) => instance.execute("mx", baseConfig.sql),
      TypeMoq.Times.never(),
    );

    mockQueryComposerService.verify(
      (instance) => instance.composeCountryStateUpdate({
        country: "mx",
        lastrun: TypeMoq.It.isAny(),
        running: TypeMoq.It.isAny(),
      }),
      TypeMoq.Times.never(),
    );
  });

  it("Given an insert then should not execute the query if today (localized) is after the upper bound", async () => {

    const config = {
      ...baseConfig,
      end: moment.tz("2015-12-23", "America/Mexico_City"),
    };

    mockDatastoreService.setup((instance) => instance.composeMailJobseekerExtractorConfig("mx"))
      .returns(() => Promise.resolve(config));

    mockQueryComposerService
      .setup((instance) => instance.composeCountryStateGet(baseConfig.country))
      .returns(() => baseCountryStatusGetSql);

    mockPostgresService
      .setup((instance) => instance.execute(baseConfig.country, baseCountryStatusGetSql))
      .returns(() => Promise.resolve({
        rowCount: 1,
        rows: [baseCountryRunStatus],
      }));

    mockQueryComposerService
      .setup((instance) => instance.composeInsert(config))
      .returns(() => config.sql);

    await underTest.insert("mx");

    mockDatastoreService.verify(
      (instance) => instance.composeMailJobseekerExtractorConfig("mx"),
      TypeMoq.Times.once(),
    );

    mockPostgresService.verify(
      (instance) => instance.execute("mx", config.sql),
      TypeMoq.Times.never(),
    );

    mockQueryComposerService.verify(
      (instance) => instance.composeCountryStateUpdate({
        country: "mx",
        lastrun: TypeMoq.It.isAny(),
        running: TypeMoq.It.isAny(),
      }),
      TypeMoq.Times.never(),
    );
  });

  it("Given an insert then should not execute the query if today (localized) is before the lower bound", async () => {
    const config = {
      ...baseConfig,
      start: moment.tz("2015-12-25", "America/Mexico_City"),
    };

    mockDatastoreService.setup((instance) => instance.composeMailJobseekerExtractorConfig("mx"))
      .returns(() => Promise.resolve(config));

    mockQueryComposerService
      .setup((instance) => instance.composeCountryStateGet(baseConfig.country))
      .returns(() => baseCountryStatusGetSql);

    mockPostgresService
      .setup((instance) => instance.execute(baseConfig.country, baseCountryStatusGetSql))
      .returns(() => Promise.resolve({
        rowCount: 1,
        rows: [baseCountryRunStatus],
      }));

    mockQueryComposerService
      .setup((instance) => instance.composeInsert(config))
      .returns(() => config.sql);

    await underTest.insert("mx");

    mockDatastoreService.verify(
      (instance) => instance.composeMailJobseekerExtractorConfig("mx"),
      TypeMoq.Times.once(),
    );

    mockPostgresService.verify(
      (instance) => instance.execute("mx", config.sql),
      TypeMoq.Times.never(),
    );

    mockQueryComposerService.verify(
      (instance) => instance.composeCountryStateUpdate({
        country: "mx",
        lastrun: TypeMoq.It.isAny(),
        running: TypeMoq.It.isAny(),
      }),
      TypeMoq.Times.never(),
    );
  });

  it("Given an insert then should not execute the query if today (localized) is before next interval tick", async () => {
    const config = {
      ...baseConfig,
      interval: 7,
    };
    const countryRunStatus = {
      ...baseCountryRunStatus,
      lastrun: "2015-12-19",
      running: false,
    };

    mockDatastoreService.setup((instance) => instance.composeMailJobseekerExtractorConfig("mx"))
      .returns(() => Promise.resolve(config));

    mockQueryComposerService
      .setup((instance) => instance.composeCountryStateGet(baseConfig.country))
      .returns(() => baseCountryStatusGetSql);

    mockPostgresService
      .setup((instance) => instance.execute(baseConfig.country, baseCountryStatusGetSql))
      .returns(() => Promise.resolve({
        rowCount: 1,
        rows: [countryRunStatus],
      }));

    mockQueryComposerService
      .setup((instance) => instance.composeInsert(config))
      .returns(() => config.sql);

    await underTest.insert("mx");

    mockDatastoreService.verify(
      (instance) => instance.composeMailJobseekerExtractorConfig("mx"),
      TypeMoq.Times.once(),
    );

    mockPostgresService.verify(
      (instance) => instance.execute("mx", config.sql),
      TypeMoq.Times.never(),
    );

    mockQueryComposerService.verify(
      (instance) => instance.composeCountryStateUpdate({
        country: "mx",
        lastrun: TypeMoq.It.isAny(),
        running: TypeMoq.It.isAny(),
      }),
      TypeMoq.Times.never(),
    );
  });

  it("Given an insert then should not execute the query if time is before configured running time", async () => {
    const config = {
      ...baseConfig,
      time: "18:01",
    };

    mockDatastoreService.setup((instance) => instance.composeMailJobseekerExtractorConfig("mx"))
      .returns(() => Promise.resolve(config));

    mockQueryComposerService
      .setup((instance) => instance.composeCountryStateGet(baseConfig.country))
      .returns(() => baseCountryStatusGetSql);

    mockPostgresService
      .setup((instance) => instance.execute(baseConfig.country, baseCountryStatusGetSql))
      .returns(() => Promise.resolve({
        rowCount: 1,
        rows: [baseCountryRunStatus],
      }));

    mockQueryComposerService
      .setup((instance) => instance.composeInsert(config))
      .returns(() => config.sql);

    await underTest.insert("mx");

    mockDatastoreService.verify(
      (instance) => instance.composeMailJobseekerExtractorConfig("mx"),
      TypeMoq.Times.once(),
    );

    mockPostgresService.verify(
      (instance) => instance.execute("mx", config.sql),
      TypeMoq.Times.never(),
    );
  });

  it("Given an insert then should execute the query if time is the same configured running time", async () => {
    const config = {
      ...baseConfig,
      time: "18:00",
    };

    mockPostgresService
      .setup((instance) => instance.execute(baseConfig.country, baseConfig.sql))
      .returns(() => Promise.resolve({
        rowCount: 23,
        rows: [],
      }));

    mockDatastoreService.setup((instance) => instance.composeMailJobseekerExtractorConfig("mx"))
      .returns(() => Promise.resolve(config));

    mockQueryComposerService
      .setup((instance) => instance.composeCountryStateGet(baseConfig.country))
      .returns(() => baseCountryStatusGetSql);

    mockPostgresService
      .setup((instance) => instance.execute(baseConfig.country, baseCountryStatusGetSql))
      .returns(() => Promise.resolve({
        rowCount: 1,
        rows: [baseCountryRunStatus],
      }));

    mockQueryComposerService
      .setup((instance) => instance.composeInsert(config))
      .returns(() => config.sql);

    await underTest.insert("mx");

    mockDatastoreService.verify(
      (instance) => instance.composeMailJobseekerExtractorConfig("mx"),
      TypeMoq.Times.once(),
    );

    mockPostgresService.verify(
      (instance) => instance.execute("mx", config.sql),
      TypeMoq.Times.once(),
    );
  });

  it("Given an insert that fail while execute query should unlock anyway", async () => {
    mockDatastoreService.setup((instance) => instance.composeMailJobseekerExtractorConfig("mx"))
      .returns(() => Promise.resolve(baseConfig));

    mockQueryComposerService
      .setup((instance) => instance.composeCountryStateGet(baseConfig.country))
      .returns(() => baseCountryStatusGetSql);
    mockPostgresService
      .setup((instance) => instance.execute(baseConfig.country, baseCountryStatusGetSql))
      .returns(() => Promise.resolve({
        rowCount: 1,
        rows: [baseCountryRunStatus],
      }));

    mockQueryComposerService
      .setup((instance) => instance.composeInsert(baseConfig))
      .returns(() => baseConfig.sql);

    mockPostgresService
      .setup((instance) => instance.execute(baseConfig.country, baseConfig.sql))
      .throws(new Error("fake error while calling postgres"));

    try {
      await underTest.insert("mx");
      throw new Error("Should not finish");
    } catch (err) {
      expect(err.message).toContain("fake error while calling postgres");

      mockDatastoreService.verify(
        (instance) => instance.composeMailJobseekerExtractorConfig("mx"),
        TypeMoq.Times.once(),
      );

      mockPostgresService.verify(
        (instance) => instance.execute("mx", baseConfig.sql),
        TypeMoq.Times.once(),
      );

      mockQueryComposerService.verify(
        (instance) => instance.composeCountryStateUpdate({
          country: "mx",
          lastrun: "2015-12-24",
          running: true,
        }),
        TypeMoq.Times.once(),
      );

      mockQueryComposerService.verify(
        (instance) => instance.composeCountryStateUpdate({
          country: "mx",
          lastrun: "2015-12-17",
          running: false,
        }),
        TypeMoq.Times.once(),
      );
    }
  });

  it("Given an insert then should execute the query and unlock with correct date and status", async () => {
    const config = {
      ...baseConfig,
      time: "18:00",
    };

    mockDatastoreService.setup((instance) => instance.composeMailJobseekerExtractorConfig("mx"))
      .returns(() => Promise.resolve(config));

    mockQueryComposerService
      .setup((instance) => instance.composeCountryStateGet(baseConfig.country))
      .returns(() => baseCountryStatusGetSql);
    mockPostgresService
      .setup((instance) => instance.execute(baseConfig.country, baseCountryStatusGetSql))
      .returns(() => Promise.resolve({
        rowCount: 1,
        rows: [baseCountryRunStatus],
      }));

    mockQueryComposerService
      .setup((instance) => instance.composeInsert(config))
      .returns(() => config.sql);

    mockPostgresService
      .setup((instance) => instance.execute(baseConfig.country, baseConfig.sql))
      .returns(() => Promise.resolve({
        rowCount: 23,
        rows: [],
      }));

    await underTest.insert("mx");

    mockDatastoreService.verify(
      (instance) => instance.composeMailJobseekerExtractorConfig("mx"),
      TypeMoq.Times.once(),
    );

    mockPostgresService.verify(
      (instance) => instance.execute("mx", config.sql),
      TypeMoq.Times.once(),
    );

    mockQueryComposerService.verify(
      (instance) => instance.composeCountryStateUpdate({
        country: "mx",
        lastrun: "2015-12-24",
        running: true,
      }),
      TypeMoq.Times.once(),
    );

    mockQueryComposerService.verify(
      (instance) => instance.composeCountryStateUpdate({
        country: "mx",
        lastrun: "2015-12-24",
        running: false,
      }),
      TypeMoq.Times.once(),
    );

    mockQueryComposerService.verify(
      (instance) => instance.composeCountryStateUpdate({
        country: "mx",
        lastrun: "2015-12-17",
        running: false,
      }),
      TypeMoq.Times.never(),
    );
  });
});
