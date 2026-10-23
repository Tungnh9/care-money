interface SavingsFund {
  name: string
  amount: number
  target: number
  note?: string
}

interface CreditCard {
  name: string
  balance: number
  min: number
  limit: number
  due: string
  color?: string
}

// Cửa hàng vàng/bạc: giá hôm nay là chuỗi chữ số (ô nhập có nhóm nghìn), tính theo đơn vị của chính
// kim loại đó — vàng theo phân, bạc theo lượng.
interface MetalStore {
  name: string
  price: string
}

// Phần chung của 1 lần mua vàng/bạc. Khối lượng nằm ở field riêng của từng kim loại (`phan`, `luong`)
// để file sao lưu tự nói đơn vị và TypeScript không cho lẫn lần mua bạc vào code vàng. `buy` là giá
// mua mỗi đơn vị; `store` tham chiếu cửa hàng bằng tên.
interface MetalPurchaseBase {
  id: number
  date: string
  buy: number
  store: string
}

type GoldStore = MetalStore

interface GoldPurchase extends MetalPurchaseBase {
  phan: number
}

type SilverStore = MetalStore

// Bạc tính thẳng theo lượng, không có đơn vị quy đổi: `luong` là số lượng nguyên, `buy` là giá mỗi lượng.
interface SilverPurchase extends MetalPurchaseBase {
  luong: number
}

// 1 lần lấy vàng/bạc ra từ 1 lần mua để tặng. `qty` theo đơn vị của kim loại đó (phân/lượng); `date` là
// ngày tặng dạng dd/mm/yyyy như ngày mua. `store` và `buy` chụp lại từ lần mua lúc tặng — sau đó sửa lần
// mua hay đổi tên cửa hàng thì lịch sử vẫn ghi đúng "rút ra sao", và trị giá lần tặng = qty × buy.
interface MetalGift {
  id: number
  purchaseId: number
  date: string
  qty: number
  store: string
  buy: number
  note?: string
}

type MetalGiftInput = Pick<MetalGift, "date" | "qty" | "note">

interface Investment {
  id: number
  name: string
  cost: number
  value: number
}

export type {
  SavingsFund,
  CreditCard,
  MetalStore,
  MetalPurchaseBase,
  GoldStore,
  GoldPurchase,
  SilverStore,
  SilverPurchase,
  MetalGift,
  MetalGiftInput,
  Investment,
}
