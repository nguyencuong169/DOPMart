const password = document.querySelector('#password');
const reveal = document.querySelector('#reveal');
const status = document.querySelector('#status');
reveal.onclick = () => {
  const visible = password.type === 'password';
  password.type = visible ? 'text' : 'password';
  reveal.setAttribute('aria-label', visible ? 'Ẩn mật khẩu' : 'Hiện mật khẩu');
  reveal.setAttribute('aria-pressed', String(visible));
  document.querySelector('#slash').style.display = visible ? 'none' : '';
};
document.querySelector('#login').onsubmit = event => {
  event.preventDefault();
  status.textContent = 'Bản xem thử giao diện. Thông tin đăng nhập chưa được gửi.';
};
document.querySelectorAll('[data-preview]').forEach(button => {
  button.onclick = () => { status.textContent = button.dataset.preview + ' chưa được kết nối trong bản xem thử.'; };
});