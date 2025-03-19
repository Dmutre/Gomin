import { Injectable } from '@nestjs/common';
import { UsersPrismaService } from '@gomin/users-db';
import { File, Prisma } from '@prisma/client/users';

@Injectable()
export class FileRepository {
  constructor(private readonly prisma: UsersPrismaService) {}

  async uploadFile(data: Prisma.FileUncheckedCreateInput): Promise<File> {
    return this.prisma.file.create({ data });
  }

  async findFileById(id: string): Promise<File | null> {
    return this.prisma.file.findUnique({ where: { id } });
  }

  async findFilesByUser(userId: string): Promise<File[]> {
    return this.prisma.file.findMany({ where: { ownerId: userId } });
  }

  async deleteFile(id: string): Promise<File> {
    return this.prisma.file.delete({ where: { id } });
  }
}
