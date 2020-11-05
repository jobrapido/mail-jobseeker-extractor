import { injectable } from "tsyringe";
import { RestClient } from "typed-rest-client/RestClient";

const restClient = new RestClient("mail-jobseeker-extractor-http-client");

@injectable()
export class RestClientProvider {
  public provide = () => restClient;
}
