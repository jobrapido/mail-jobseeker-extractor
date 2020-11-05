import * as moment from "moment";
import * as qc from "../../src/service/query-composer";

describe("Query composer", () => {

  const baseConfig = {
    start: moment("2018-05-01"),
    end: moment("2018-05-30"),
    sql: "jobalertfrequency in ('30') and jobalertnextopportunitydate <> current_date + 2",
    time: "23:00",
    interval: 7,
    country: "it",
    timezone: "Europe/Rome",
  };

  it("Given a country then should compose an insert query", async () => {
    const queryComposer = new qc.QueryComposer();
    const query = await queryComposer.composeInsert(baseConfig);

    const expectedSQL = "INSERT INTO jobseeker_mail_target( SELECT id FROM jobseeker WHERE jobalertfrequency in ('30') and jobalertnextopportunitydate <> current_date + 2 )";

    expect(query).toEqual(expectedSQL);
  });
});
