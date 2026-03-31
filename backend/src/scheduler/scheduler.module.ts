import { Module } from "@nestjs/common";
import { ScheduleModule } from "@nestjs/schedule";
import { ProfitLossModule } from "../profit-loss/profit-loss.module";
import { SchedulerService } from "./scheduler.service";

@Module({
  imports: [ScheduleModule.forRoot(), ProfitLossModule],
  providers: [SchedulerService],
})
export class SchedulerModule {}
