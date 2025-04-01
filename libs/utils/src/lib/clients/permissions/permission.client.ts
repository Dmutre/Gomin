import { PERMISSIONS_SERVICE } from "@gomin/common";
import { Inject, Injectable } from "@nestjs/common";
import { ClientProxy } from "@nestjs/microservices";

@Injectable()
export class PermissionClient {

  constructor(@Inject(PERMISSIONS_SERVICE) private readonly client: ClientProxy) {}

}

