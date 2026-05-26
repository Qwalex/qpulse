import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayInit,
} from '@nestjs/websockets';
import { Server } from 'socket.io';
import Redis from 'ioredis';
import { ConfigService } from '@nestjs/config';

@WebSocketGateway({
  path: '/api/v1/realtime',
  cors: { origin: '*' },
})
export class RealtimeGateway implements OnGatewayInit {
  @WebSocketServer()
  server!: Server;

  private pub!: Redis;
  private sub!: Redis;

  constructor(private readonly config: ConfigService) {}

  afterInit() {
    const redisUrl = this.config.get<string>('REDIS_URL', 'redis://localhost:6379');
    this.pub = new Redis(redisUrl);
    this.sub = new Redis(redisUrl);
    this.sub.subscribe('qpulse:ws');
    this.sub.on('message', (_channel, message) => {
      const { event, payload, channels } = JSON.parse(message);
      for (const channel of channels as string[]) {
        this.server.to(channel).emit(event, payload);
      }
    });
  }

  @SubscribeMessage('subscribe')
  handleSubscribe(client: { join: (room: string) => void }, data: { channels?: string[] }) {
    for (const channel of data.channels ?? []) {
      client.join(channel);
    }
    return { ok: true };
  }

  broadcast(event: string, payload: unknown, channels: string[]) {
    this.server.to(channels).emit(event, payload);
    void this.pub.publish('qpulse:ws', JSON.stringify({ event, payload, channels }));
  }
}
