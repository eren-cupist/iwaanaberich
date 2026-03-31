import { Module } from "@nestjs/common";
import { UsersModule } from "../users/users.module";
import { UpbitService } from "./upbit.service";
import { UpbitController } from "./upbit.controller";

@Module({
  imports: [UsersModule],
  providers: [UpbitService],
  controllers: [UpbitController],
  exports: [UpbitService],
})
export class UpbitModule {}
