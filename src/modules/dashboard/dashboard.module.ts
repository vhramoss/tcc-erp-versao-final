import { Module } from '@nestjs/common';
import { EstoqueModule } from '../estoque/estoque.module';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';

@Module({
  imports: [EstoqueModule],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
