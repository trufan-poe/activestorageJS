import development from "./development";
import production from "./production";
import staging from "./staging";
import test from "./test";
const env: string = process.env.NODE_ENV;
const config = {
  development: development,
  test: test,
  staging: staging,
  production: production,
};
export default () => config[env]();
