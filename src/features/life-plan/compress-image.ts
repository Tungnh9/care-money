// Ảnh được thu nhỏ trên trình duyệt trước khi tải lên: tiết kiệm credit Cloudinary và luôn vừa giới hạn 4,5MB mỗi
// request của Vercel Function. Cạnh dài tối đa 1600px, WebP chất lượng 0,8 — khoảng 150–400KB mỗi ảnh.
const MAX_EDGE = 1600
const QUALITY = 0.8

// Kích thước sau khi thu nhỏ: giữ tỉ lệ, cạnh dài không quá `max`. Ảnh đã vừa thì giữ nguyên, không phóng to.
function fitWithin(width: number, height: number, max = MAX_EDGE): { width: number; height: number } {
  const longEdge = Math.max(width, height)
  if (longEdge <= max) return { width, height }
  const scale = max / longEdge
  // Ảnh rất dài và hẹp: cạnh ngắn không được làm tròn về 0 — canvas 0px không xuất được ảnh.
  return { width: Math.max(1, Math.round(width * scale)), height: Math.max(1, Math.round(height * scale)) }
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error("Image failed to load"))
    image.src = url
  })
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, type, QUALITY))
}

// Đọc ảnh bằng <img> nên ảnh chụp xoay theo EXIF được vẽ đúng chiều (mặc định image-orientation: from-image), và
// đọc được mọi định dạng trình duyệt hiện được (kể cả HEIC trên Safari).
async function compressImage(file: File): Promise<Blob> {
  const url = URL.createObjectURL(file)
  try {
    const image = await loadImage(url).catch(() => {
      throw new Error(`Không đọc được ảnh "${file.name}" — file hỏng hoặc không phải ảnh.`)
    })
    const { width, height } = fitWithin(image.naturalWidth, image.naturalHeight)
    const canvas = document.createElement("canvas")
    canvas.width = width
    canvas.height = height
    const context = canvas.getContext("2d")
    if (!context) throw new Error(`Không thu nhỏ được ảnh "${file.name}".`)
    context.imageSmoothingQuality = "high"
    context.drawImage(image, 0, 0, width, height)

    const webp = await canvasToBlob(canvas, "image/webp")
    if (webp?.type === "image/webp") return webp
    // Trình duyệt không xuất được WebP (toBlob trả PNG thay vào, vd. Safari) thì dùng JPEG. JPEG không có nền trong
    // suốt: tô trắng phía sau ảnh để chỗ trong suốt (ảnh chụp màn hình PNG…) không thành màu đen.
    context.globalCompositeOperation = "destination-over"
    context.fillStyle = "#ffffff"
    context.fillRect(0, 0, width, height)
    const jpeg = await canvasToBlob(canvas, "image/jpeg")
    if (!jpeg) throw new Error(`Không thu nhỏ được ảnh "${file.name}".`)
    return jpeg
  } finally {
    URL.revokeObjectURL(url)
  }
}

export { compressImage, fitWithin }
