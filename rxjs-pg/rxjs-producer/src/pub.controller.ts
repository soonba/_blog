import { Controller, Get, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';

@Controller()
export class PubController {
  constructor(@Inject('CLIENT_PROXY') private readonly proxy: ClientProxy) {}

  @Get()
  async getHello(): Promise<string> {
    const observable = await this.proxy.send<string>('hi', 'im a message');
    const observer = (data) => {
      console.log('data', data);
    };
    observable.subscribe(observer);
    console.log('dd');
    return 'Hello World!';
  }
}
