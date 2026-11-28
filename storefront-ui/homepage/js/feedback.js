const form = document.querySelector('.voice-form');
const statusLine = form.querySelector('[role=status]');
const message = form.elements.message;
updateCartBadge(Object.values(JSON.parse(localStorage.getItem('dop-cart') || '{}')).filter(n => n > 0).length);
message.oninput = () => message.setCustomValidity('');
form.onsubmit = async event => {
  event.preventDefault();
  if (!message.value.trim()) {
    message.setCustomValidity('Bạn hãy nhập nội dung góp ý.');
    message.reportValidity();
    return;
  }
  const button = form.querySelector('button');
  button.disabled = true;
  statusLine.textContent = 'Đang gửi…';
  try {
    const response = await fetch('api/feedback', {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(Object.fromEntries(new FormData(form)))});
    if (response.status !== 201 || !(await response.json()).received) throw new Error();
    form.reset();
    statusLine.textContent = 'Cảm ơn bạn! DOP Mart đã nhận góp ý.';
  } catch {
    statusLine.textContent = 'Chưa gửi được góp ý. Nội dung vẫn còn ở đây để bạn thử lại.';
  } finally {
    button.disabled = false;
  }
};
