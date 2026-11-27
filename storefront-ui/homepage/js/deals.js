const savedCodes = new Set(JSON.parse(localStorage.getItem('dop-saved-vouchers') || '[]'));
for (const button of document.querySelectorAll('.voucher [data-code]')) {
  function update() {
    button.disabled = savedCodes.has(button.dataset.code);
    button.textContent = button.disabled ? 'Đã lưu' : 'Lưu mã';
  }
  button.onclick = () => {
    savedCodes.add(button.dataset.code);
    localStorage.setItem('dop-saved-vouchers',JSON.stringify([...savedCodes]));
    update();
  };
  update();
}
