import "reflect-metadata";
import * as request from "supertest";
import * as TypeMoq from "typemoq";
import { Application } from "../../src/app";
import { DatastoreService } from "../../src/service/datastore-service";
import { QueryExecutor } from "../../src/service/query-executor";
import { TimezoneService } from "../../src/service/timezone-service";

describe("API", () => {

  const mockQueryExecutor = TypeMoq.Mock.ofType(QueryExecutor);
  const mockDatastoreService = TypeMoq.Mock.ofType(DatastoreService);
  const mockTimezoneService = TypeMoq.Mock.ofType(TimezoneService);

  beforeEach(() => {
    mockQueryExecutor.reset();
    mockDatastoreService.reset();
    mockTimezoneService.reset();
  });

  const application = new Application();

  test("Health endpoint should respond with correct status", (done) => {

    request(application.app)
      .get("/health")
      .expect("Content-Type", "text/plain")
      .expect(200)
      .end((_, response) => {
        expect(response).not.toBeNull();
        expect(response.text).toBe("ok");
        done();
      });
  });

  test("Should provide the countries list", ((done) => {
    request(application.app)
      .get("/api/v1/timezone/fullmap")
      .expect("Content-Type", "application/json")
      .expect(200)
      .end((_, response) => {
        expect(response).not.toBeNull();
        expect(response.body).toEqual([{
          country: "xx",
          timezone: "America/Mexico_City",
        }, {
          country: "yy",
          timezone: "Europe/Rome",
        }, {
          country: "zz",
          timezone: "Pacific/Auckland",
        }]);
        done();
      });
  }));

  test("Should provide the queries list", (done) => {
    request(application.app)
      .get("/api/v1/datastores/values/mail.jobseeker.extractor.queries")
      .expect("Content-Type", "application/json")
      .expect(200)
      .end((_, response) => {
        expect(response).not.toBeNull();
        expect(response.body).toEqual(
          {
            list: [{
              datastoreKey: {
                region: "mail.jobseeker.extractor.queries",
                key: "q1",
              },
              value: "(age > 35 and date_trunc('day',lastvisit)>current_date-25)",
            }, {
              datastoreKey: {
                region: "mail.jobseeker.extractor.queries",
                key: "q2",
              },
              value: "(age > 20 and date_trunc('day',lastvisit)>current_date-40)",
            }],
          },
        );
        done();
      });
  });

  test("Should provide schedule", ((done) => {
    request(application.app)
      .get("/api/v1/datastores/values/mail.jobseeker.extractor.schedule.xx")
      .expect("Content-Type", "application/json")
      .expect(200)
      .end((_, response) => {
        expect(response).not.toBeNull();
        expect(response.body).toEqual({
          list: [
            {
              datastoreKey: {
                region: "mail.jobseeker.extractor.schedule.xx",
                key: "end",
              },
              value: "2018-05-30",
            },
            {
              datastoreKey: {
                region: "mail.jobseeker.extractor.schedule.xx",
                key: "interval",
              },
              value: "7",
            },
            {
              datastoreKey: {
                region: "mail.jobseeker.extractor.schedule.xx",
                key: "query",
              },
              value: "q1",
            },
            {
              datastoreKey: {
                region: "mail.jobseeker.extractor.schedule.xx",
                key: "start",
              },
              value: "2018-05-01",
            },
            {
              datastoreKey: {
                region: "mail.jobseeker.extractor.schedule.xx",
                key: "time",
              },
              value: "23:00",
            },
          ],
        });
        done();
      });
  }));
});
