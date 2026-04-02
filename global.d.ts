declare module 'react-big-calendar' {
    import { ComponentType } from 'react';
    export const Calendar: ComponentType<any>;
    export const dateFnsLocalizer: (config: any) => any;
    export type View = 'month' | 'week' | 'day' | 'agenda' | 'work_week';
}
