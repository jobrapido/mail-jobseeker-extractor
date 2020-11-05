import { Pool, PoolClient } from "pg";
import "reflect-metadata";
import * as TypeMoq from "typemoq";
import { PostgresProvider } from "../../src/provider/pg-provider";
import { PostgresService } from "../../src/service/pg-service";

describe("Postgres database", () => {

  it("Given a query then pg service should excecuted it using the provided client", async () => {
    const mockPool = TypeMoq.Mock.ofType(Pool);
    const mockPoolClient = TypeMoq.Mock.ofType<PoolClient>();
    const mockPostgresProvider = TypeMoq.Mock.ofType(PostgresProvider);

    mockPostgresProvider
      .setup((instance) => instance.provide("NA"))
      .returns(() => mockPool.object);

    mockPool
      .setup((instance) => instance.connect())
      .returns(() => Promise.resolve(mockPoolClient.object));

    mockPoolClient.setup((x: any) => x.then).returns(() => undefined);

    const pgService = new PostgresService(mockPostgresProvider.object);

    await pgService.execute("NA", "SELECT * FROM table2").then(() => {

      mockPool.verify(
        (instance) => instance.connect(),
        TypeMoq.Times.once(),
      );

      mockPoolClient.verify(
        (instance) => instance.query("SELECT * FROM table2"),
        TypeMoq.Times.once(),
      );

      mockPoolClient.verify(
        (instance) => instance.release(),
        TypeMoq.Times.once(),
      );

      mockPool.verify(
        (instance) => instance.end(),
        TypeMoq.Times.once(),
      );
    });
  });
});
