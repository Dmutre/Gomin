import { IsNumber } from 'class-validator';

export class TestDTO {
  @IsNumber()
  testNumber: number;
}