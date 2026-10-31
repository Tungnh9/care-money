// Ảnh trang Plan đã tải về được giữ lại trong IndexedDB của trình duyệt, để mỗi ảnh chỉ tải từ Cloudinary 1 lần
// trên mỗi máy — tiết kiệm credit tải về của gói miễn phí. Mỗi lần tải lên là 1 mã ảnh mới, nội dung sau 1 mã không
// bao giờ đổi, nên bản trong cache không bao giờ cũ.
// Cache chỉ là phần thêm: không có IndexedDB (lúc SSR, jsdom, trình duyệt chặn lưu trữ) hay IndexedDB lỗi thì đọc ra
// null và bỏ qua ghi/xoá, không bao giờ ném lỗi — nơi gọi chỉ việc tải lại ảnh từ cloud.

const DB_NAME = "life-plan-images"
const DB_VERSION = 1
const STORE_NAME = "images"

// Kết nối mở 1 lần, dùng chung cho mọi lần đọc/ghi sau.
let connection: Promise<IDBDatabase> | null = null

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") throw new Error("IndexedDB is not available")
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    // Store khoá ngoài: khoá là mã ảnh, giá trị là Blob của ảnh.
    request.onupgradeneeded = () => {
      request.result.createObjectStore(STORE_NAME)
    }
    request.onsuccess = () => {
      const db = request.result
      // Trình duyệt tự đóng kết nối (vd. người dùng xoá dữ liệu trang), hay 1 tab khác cần nâng version database:
      // bỏ kết nối này, lần đọc/ghi sau mở lại.
      db.onclose = () => {
        connection = null
      }
      db.onversionchange = () => {
        db.close()
        connection = null
      }
      resolve(db)
    }
    request.onerror = () => reject(request.error)
  })
}

function getDatabase(): Promise<IDBDatabase> {
  if (!connection) {
    const opening = openDatabase()
    connection = opening
    // Mở lỗi thì lần sau thử mở lại, không giữ mãi lỗi đó.
    opening.catch(() => {
      if (connection === opening) connection = null
    })
  }
  return connection
}

// 1 thao tác trên store ảnh; xong khi transaction của nó xong, tức là đã ghi thật.
async function runInStore<T>(mode: IDBTransactionMode, operate: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await getDatabase()
  return new Promise<T>((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, mode)
    const request = operate(transaction.objectStore(STORE_NAME))
    transaction.oncomplete = () => resolve(request.result)
    transaction.onerror = () => reject(transaction.error ?? request.error)
    transaction.onabort = () => reject(transaction.error ?? request.error)
  })
}

// Ghi/xoá cache lỗi thì bỏ qua: ảnh vẫn nằm trên cloud, lần sau chỉ tải lại.
function quietly(operation: Promise<unknown>): Promise<void> {
  return operation.then(
    () => undefined,
    () => undefined
  )
}

async function getCachedImage(id: string): Promise<Blob | null> {
  try {
    const value: unknown = await runInStore("readonly", (store) => store.get(id))
    return value instanceof Blob ? value : null
  } catch {
    return null
  }
}

function putCachedImage(id: string, blob: Blob): Promise<void> {
  return quietly(runInStore("readwrite", (store) => store.put(blob, id)))
}

function deleteCachedImage(id: string): Promise<void> {
  return quietly(runInStore("readwrite", (store) => store.delete(id)))
}

// "Bắt đầu lại" dọn hết ảnh trên máy; ảnh trên Cloudinary giữ nguyên.
function clearImageCache(): Promise<void> {
  return quietly(runInStore("readwrite", (store) => store.clear()))
}

export { clearImageCache, deleteCachedImage, getCachedImage, putCachedImage }
