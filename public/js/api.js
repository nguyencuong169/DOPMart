'use strict';

/**
 * Lớp gọi API và các hàm định dạng dùng chung cho giao diện DOP Mart.
 */

(function () {
  async function request(path, options = {}) {
    const config = {
      method: options.method || 'GET',
      credentials: 'same-origin',
      headers: { Accept: 'application/json' },
    };

    if (options.body !== undefined) {
      config.headers['Content-Type'] = 'application/json';
      config.body = JSON.stringify(options.body);
    }

    let response;
    try {
      response = await fetch(path, config);
    } catch (error) {
      throw new Error('Không kết nối được máy chủ DOP Mart. Vui lòng thử lại.');
    }

    const text = await response.text();
    let data = {};
    if (text) {
      try {
        data = JSON.parse(text);
      } catch (error) {
        data = {};
      }
    }

    if (!response.ok) {
      const message = data.error || `Yêu cầu thất bại (${response.status})`;
      const err = new Error(message);
      err.status = response.status;
      err.details = data.details;
      throw err;
    }

    return data;
  }

  const api = {
    get: (path) => request(path),
    post: (path, body) => request(path, { method: 'POST', body: body || {} }),
    put: (path, body) => request(path, { method: 'PUT', body: body || {} }),
    patch: (path, body) => request(path, { method: 'PATCH', body: body || {} }),
    del: (path) => request(path, { method: 'DELETE' }),
    request,
  };

  const money = (value) => {
    const amount = Number(value) || 0;
    return `${new Intl.NumberFormat('vi-VN').format(Math.round(amount))}₫`;
  };

  const number = (value) => new Intl.NumberFormat('vi-VN').format(Number(value) || 0);

  const escapeHtml = (value) =>
    String(value == null ? '' : value).replace(/[&<>"']/g, (char) => {
      switch (char) {
        case '&':
          return '&amp;';
        case '<':
          return '&lt;';
        case '>':
          return '&gt;';
        case '"':
          return '&quot;';
        default:
          return '&#39;';
      }
    });

  const formatDate = (iso) => {
    if (!iso) return '';
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const discountPercent = (product) => {
    if (!product || !product.oldPrice || product.oldPrice <= product.price) return 0;
    return Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100);
  };

  const STATUS_META = {
    pending: { label: 'Chờ xác nhận', icon: '🕒' },
    confirmed: { label: 'Đã xác nhận', icon: '✅' },
    packing: { label: 'Đang đóng gói', icon: '📦' },
    shipping: { label: 'Đang giao hàng', icon: '🚚' },
    delivered: { label: 'Đã giao', icon: '🎉' },
    cancelled: { label: 'Đã huỷ', icon: '✖️' },
  };

  window.API = api;
  window.fmtMoney = money;
  window.fmtNumber = number;
  window.escapeHtml = escapeHtml;
  window.fmtDate = formatDate;
  window.discountPercent = discountPercent;
  window.STATUS_META = STATUS_META;
})();
