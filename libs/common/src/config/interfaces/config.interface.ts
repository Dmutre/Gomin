import { AuthConfig } from "./auth-config.interface";
import { ServerConfig } from "./server-config.interface";

export interface Config {
    server: ServerConfig;
    auth?: AuthConfig;
}