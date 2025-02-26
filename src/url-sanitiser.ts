/**
 * Sanitises an RTSP URL by removing sensitive information
 * @param rtspUrl The original RTSP URL
 * @returns Sanitised RTSP URL with credentials removed
 */
export function sanitiseRtspUrl(rtspUrl: string): string {
    try {
        // Handle empty or invalid URLs
        if (!rtspUrl || !rtspUrl.startsWith('rtsp://')) {
            return 'rtsp://[invalid-url]';
        }

        // Parse the RTSP URL
        const rtspRegex = /rtsp:\/\/(?:([^:@/]+)(?::([^@/]+))?@)?([^:/]+)(?::(\d+))?(\/[^?]*)?(?:\?(.*))?/;
        const match = rtspUrl.match(rtspRegex);

        if (!match) {
            return 'rtsp://[invalid-url]';
        }

        const [, username, password, host, port, path, query] = match;

        // Reconstruct URL without credentials
        let sanitisedUrl = 'rtsp://';
        
        // If credentials were present, add [credentials-removed] placeholder
        if (username || password) {
            sanitisedUrl += '[credentials-removed]@';
        }

        // Add host
        sanitisedUrl += host;

        // Add port if present
        if (port) {
            sanitisedUrl += ':' + port;
        }

        // Add path if present
        if (path) {
            sanitisedUrl += path;
        }

        // Add sanitised query parameters if present
        if (query) {
            // Remove any sensitive information from query parameters
            const sanitisedQuery = query.split('&')
                .map(param => {
                    const [key ] = param.split('=');
                    const sensitiveParams = ['password', 'pass', 'pwd', 'token', 'auth', 'key'];
                    if (sensitiveParams.some(p => key.toLowerCase().includes(p))) {
                        return `${key}=[redacted]`;
                    }
                    return param;
                })
                .join('&');
            sanitisedUrl += '?' + sanitisedQuery;
        }

        return sanitisedUrl;
    } catch (error) {
        // Return a safe fallback if anything goes wrong
        console.error('Error sanitising RTSP URL:', error);
        return 'rtsp://[error-sanitising-url]';
    }
}