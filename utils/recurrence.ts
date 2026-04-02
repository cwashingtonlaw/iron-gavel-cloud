import { Event } from '../types';
import { addDays, addWeeks, addMonths, addYears, isBefore, isAfter, format, parse } from 'date-fns';

/**
 * Generates all instances of a recurring event within a date range
 */
export function generateRecurringInstances(
    baseEvent: Event,
    rangeStart: Date,
    rangeEnd: Date
): Event[] {
    if (!baseEvent.recurrence) {
        return [baseEvent];
    }

    const instances: Event[] = [];
    const { frequency, interval, endDate, count, daysOfWeek } = baseEvent.recurrence;

    // Parse the base event date
    let currentDate = parse(baseEvent.date, 'yyyy-MM-dd', new Date());
    let instanceCount = 0;
    const maxInstances = count || 365; // Default max to prevent infinite loops

    // Determine the end condition
    const endConditionDate = endDate ? parse(endDate, 'yyyy-MM-dd', new Date()) : null;

    while (instanceCount < maxInstances) {
        // Check if we've passed the end date
        if (endConditionDate && isAfter(currentDate, endConditionDate)) {
            break;
        }

        // Check if current date is within our display range
        if (!isBefore(currentDate, rangeStart) && !isAfter(currentDate, rangeEnd)) {
            // For weekly recurrence, check if this day of week is included
            if (frequency === 'Weekly' && daysOfWeek && daysOfWeek.length > 0) {
                const dayOfWeek = currentDate.getDay();
                if (daysOfWeek.includes(dayOfWeek)) {
                    instances.push(createInstance(baseEvent, currentDate, instanceCount));
                }
            } else {
                // For other frequencies, just create the instance
                instances.push(createInstance(baseEvent, currentDate, instanceCount));
            }
        }

        // Move to next occurrence
        switch (frequency) {
            case 'Daily':
                currentDate = addDays(currentDate, interval);
                break;
            case 'Weekly':
                currentDate = addWeeks(currentDate, interval);
                break;
            case 'Monthly':
                currentDate = addMonths(currentDate, interval);
                break;
            case 'Yearly':
                currentDate = addYears(currentDate, interval);
                break;
        }

        instanceCount++;

        // Safety check: if current date is way past range end, stop
        if (isAfter(currentDate, addYears(rangeEnd, 1))) {
            break;
        }
    }

    return instances;
}

/**
 * Creates a single recurring event instance
 */
function createInstance(baseEvent: Event, date: Date, index: number): Event {
    return {
        ...baseEvent,
        id: `${baseEvent.id}-instance-${index}`,
        date: format(date, 'yyyy-MM-dd'),
        isRecurringInstance: true,
        recurringEventId: baseEvent.id,
    };
}

/**
 * Gets a human-readable description of the recurrence pattern
 */
export function getRecurrenceDescription(recurrence: Event['recurrence']): string {
    if (!recurrence) return 'Does not repeat';

    const { frequency, interval, endDate, count, daysOfWeek } = recurrence;

    let desc = '';

    // Frequency description
    if (interval === 1) {
        switch (frequency) {
            case 'Daily': desc = 'Daily'; break;
            case 'Weekly': desc = 'Weekly'; break;
            case 'Monthly': desc = 'Monthly'; break;
            case 'Yearly': desc = 'Yearly'; break;
        }
    } else {
        switch (frequency) {
            case 'Daily': desc = `Every ${interval} days`; break;
            case 'Weekly': desc = `Every ${interval} weeks`; break;
            case 'Monthly': desc = `Every ${interval} months`; break;
            case 'Yearly': desc = `Every ${interval} years`; break;
        }
    }

    // Days of week for weekly recurrence
    if (frequency === 'Weekly' && daysOfWeek && daysOfWeek.length > 0) {
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const selectedDays = daysOfWeek.map((d: number) => dayNames[d]).join(', ');
        desc += ` on ${selectedDays}`;
    }

    // End condition
    if (endDate) {
        desc += `, until ${endDate}`;
    } else if (count) {
        desc += `, ${count} times`;
    }

    return desc;
}
