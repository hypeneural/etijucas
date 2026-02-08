export interface ZonedNow {
    date: string;
    time: string;
    dateTime: string;
    hour: number;
    minute: number;
}

function readPart(parts: Intl.DateTimeFormatPart[], type: Intl.DateTimeFormatPartTypes): string {
    return parts.find((part) => part.type === type)?.value ?? '';
}

export function getNowInTimeZone(timezone: string): ZonedNow {
    const formatter = new Intl.DateTimeFormat('en-CA', {
        timeZone: timezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
    });

    const parts = formatter.formatToParts(new Date());
    const year = readPart(parts, 'year');
    const month = readPart(parts, 'month');
    const day = readPart(parts, 'day');
    const hour = readPart(parts, 'hour');
    const minute = readPart(parts, 'minute');

    const date = `${year}-${month}-${day}`;
    const time = `${hour}:${minute}`;

    return {
        date,
        time,
        dateTime: `${date}T${time}`,
        hour: Number.parseInt(hour, 10) || 0,
        minute: Number.parseInt(minute, 10) || 0,
    };
}

export function extractDateFromLocalIso(value: string): string {
    const match = value.match(/^(\d{4}-\d{2}-\d{2})/);
    return match?.[1] ?? '';
}

export function extractHourFromLocalIso(value: string): number {
    const match = value.match(/T(\d{2})/);
    return Number.parseInt(match?.[1] ?? '0', 10) || 0;
}

export function extractTimeFromLocalIso(value: string): string {
    const match = value.match(/T(\d{2}:\d{2})/);
    return match?.[1] ?? '00:00';
}

export function toLocalDateDisplay(
    date: string,
    timezone: string,
    options: Intl.DateTimeFormatOptions
): string {
    const safeDate = new Date(`${date}T12:00:00Z`);

    return new Intl.DateTimeFormat('pt-BR', {
        ...options,
        timeZone: timezone,
    }).format(safeDate);
}
