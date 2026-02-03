import { useState, useEffect, useCallback } from 'react';

interface NetworkStatus {
    isOnline: boolean;
    effectiveType?: 'slow-2g' | '2g' | '3g' | '4g';
    downlink?: number;
    rtt?: number;
    saveData?: boolean;
}

interface NavigatorConnection extends EventTarget {
    effectiveType: 'slow-2g' | '2g' | '3g' | '4g';
    downlink: number;
    rtt: number;
    saveData: boolean;
    addEventListener(type: 'change', listener: () => void): void;
    removeEventListener(type: 'change', listener: () => void): void;
}

declare global {
    interface Navigator {
        connection?: NavigatorConnection;
        mozConnection?: NavigatorConnection;
        webkitConnection?: NavigatorConnection;
    }
}

function getConnection(): NavigatorConnection | undefined {
    return navigator.connection || navigator.mozConnection || navigator.webkitConnection;
}

function getNetworkStatus(): NetworkStatus {
    const connection = getConnection();

    return {
        isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
        effectiveType: connection?.effectiveType,
        downlink: connection?.downlink,
        rtt: connection?.rtt,
        saveData: connection?.saveData,
    };
}

/**
 * Hook to monitor network status in real-time.
 * Detects online/offline state and connection quality.
 * 
 * @example
 * const { isOnline, effectiveType } = useNetworkStatus();
 * if (!isOnline) {
 *   return <OfflineMessage />;
 * }
 */
export function useNetworkStatus(): NetworkStatus & {
    wasOffline: boolean;
    backOnlineSince: Date | null;
} {
    const [status, setStatus] = useState<NetworkStatus>(getNetworkStatus);
    const [wasOffline, setWasOffline] = useState(false);
    const [backOnlineSince, setBackOnlineSince] = useState<Date | null>(null);

    const updateNetworkStatus = useCallback(() => {
        const newStatus = getNetworkStatus();

        setStatus((prevStatus) => {
            // Track if we just came back online
            if (!prevStatus.isOnline && newStatus.isOnline) {
                setWasOffline(true);
                setBackOnlineSince(new Date());

                // Reset wasOffline after a delay
                setTimeout(() => {
                    setWasOffline(false);
                }, 5000);
            }

            return newStatus;
        });
    }, []);

    useEffect(() => {
        // Listen for online/offline events
        window.addEventListener('online', updateNetworkStatus);
        window.addEventListener('offline', updateNetworkStatus);

        // Listen for connection changes
        const connection = getConnection();
        if (connection) {
            connection.addEventListener('change', updateNetworkStatus);
        }

        return () => {
            window.removeEventListener('online', updateNetworkStatus);
            window.removeEventListener('offline', updateNetworkStatus);

            if (connection) {
                connection.removeEventListener('change', updateNetworkStatus);
            }
        };
    }, [updateNetworkStatus]);

    return {
        ...status,
        wasOffline,
        backOnlineSince,
    };
}

/**
 * Simple hook that returns just the online status.
 */
export function useIsOnline(): boolean {
    const { isOnline } = useNetworkStatus();
    return isOnline;
}

/**
 * Hook that returns true if the connection is slow (2G or slower).
 */
export function useIsSlowConnection(): boolean {
    const { effectiveType } = useNetworkStatus();
    return effectiveType === 'slow-2g' || effectiveType === '2g';
}
