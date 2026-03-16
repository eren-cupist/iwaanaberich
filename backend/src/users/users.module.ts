import { Module } from "@nestjs/common";
import { DatabaseModule } from "../database/database.module";
import { UsersRepository } from "./users.repository";
import { UsersService } from "./users.service";
import { UsersController } from "./users.controller";

@Module({
  imports: [
    // DatabaseService 사용을 위해 DatabaseModule import
    DatabaseModule,
  ],
  providers: [UsersRepository, UsersService],
  controllers: [UsersController],
  // AuthModule에서 UsersService를 사용할 수 있도록 export
  exports: [UsersService],
})
export class UsersModule {}
