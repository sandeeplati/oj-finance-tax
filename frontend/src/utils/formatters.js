/**
 * Format number as Indian currency
 */
export const formatCurrency = (amount) => {
  if (amount === null || amount === undefined) return '₹0';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Math.round(amount));
};

/**
 * Format number with Indian number system (lakhs, crores)
 */
export const formatIndianNumber = (num) => {
  if (!num) return '0';
  return new Intl.NumberFormat('en-IN').format(Math.round(num));
};

/**
 * Convert number to words (Indian system)
 */
export const toIndianWords = (num) => {
  if (num >= 10000000) return `${(num / 10000000).toFixed(2)} Cr`;
  if (num >= 100000) return `${(num / 100000).toFixed(2)} L`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)} K`;
  return num.toString();
};

/**
 * Get priority color class
 */
export const getPriorityColor = (priority) => {
  switch (priority) {
    case 'HIGH': return { bg: 'bg-red-50', border: 'border-red-200', badge: 'bg-red-100 text-red-700', text: 'text-red-600' };
    case 'MEDIUM': return { bg: 'bg-yellow-50', border: 'border-yellow-200', badge: 'bg-yellow-100 text-yellow-700', text: 'text-yellow-600' };
    case 'LOW': return { bg: 'bg-green-50', border: 'border-green-200', badge: 'bg-green-100 text-green-700', text: 'text-green-600' };
    default: return { bg: 'bg-gray-50', border: 'border-gray-200', badge: 'bg-gray-100 text-gray-700', text: 'text-gray-600' };
  }
};

/**
 * Calculate percentage
 */
export const calcPercentage = (value, max) => {
  if (!max || max === 0) return 0;
  return Math.min(100, Math.round((value / max) * 100));
};

// Made with Bob
