import { ApiProperty } from "@nestjs/swagger";
import { Expose } from "class-transformer";

export class FileResponse {
  @Expose()
  @ApiProperty({ type: String })
  id: string;

  @Expose()
  @ApiProperty({ type: String })
  fileName: string;

  @Expose()
  @ApiProperty({ type: String })
  storagePath: string;
}

