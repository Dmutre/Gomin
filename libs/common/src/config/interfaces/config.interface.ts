import { AuthConfig } from "./auth-config.interface";
import { MicroservicesConfig } from "./microservices.interface";
import { ServerConfig } from "./server-config.interface";

export interface Config {
    server: ServerConfig;
    auth?: AuthConfig;
    microservices: MicroservicesConfig;
}