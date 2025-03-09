import { Module } from '@nestjs/common';
import { ClientProxyFactory, Transport } from '@nestjs/microservices';
import { PubController } from './pub.controller';

@Module({
  controllers: [PubController],
  providers: [
    {
      provide: 'CLIENT_PROXY',
      useValue: ClientProxyFactory.create({
        transport: Transport.RMQ,
        options: {
          urls: ['amqp://guest:guest@localhost:5672'],
          queue: 'rxjs_queue',
        },
      }),
    },
  ],
})
export class PubModule {}
