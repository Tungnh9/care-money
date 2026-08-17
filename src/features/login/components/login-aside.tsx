import Image from "next/image"
import { Lock } from "lucide-react"

const BRAND_ICONS = ["pig", "book", "cap", "gold"]

function LoginAside() {
  return (
    <aside className="hidden flex-col overflow-hidden bg-[var(--ob-color-surface-invert)] p-[var(--ob-space-8)] text-[var(--ob-color-text-invert)] min-[900px]:flex">
      <div className="flex items-center gap-3">
        <Image src="/assets/logo-mark.svg" width={38} height={38} alt="" />
        <span className="[font:700_20px/1_var(--ob-font-display)] tracking-[var(--ob-track-display)] whitespace-nowrap">
          <span className="text-[var(--ob-cam-400)]">Orange</span>{" "}
          <span className="text-[var(--ob-chuoi-400)]">Banana</span>
        </span>
      </div>

      <div className="my-auto">
        <h1 className="mb-[var(--ob-space-4)] [font:var(--ob-text-display)] tracking-[var(--ob-track-display)]">
          Giữ nhịp
          <br />
          mỗi ngày.
        </h1>
        <p className="max-w-[34ch] text-[17px] leading-relaxed text-[var(--ob-vo-300)]">
          Tiền bạc, nhật ký và việc học của bạn — một nơi duy nhất, chỉ bạn
          nhìn thấy.
        </p>
        <div className="mt-[var(--ob-space-7)] flex gap-[var(--ob-space-2)]">
          {BRAND_ICONS.map((icon) => (
            <span
              key={icon}
              className="grid size-[46px] place-items-center rounded-[var(--ob-radius-md)] bg-[var(--ob-vo-700)]"
            >
              <Image
                src={`/assets/icons/${icon}.svg`}
                width={26}
                height={26}
                alt=""
              />
            </span>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-[var(--ob-space-2)] text-[13px] text-[var(--ob-vo-300)]">
        <Lock size={16} />
        Mặc định lưu trên máy bạn. Đồng bộ giữa thiết bị là tuỳ chọn, chỉ bạn giữ secret.
      </div>
    </aside>
  )
}

export { LoginAside }
