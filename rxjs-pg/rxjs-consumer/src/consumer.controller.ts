import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';

@Controller()
export class ConsumerController {
  constructor() {}

  @MessagePattern('hi')
  getHello(@Payload() body: any): string {
    console.log('arrive body', body);
    return 'Hello World!';
  }
}
