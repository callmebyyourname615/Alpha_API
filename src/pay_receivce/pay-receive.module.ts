import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PayReceive } from './pay-receive.entity';
import { PayReceiveController } from './pay-receive.controller';
import { PayReceiveService } from './pay-receive.service';
import { SavingsModule } from '../savings/saving.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([PayReceive]),
    // forwardRef resolves the circular dependency:
    // PayReceiveModule → SavingsModule → PayReceiveModule
    forwardRef(() => SavingsModule),
  ],
  controllers: [PayReceiveController],
  providers: [PayReceiveService],
  exports: [PayReceiveService],
})
export class PayReceiveModule {}