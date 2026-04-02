import { StateCreator } from 'zustand';
import { Event, CalendarCategory, EventType } from '../../types';
import { eventService } from '../../services/eventService';

export interface EventSlice {
    events: Event[];
    calendarCategories: CalendarCategory[];
    eventTypes: EventType[];
    addEvent: (event: Event) => void;
    updateEvent: (event: Event) => void;
    deleteEvent: (id: string) => void;
    updateCalendarCategory: (category: CalendarCategory) => void;
    addEventType: (eventType: EventType) => void;
    updateEventType: (eventType: EventType) => void;
    deleteEventType: (id: string) => void;
}

export const createEventSlice: StateCreator<EventSlice> = (set) => ({
    events: eventService.getEvents(),
    calendarCategories: eventService.getCalendarCategories(),
    eventTypes: eventService.getEventTypes(),
    addEvent: (event) => set((state) => ({
        events: eventService.addEvent(state.events, event)
    })),
    updateEvent: (event) => set((state) => ({
        events: eventService.updateEvent(state.events, event)
    })),
    deleteEvent: (id) => set((state) => ({
        events: eventService.deleteEvent(state.events, id)
    })),
    updateCalendarCategory: (category) => set((state) => ({
        calendarCategories: eventService.updateCalendarCategory(state.calendarCategories, category)
    })),
    addEventType: (eventType) => set((state) => ({
        eventTypes: eventService.addEventType(state.eventTypes, eventType)
    })),
    updateEventType: (eventType) => set((state) => ({
        eventTypes: eventService.updateEventType(state.eventTypes, eventType)
    })),
    deleteEventType: (id) => set((state) => ({
        eventTypes: eventService.deleteEventType(state.eventTypes, id)
    })),
});
