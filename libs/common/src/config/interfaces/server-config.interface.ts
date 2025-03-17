export interface ServerConfig {
  port: number;
  host: string;
  cors?: {
    origin: string;
    methods: string;
  }
}
