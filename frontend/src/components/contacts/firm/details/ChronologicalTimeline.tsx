import React from 'react';
import {
  Timeline,
  TimelineItem,
  TimelineConnector,
  TimelineHeader,
  TimelineTitle,
  TimelineIcon,
  TimelineDescription,
  TimelineContent,
  TimelineTime
} from '@/components/ui/timeline';
import { cn } from '@/lib/utils';

// export type TimelineData = (typeof timelineData)[number];

export interface TimelineElement {
  id: number;
  title: string;
  date: string;
  description: string;
}
interface ChronologicalTimelineProps {
  className?: string;
  items?: TimelineElement[];
}
export const ChronologicalTimeline = ({ className }: ChronologicalTimelineProps) => {
  const items = [
    {
      id: 1,
      title: 'First event',
      date: '2022-01-01',
      description:
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Odio euismod lacinia at quis risus sed vulputate odio ut. Quam viverra orci sagittis eu volutpat odio facilisis mauris.'
    },
    {
      id: 2,
      title: 'Second event',
      date: '2022-02-01',
      description:
        'Aut eius excepturi ex recusandae eius est minima molestiae. Nam dolores iusto ad fugit reprehenderit hic dolorem quisquam et quia omnis non suscipit nihil sit libero distinctio. Ad dolorem tempora sit nostrum voluptatem qui tempora unde? Sit rerum magnam nam ipsam nesciunt aut rerum necessitatibus est quia esse non magni quae.'
    },
    {
      id: 3,
      title: 'Third event',
      date: '2022-03-01',
      description:
        'Sit culpa quas ex nulla animi qui deleniti minus rem placeat mollitia. Et enim doloremque et quia sequi ea dolores voluptatem ea rerum vitae. Aut itaque incidunt est aperiam vero sit explicabo fuga id optio quis et molestiae nulla ex quae quam. Ab eius dolores ab tempora dolorum eos beatae soluta At ullam placeat est incidunt cumque.'
    }
  ];
  return (
    <Timeline className={cn(className)}>
      <TimelineItem>
        <TimelineConnector />
        <TimelineHeader>
          <TimelineTime>{items[0].date}</TimelineTime>
          <TimelineIcon />
          <TimelineTitle>{items[0].title}</TimelineTitle>
        </TimelineHeader>
        <TimelineContent>
          <TimelineDescription>{items[0].description}</TimelineDescription>
        </TimelineContent>
      </TimelineItem>
      <TimelineItem>
        <TimelineConnector />
        <TimelineHeader>
          <TimelineTime>{items[1].date}</TimelineTime>
          <TimelineIcon />
          <TimelineTitle>{items[1].title}</TimelineTitle>
        </TimelineHeader>
        <TimelineContent>
          <TimelineDescription>{items[1].description}</TimelineDescription>
        </TimelineContent>
      </TimelineItem>
      <TimelineItem>
        <TimelineHeader>
          <TimelineTime>{items[2].date}</TimelineTime>
          <TimelineIcon />
          <TimelineTitle>{items[2].title}</TimelineTitle>
        </TimelineHeader>
        <TimelineContent>
          <TimelineDescription>{items[2].description}</TimelineDescription>
        </TimelineContent>
      </TimelineItem>
    </Timeline>
  );
};
