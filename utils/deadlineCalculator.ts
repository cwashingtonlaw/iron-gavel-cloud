import { addDays, isWeekend, parseISO, format, differenceInDays } from 'date-fns';
import {
    CourtRule,
    Holiday,
    CalculatedDeadline,
    DeadlineWarning,
    Jurisdiction,
    ServiceMethod
} from '../types';

// ============================================================================
// FEDERAL HOLIDAYS (recurring)
// ============================================================================
export const getFederalHolidays = (year: number): Holiday[] => {
    return [
        { id: `ny-${year}`, name: "New Year's Day", date: `${year}-01-01`, jurisdiction: 'Federal', recurring: true },
        { id: `mlk-${year}`, name: "Martin Luther King Jr. Day", date: `${year}-01-15`, jurisdiction: 'Federal', recurring: true },
        { id: `pres-${year}`, name: "Presidents' Day", date: `${year}-02-19`, jurisdiction: 'Federal', recurring: true },
        { id: `mem-${year}`, name: "Memorial Day", date: `${year}-05-27`, jurisdiction: 'Federal', recurring: true },
        { id: `july4-${year}`, name: "Independence Day", date: `${year}-07-04`, jurisdiction: 'Federal', recurring: true },
        { id: `labor-${year}`, name: "Labor Day", date: `${year}-09-02`, jurisdiction: 'Federal', recurring: true },
        { id: `col-${year}`, name: "Columbus Day", date: `${year}-10-14`, jurisdiction: 'Federal', recurring: true },
        { id: `vet-${year}`, name: "Veterans Day", date: `${year}-11-11`, jurisdiction: 'Federal', recurring: true },
        { id: `thanks-${year}`, name: "Thanksgiving", date: `${year}-11-28`, jurisdiction: 'Federal', recurring: true },
        { id: `xmas-${year}`, name: "Christmas", date: `${year}-12-25`, jurisdiction: 'Federal', recurring: true },
    ];
};

// ============================================================================
// COURT RULES DATABASE
// ============================================================================
export const COURT_RULES: CourtRule[] = [
    // Federal Rules of Civil Procedure
    {
        id: 'frcp-12a1a',
        jurisdiction: 'Federal',
        ruleName: 'FRCP 12(a)(1)(A)',
        description: 'Answer to complaint - served within US',
        baseDays: 21,
        excludeWeekends: false,
        excludeHolidays: true,
        serviceMethodAdjustments: {
            'Mail': 3,
            'Email': 0,
            'Electronic Filing': 0,
            'Personal': 0,
        },
    },
    {
        id: 'frcp-12a1b',
        jurisdiction: 'Federal',
        ruleName: 'FRCP 12(a)(1)(B)',
        description: 'Answer to complaint - US government defendant',
        baseDays: 60,
        excludeWeekends: false,
        excludeHolidays: true,
        serviceMethodAdjustments: {
            'Mail': 3,
            'Email': 0,
            'Electronic Filing': 0,
            'Personal': 0,
        },
    },
    {
        id: 'frcp-56c',
        jurisdiction: 'Federal',
        ruleName: 'FRCP 56(c)',
        description: 'Response to motion for summary judgment',
        baseDays: 21,
        excludeWeekends: false,
        excludeHolidays: true,
        serviceMethodAdjustments: {
            'Mail': 3,
            'Email': 0,
            'Electronic Filing': 0,
            'Personal': 0,
        },
    },
    {
        id: 'frcp-26a1',
        jurisdiction: 'Federal',
        ruleName: 'FRCP 26(a)(1)',
        description: 'Initial disclosures',
        baseDays: 14,
        excludeWeekends: false,
        excludeHolidays: true,
        serviceMethodAdjustments: {
            'Mail': 0,
            'Email': 0,
            'Electronic Filing': 0,
            'Personal': 0,
        },
    },
    // California Code of Civil Procedure
    {
        id: 'ccp-412.20',
        jurisdiction: 'California',
        ruleName: 'CCP § 412.20',
        description: 'Answer to complaint',
        baseDays: 30,
        excludeWeekends: false,
        excludeHolidays: true,
        serviceMethodAdjustments: {
            'Mail': 5,
            'Email': 2,
            'Electronic Filing': 2,
            'Personal': 0,
        },
    },
    {
        id: 'ccp-1005',
        jurisdiction: 'California',
        ruleName: 'CCP § 1005',
        description: 'Notice of motion',
        baseDays: 16,
        excludeWeekends: true,
        excludeHolidays: true,
        serviceMethodAdjustments: {
            'Mail': 5,
            'Email': 2,
            'Electronic Filing': 2,
            'Personal': 0,
        },
    },
    // New York CPLR
    {
        id: 'cplr-320',
        jurisdiction: 'New York',
        ruleName: 'CPLR 320',
        description: 'Answer to complaint - personal service',
        baseDays: 20,
        excludeWeekends: false,
        excludeHolidays: true,
        serviceMethodAdjustments: {
            'Mail': 3,
            'Email': 0,
            'Electronic Filing': 0,
            'Personal': 0,
        },
    },
    {
        id: 'cplr-320-mail',
        jurisdiction: 'New York',
        ruleName: 'CPLR 320',
        description: 'Answer to complaint - mail service',
        baseDays: 30,
        excludeWeekends: false,
        excludeHolidays: true,
        serviceMethodAdjustments: {
            'Mail': 0,
            'Email': 0,
            'Electronic Filing': 0,
            'Personal': 0,
        },
    },
    // Texas Rules of Civil Procedure
    {
        id: 'trcp-99',
        jurisdiction: 'Texas',
        ruleName: 'TRCP 99',
        description: 'Answer to complaint',
        baseDays: 20,
        excludeWeekends: false,
        excludeHolidays: true,
        serviceMethodAdjustments: {
            'Mail': 0,
            'Email': 0,
            'Electronic Filing': 0,
            'Personal': 0,
        },
    },
];

