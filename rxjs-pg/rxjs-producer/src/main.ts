import { NestFactory } from '@nestjs/core';
import { PubModule } from './pub.module';

async function bootstrap() {
  const app = await NestFactory.create(PubModule);
  await app.listen(3000);
}
bootstrap();
