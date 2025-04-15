/**
 * Extract device and browser information from user agent
 * @param {string} userAgent - User agent string from request
 * @returns {Object} Device and browser information
 */
export const getDeviceInfo = (userAgent) => {
  let device = 'Unknown device';
  let browser = 'Unknown browser';

  // Detect device
  if (/iPhone/i.test(userAgent)) {
    device = 'iPhone';
  } else if (/iPad/i.test(userAgent)) {
    device = 'iPad';
  } else if (/Android/i.test(userAgent)) {
    device = 'Android device';
  } else if (/Windows Phone/i.test(userAgent)) {
    device = 'Windows Phone';
  } else if (/Windows/i.test(userAgent)) {
    device = 'Windows computer';
  } else if (/Macintosh/i.test(userAgent)) {
    device = 'Mac computer';
  } else if (/Linux/i.test(userAgent)) {
    device = 'Linux computer';
  }

  // Detect browser
  if (/Chrome/i.test(userAgent) && !/Chromium|Edge|OPR|Opera/i.test(userAgent)) {
    browser = 'Chrome';
  } else if (/Firefox/i.test(userAgent)) {
    browser = 'Firefox';
  } else if (/Safari/i.test(userAgent) && !/Chrome|Chromium|Edge|OPR|Opera/i.test(userAgent)) {
    browser = 'Safari';
  } else if (/Edge/i.test(userAgent)) {
    browser = 'Edge';
  } else if (/Opera|OPR/i.test(userAgent)) {
    browser = 'Opera';
  } else if (/MSIE|Trident/i.test(userAgent)) {
    browser = 'Internet Explorer';
  }

  return { device, browser };
};

/**
 * Get client IP address from request
 * @param {Object} req - Express request object
 * @returns {string} IP address
 */
export const getClientIp = (req) => {
  return req.headers['x-forwarded-for'] || 
         req.connection.remoteAddress || 
         req.socket.remoteAddress || 
         (req.connection.socket ? req.connection.socket.remoteAddress : null) ||
         'Unknown';
};

/**
 * Get formatted current time
 * @returns {string} Formatted time string
 */
export const getCurrentTime = () => {
  return new Date().toLocaleString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZoneName: 'short'
  });
};