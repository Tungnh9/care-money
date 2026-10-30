"use client"

import { useEffect, useState } from "react"

import { getCachedImage, putCachedImage } from "@/lib/life-plan/image-cache"
import { getSyncSecret } from "@/lib/sync-secret-storage"
import { fetchLifePlanImage } from "../image-api"

interface LifePlanImageView {
  url: string | null
  failed: boolean
}

const LOADING: LifePlanImageView = { url: null, failed: false }

// Bản trong cache của máy trước; chưa có thì tải về qua API của app rồi cất vào cache — mỗi ảnh chỉ tải từ cloud 1 lần
// trên mỗi máy. Không chờ cất xong mới hiện ảnh: cất lỗi thì lần sau chỉ tải lại.
async function loadImageBlob(id: string): Promise<Blob> {
  const cached = await getCachedImage(id)
  if (cached) return cached
  const secret = getSyncSecret()
  // Máy chưa nhập khoá đồng bộ: server chắc chắn từ chối, khỏi gọi.
  if (!secret) throw new Error("Missing sync secret")
  const downloaded = await fetchLifePlanImage(id, secret)
  void putCachedImage(id, downloaded)
  return downloaded
}

// Object URL để hiện 1 ảnh của ghi chép; `failed` khi không lấy được ảnh (chưa nhập khoá đồng bộ, ảnh không còn trên
// cloud, mất mạng…). Link bị thu hồi khi unmount hay khi đổi sang ảnh khác. `id` null = chưa cần ảnh (ảnh nhỏ còn xa
// màn hình): chưa đọc cache, chưa tải gì.
function useLifePlanImage(id: string | null): LifePlanImageView {
  const [loaded, setLoaded] = useState<(LifePlanImageView & { id: string }) | null>(null)

  useEffect(() => {
    if (id === null) return
    let active = true
    let objectUrl: string | null = null
    loadImageBlob(id).then(
      (blob) => {
        if (!active) return
        objectUrl = URL.createObjectURL(blob)
        setLoaded({ id, url: objectUrl, failed: false })
      },
      () => {
        if (active) setLoaded({ id, url: null, failed: true })
      }
    )
    return () => {
      active = false
      if (!objectUrl) return
      // Bỏ link khỏi state trước khi thu hồi: đổi A → B rồi quay lại A trước khi B xong thì state vẫn còn link
      // của A (đã thu hồi), và lần render đó sẽ trả về đúng cái link chết ấy.
      const revoked = objectUrl
      setLoaded((current) => (current?.url === revoked ? null : current))
      URL.revokeObjectURL(revoked)
    }
  }, [id])

  // Vừa đổi sang ảnh khác mà ảnh mới chưa xong: chưa có gì để hiện — không trả link của ảnh cũ (đã thu hồi).
  if (id === null || loaded?.id !== id) return LOADING
  return { url: loaded.url, failed: loaded.failed }
}

export { useLifePlanImage }
