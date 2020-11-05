import "reflect-metadata";
import { RestClient } from "typed-rest-client/RestClient";
import * as TypeMoq from "typemoq";
import { ConfigService } from "../../src/service/config-service";
import { TimezoneService } from "../../src/service/timezone-service";

describe("Timezone service test", () => {

  test("Given a country should return the correct timezone and cache the result", async () => {

    const mockRestClient = TypeMoq.Mock.ofType(RestClient);
    const mockConfigService = TypeMoq.Mock.ofType(ConfigService);

    mockConfigService.setup((instance) => instance.timezoneServiceApiUrl)
      .returns(() => "http://timezone.jobrapido.com/timezones");

    mockRestClient
      .setup((instance) => instance.get("http://timezone.jobrapido.com/timezones"))
      .returns(() => Promise.resolve({
        headers: {},
        statusCode: 200,
        result: [{
          country: "mx",
          timezone: "America/Mexico_City",
        }, {
          country: "it",
          timezone: "Europe/Rome",
        }, {
          country: "nz",
          timezone: "Pacific/Auckland",
        }],
      }));

    const mockRestClientProvider = { provide: () => mockRestClient.object };

    const timezoneService = new TimezoneService(mockConfigService.object, mockRestClientProvider);

    expect(await timezoneService.getTimezone("IT")).toBe("Europe/Rome");
    expect(await timezoneService.getTimezone("NZ")).toBe("Pacific/Auckland");

    mockRestClient.verify(
      (instance) => instance.get("http://timezone.jobrapido.com/timezones"),
      TypeMoq.Times.once());
  });
});
