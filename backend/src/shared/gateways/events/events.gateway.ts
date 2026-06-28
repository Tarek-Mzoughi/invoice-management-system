import {
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket as IoSocket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { WSRoom } from '../../../app/enums/ws-room.enum';
import { Logger } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { UserRepository } from 'src/modules/user-management/repositories/user.repository';

@WebSocketGateway({
  path: '/ws',
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  },
})
export class EventsGateway
  implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit
{
  private readonly logger = new Logger(EventsGateway.name);

  @WebSocketServer()
  server: Server;

  private rooms: Map<string, Set<string>> = new Map();

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly userRepository: UserRepository,
  ) {}

  afterInit() {
    this.logger.log('WebSocket server initialized');
  }

  async handleConnection(client: IoSocket) {
    const token = client.handshake?.headers?.authorization?.split(' ')[1];
    if (!token) {
      this.logger.warn('Connection rejected: No token provided');
      client.disconnect(true);
      return;
    }

    try {
      // Use verifyAsync and proper secret like AuthService does
      const payload: { sub: string; email: string } =
        await this.jwtService.verifyAsync(token, {
          secret: this.configService.get('app.jwtSecret'),
        });

      if (!payload || !payload.sub || !payload.email) {
        this.logger.warn('Connection rejected: Invalid token payload');
        client.disconnect(true);
        return;
      }

      // Verify user exists and is active (like AuthService does)
      const user = await this.userRepository.findOneById(payload.sub);
      if (!user) {
        this.logger.warn(
          `Connection rejected: User ${payload.sub} does not exist`,
        );
        client.disconnect(true);
        return;
      }

      if (!user.isActive) {
        this.logger.warn(
          `Connection rejected: User ${user.email} is not active`,
        );
        client.disconnect(true);
        return;
      }

      if (!user.isApproved) {
        this.logger.warn(
          `Connection rejected: User ${user.email} is not approved`,
        );
        client.disconnect(true);
        return;
      }

      // Generate unique identifier for this connection
      const uniqueId = randomBytes(4).toString('hex');
      client.data.user = {
        id: payload.sub,
        email: `${payload.email}#${uniqueId}`,
        originalEmail: payload.email,
      };

      this.logger.log(`User ${payload.email} connected successfully`);
    } catch (error) {
      this.logger.error('Token verification failed:', error);
      client.disconnect(true);
      return;
    }
  }

  @SubscribeMessage('joinRoom')
  joinRoom(
    @ConnectedSocket() client: IoSocket,
    @MessageBody() roomName: WSRoom,
  ): void {
    if (!client.data.user) {
      this.logger.warn('Join room rejected: No authenticated user');
      client.disconnect(true);
      return;
    }
    client.join(roomName);
    if (!this.rooms.has(roomName)) {
      this.rooms.set(roomName, new Set());
    }
    this.rooms.get(roomName)!.add(client.data.user.email);
    this.logger.log(`${client.data.user.email} joined room ${roomName}`);
  }

  @SubscribeMessage('leaveRoom')
  leaveRoom(
    @ConnectedSocket() client: IoSocket,
    @MessageBody() roomName: WSRoom,
  ): void {
    if (!client.data.user) {
      this.logger.warn('Leave room rejected: No authenticated user');
      client.disconnect(true);
      return;
    }

    client.leave(roomName);

    // Remove user from the room, but keep the room alive
    if (this.rooms.has(roomName)) {
      this.rooms.get(roomName)!.delete(client.data.user.email);
    }

    this.logger.log(`${client.data.user.email} left room ${roomName}`);
  }

  sendToRoom(roomName: WSRoom, message: string, data: any): void {
    if (this.rooms.has(roomName)) {
      this.server.to(roomName).emit(message, data);
      this.logger.log(`Message sent to room ${roomName}: ${message}`);
    } else {
      this.logger.log(`Room ${roomName} does not exist.`);
    }
  }

  getRoomMembers(roomName: WSRoom): string[] {
    return this.rooms.has(roomName)
      ? Array.from(this.rooms.get(roomName)!)
      : [];
  }

  handleDisconnect(client: IoSocket): any {
    if (!client.data.user || !client.data.user.email) {
      this.logger.log('Client disconnected, no user found');
      return;
    }

    this.rooms.forEach((members) => {
      members.delete(client.data.user.email);
    });

    this.logger.log(`${client.data.user.email} disconnected`);
  }
}