// ============================================================================
// DEADLINE CALCULATION ENGINE
// ============================================================================

/**
 * Calculate a deadline based on court rules, excluding weekends and holidays as specified
 */
export const calculateDeadline = (
    triggerDate: string,
    rule: CourtRule,
    serviceMethod: ServiceMethod,
    customHolidays: Holiday[] = []
): string => {
    let currentDate = parseISO(triggerDate);

    // Get base days + service method adjustment
    const serviceAdjustment = rule.serviceMethodAdjustments[serviceMethod] || 0;
    let totalDays = rule.baseDays + serviceAdjustment;

    // Get all applicable holidays
    const year = currentDate.getFullYear();
    const federalHolidays = getFederalHolidays(year);
    const allHolidays = [...federalHolidays, ...customHolidays];
    const holidayDates = new Set(allHolidays.map(h => h.date));

    let daysAdded = 0;

    while (daysAdded < totalDays) {
        currentDate = addDays(currentDate, 1);
        const dateStr = format(currentDate, 'yyyy-MM-dd');

        // Check if we should skip this day
        const isHoliday = rule.excludeHolidays && holidayDates.has(dateStr);
        const isWeekendDay = rule.excludeWeekends && isWeekend(currentDate);

        if (!isHoliday && !isWeekendDay) {
            daysAdded++;
        }
    }

    return format(currentDate, 'yyyy-MM-dd');
};

/**
 * Generate deadline warnings based on days until due
 */
export const generateDeadlineWarnings = (
    deadline: CalculatedDeadline,
    currentDate: string = new Date().toISOString().split('T')[0]
): DeadlineWarning[] => {
    const warnings: DeadlineWarning[] = [];
    const daysUntil = differenceInDays(parseISO(deadline.dueDate), parseISO(currentDate));

    if (daysUntil < 0) {
        warnings.push({
            id: `${deadline.id}-missed`,
            deadlineId: deadline.id,
            type: 'Missed',
            daysUntilDue: daysUntil,
            message: `CRITICAL: Deadline missed by ${Math.abs(daysUntil)} days!`,
            timestamp: new Date().toISOString(),
            acknowledged: false,
        });
    } else if (daysUntil <= 3 && deadline.priority === 'Critical') {
        warnings.push({
            id: `${deadline.id}-urgent`,
            deadlineId: deadline.id,
            type: 'Urgent',
            daysUntilDue: daysUntil,
            message: `URGENT: Critical deadline in ${daysUntil} days!`,
            timestamp: new Date().toISOString(),
            acknowledged: false,
        });
    } else if (daysUntil <= 7) {
        warnings.push({
            id: `${deadline.id}-approaching`,
            deadlineId: deadline.id,
            type: 'Approaching',
            daysUntilDue: daysUntil,
            message: `Deadline approaching in ${daysUntil} days`,
            timestamp: new Date().toISOString(),
            acknowledged: false,
        });
    }

    return warnings;
};

/**
 * Get court rule by ID
 */
export const getCourtRule = (ruleId: string): CourtRule | undefined => {
    return COURT_RULES.find(r => r.id === ruleId);
};

/**
 * Get all rules for a jurisdiction
 */
export const getRulesByJurisdiction = (jurisdiction: Jurisdiction): CourtRule[] => {
    return COURT_RULES.filter(r => r.jurisdiction === jurisdiction);
};

/**
 * Calculate multiple deadlines in a chain
 */
export const calculateDeadlineChain = (
    triggerDate: string,
    steps: Array<{
        ruleId: string;
        serviceMethod: ServiceMethod;
        name: string;
        priority: 'Critical' | 'High' | 'Medium' | 'Low';
    }>,
    matterId: string,
    customHolidays: Holiday[] = []
): CalculatedDeadline[] => {
    const deadlines: CalculatedDeadline[] = [];
    let currentTrigger = triggerDate;

    steps.forEach((step, index) => {
        const rule = getCourtRule(step.ruleId);
        if (!rule) return;

        const dueDate = calculateDeadline(currentTrigger, rule, step.serviceMethod, customHolidays);

        const deadline: CalculatedDeadline = {
            id: `${matterId}-deadline-${index}`,
            matterId,
            name: step.name,
            triggerDate: currentTrigger,
            dueDate,
            ruleId: step.ruleId,
            serviceMethod: step.serviceMethod,
            priority: step.priority,
            status: 'Pending',
            warnings: [],
        };

        deadline.warnings = generateDeadlineWarnings(deadline);
        deadlines.push(deadline);

        // Next deadline triggers from this one's due date
        currentTrigger = dueDate;
    });

    return deadlines;
};
