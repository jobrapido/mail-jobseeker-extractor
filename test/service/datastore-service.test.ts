import * as moment from "moment-timezone";
import "reflect-metadata";
import { RestClient } from "typed-rest-client/RestClient";
import * as TypeMoq from "typemoq";
import { RestClientProvider } from "../../src/provider/rest-client-provider";
import { ConfigService } from "../../src/service/config-service";
import { DatastoreService } from "../../src/service/datastore-service";
import { TimezoneService } from "../../src/service/timezone-service";
import { jsonFromFile } from "../resource/resource";

describe("Datastore", () => {

  const mockConfigService = TypeMoq.Mock.ofType(ConfigService);
  mockConfigService.setup((instance) => instance.datastoreUrl).returns(() => "http://datastore.jobrapido.com");

  it("Given composeMailJobseekerExtractorConfig is called then should return the correct MailJobseekerExtractor configuration", async () => {

    const mockRestClient = TypeMoq.Mock.ofType(RestClient);
    mockRestClient
      .setup((instance) => instance.get("http://datastore.jobrapido.com/mail.jobseeker.extractor.queries"))
      .returns(() => Promise.resolve({
        headers: {},
        statusCode: 200,
        result: jsonFromFile("./ds-queries.json"),
      }));

    mockRestClient
      .setup((instance) => instance.get("http://datastore.jobrapido.com/mail.jobseeker.extractor.schedule.nz"))
      .returns(() => Promise.resolve({
        headers: {},
        statusCode: 200,
        result: jsonFromFile("./ds-mail-jobseeker-extractor-config.json"),
      }));

    const mockRestClientProvider = TypeMoq.Mock.ofType(RestClientProvider);
    mockRestClientProvider.
      setup((instance) => instance.provide())
      .returns(() => mockRestClient.object);

    const mockTimezoneService = TypeMoq.Mock.ofType(TimezoneService);

    mockTimezoneService.
      setup((instance) => instance.getTimezone("nz"))
      .returns(() => Promise.resolve("Pacific/Auckland"));

    const adsService = new DatastoreService(
      mockConfigService.object,
      mockRestClientProvider.object,
      mockTimezoneService.object);

    const expectedConfig = {
      start: moment.tz("2018-05-01", "YYYY-MM-DD", true, "Pacific/Auckland"),
      end: moment.tz("2018-05-30", "YYYY-MM-DD", true, "Pacific/Auckland"),
      sql: "SELECT * FROM table1",
      time: "23:00",
      interval: 7,
      country: "nz",
      timezone: "Pacific/Auckland",
    };

    await adsService.composeMailJobseekerExtractorConfig("nz").then((queries) => {
      expect(queries).toEqual(expectedConfig);

      mockRestClient.verify(
        (instance) => instance.get("http://datastore.jobrapido.com/mail.jobseeker.extractor.schedule.nz"),
        TypeMoq.Times.once());

      mockRestClient.verify(
        (instance) => instance.get("http://datastore.jobrapido.com/mail.jobseeker.extractor.queries"),
        TypeMoq.Times.once());

      mockTimezoneService.verify(
        (instance) => instance.getTimezone("nz"),
        TypeMoq.Times.once());

    });
  });

  it("Given composeMailJobseekerExtractorConfig method throws http error then should propagate it", (done) => {

    const mockRestClient = TypeMoq.Mock.ofType(RestClient);
    mockRestClient
      .setup((instance) => instance.get("http://datastore.jobrapido.com/mail.jobseeker.extractor.queries"))
      .throws(new Error("TEST - Http error"));

    const mockRestClientProvider = TypeMoq.Mock.ofType(RestClientProvider);
    mockRestClientProvider.
      setup((instance) => instance.provide())
      .returns(() => mockRestClient.object);

    const mockTimezoneService = TypeMoq.Mock.ofType(TimezoneService);

    mockTimezoneService.
      setup((instance) => instance.getTimezone("nz"))
      .returns(() => Promise.resolve("Pacific/Auckland"));

    const adsService = new DatastoreService(
      mockConfigService.object,
      mockRestClientProvider.object,
      mockTimezoneService.object);

    adsService
      .composeMailJobseekerExtractorConfig("nz")
      .then(() => done(new Error("Should fail!")))
      .catch((error) => {
        expect(error).toBeDefined();
        done();
      });
  });

  it("Given composeMailJobseekerExtractorConfig method throws error if date format is wrong", (done) => {
    const mockRestClient = TypeMoq.Mock.ofType(RestClient);
    mockRestClient.setup((instance) => instance.get("http://datastore.jobrapido.com/mail.jobseeker.extractor.queries")).returns(() =>
      Promise.resolve({
        headers: {},
        statusCode: 200,
        result: jsonFromFile("./ds-queries.json"),
      }),
    );

    mockRestClient
      .setup((instance) => instance.get("http://datastore.jobrapido.com/mail.jobseeker.extractor.schedule.nz"))
      .returns(() =>
        Promise.resolve({
          headers: {},
          statusCode: 200,
          result: jsonFromFile("./ds-mail-jobseeker-extractor-config-jobseeker-extractor-config-wrong-date.json"),
        }),
    );

    const mockRestClientProvider = TypeMoq.Mock.ofType(RestClientProvider);
    mockRestClientProvider.
      setup((instance) => instance.provide())
      .returns(() => mockRestClient.object);

    const mockTimezoneService = TypeMoq.Mock.ofType(TimezoneService);

    mockTimezoneService.
      setup((instance) => instance.getTimezone("nz"))
      .returns(() => Promise.resolve("Pacific/Auckland"));

    const adsService = new DatastoreService(
      mockConfigService.object,
      mockRestClientProvider.object,
      mockTimezoneService.object,
    );

    adsService
      .composeMailJobseekerExtractorConfig("nz")
      .then(() => done(new Error("Should fail!")))
      .catch((error) => {
        expect(error).toBeDefined();
        done();
      });
  });
});
