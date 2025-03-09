import { NestFactory } from '@nestjs/core';
import { Transport } from '@nestjs/microservices';
import { ConsumerModule } from './consumer.module';

async function bootstrap() {
  const app = await NestFactory.createMicroservice(ConsumerModule, {
    transport: Transport.RMQ,
    options: {
      urls: ['amqp://guest:guest@localhost:5672'],
      queue: 'rxjs_queue',
    },
  });
  await app.listen();
}
bootstrap();
