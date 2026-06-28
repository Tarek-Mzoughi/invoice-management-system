import { SetMetadata } from '@nestjs/common';
import { EVENT_TYPE } from '../enums/event-type.enum';

// Define a custom decorator
export const LogEvent = (event: EVENT_TYPE) => SetMetadata('event', event);
