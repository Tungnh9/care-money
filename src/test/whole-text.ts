// getByText mặc định chỉ so chữ nằm TRỰC TIẾP trong 1 phần tử. Chuỗi bị tách thành nhiều đoạn tô màu khác nhau
// (vd. ô quẹt thẻ "0 ₫ / 3.908.680 ₫", phần sau "/" là 1 span đỏ riêng) thì so trên textContent, lấy phần tử
// trong cùng chứa đúng cả chuỗi đó.
function wholeText(text: string) {
  return (_content: string, element: Element | null): boolean =>
    element?.textContent === text && Array.from(element.children).every((child) => child.textContent !== text)
}

export { wholeText }
