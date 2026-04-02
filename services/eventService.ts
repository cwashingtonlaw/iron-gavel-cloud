import { Event, CalendarCategory, EventType } from '../types';
import { MOCK_EVENTS, MOCK_CALENDARS, MOCK_EVENT_TYPES } from '../constants';

export const eventService = {
    getEvents: (): Event[] => {
        return [...MOCK_EVENTS];
    },

    getCalendarCategories: (): CalendarCategory[] => {
        return [...MOCK_CALENDARS];
    },

    getEventTypes: (): EventType[] => {
        return [...MOCK_EVENT_TYPES];
    },

    addEvent: (events: Event[], event: Event): Event[] => {
        return [...events, event];
    },

    updateEvent: (events: Event[], event: Event): Event[] => {
        return events.map((e) => (e.id === event.id ? event : e));
    },

    deleteEvent: (events: Event[], id: string): Event[] => {
        return events.filter((e) => e.id !== id);
    },

    updateCalendarCategory: (categories: CalendarCategory[], category: CalendarCategory): CalendarCategory[] => {
        return categories.map((c) => (c.id === category.id ? category : c));
    },

    addEventType: (types: EventType[], eventType: EventType): EventType[] => {
        return [...types, eventType];
    },

    updateEventType: (types: EventType[], eventType: EventType): EventType[] => {
        return types.map((et) => (et.id === eventType.id ? eventType : et));
    },

    deleteEventType: (types: EventType[], id: string): EventType[] => {
        return types.filter((et) => et.id !== id);
    },
};
