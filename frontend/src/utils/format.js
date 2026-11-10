/**
 * Định dạng tiền tệ Việt Nam Đồng (VNĐ)
 * @param {number} amount 
 * @param {boolean} showSymbol 
 */
export function formatVND(amount = 0, showSymbol = true) {
  const rounded = Math.round(Number(amount) || 0);
  const formatted = new Intl.NumberFormat('vi-VN').format(rounded);
  return showSymbol ? `${formatted} ₫` : formatted;
}

/**
 * Định dạng ngày tháng
 * @param {string|Date} date 
 */
export function formatDate(date) {
  if (!date) return '';
  const d = new Date(date);
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).format(d);
}

/**
 * Định dạng ngày và giờ chi tiết
 * @param {string|Date} date 
 */
export function formatDateTime(date) {
  if (!date) return '';
  const d = new Date(date);
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(d);
}

/**
 * Lấy chữ cái viết tắt của tên
 * @param {string} name 
 */
export function getInitials(name = '') {
  if (!name) return 'FS';
  const parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
