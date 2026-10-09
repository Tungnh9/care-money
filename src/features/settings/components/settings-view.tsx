"use client"

import { useFinance } from "@/lib/finance/use-finance"
import { useJournal } from "@/lib/journal/use-journal"
import { useStudy } from "@/lib/study/use-study"
import { useBudget } from "@/lib/budget/use-budget"
import { useNetWorthHistory } from "@/lib/net-worth/use-net-worth-history"
import { splitGreeting } from "@/lib/settings/greeting"
import { ProfileCard } from "./profile-card"
import { ModulesCard } from "./modules-card"
import { MoodsCard } from "./moods-card"
import { TagsCard } from "./tags-card"
import { DataCard } from "./data-card"
import { ResetCard } from "./reset-card"
import { useDataManagement } from "../hooks/use-data-management"
import { useSettings } from "@/lib/settings/use-settings"

function SettingsView() {
  const {
    settings,
    updateProfile,
    toggleModule,
    toggleMood,
    removeMood,
    addMood,
    toggleTag,
    replaceSettings,
  } = useSettings()
  const { entries, replaceJournal } = useJournal()
  const { savings, cards, gold, invests, replaceFinance } = useFinance()
  const { tasks, learned, gameHighScores, gameStreak, wordReviews, replaceStudy } = useStudy()
  const { salaries, expenses, settlements, replaceBudget } = useBudget()
  const { history: netWorthHistory, replaceHistory: replaceNetWorthHistory } = useNetWorthHistory()
  const {
    exported,
    imported,
    exportData,
    importData,
    wipeData,
    syncing,
    syncResult,
    pushToCloud,
    pullFromCloud,
    pendingRestore,
    confirmRestore,
    cancelRestore,
  } = useDataManagement({
    onReplaceJournal: replaceJournal,
    onReplaceFinance: replaceFinance,
    onReplaceStudy: replaceStudy,
    onReplaceSettings: replaceSettings,
    onReplaceBudget: replaceBudget,
    onReplaceNetWorthHistory: replaceNetWorthHistory,
  })

  // Đếm đủ mọi thứ wipeData sẽ xoá — thiếu mục nào thì ResetCard có thể báo như không còn gì trong khi
  // vẫn xoá lương, tất toán, lịch sử tài sản, tiến độ ôn từ hay điểm mini-game.
  const reviewedWords = Object.values(wordReviews).filter((review) => review.lastReviewedAt !== null).length
  const salaryMonths = salaries.filter((salary) => salary.amount > 0).length
  const counts = [
    entries.length ? `${entries.length} bài nhật ký` : null,
    gold.length ? `${gold.length} lần mua vàng` : null,
    invests.length ? `${invests.length} khoản đầu tư` : null,
    savings.length ? `${savings.length} quỹ tiết kiệm` : null,
    cards.length ? `${cards.length} thẻ tín dụng` : null,
    tasks.some((task) => task.done) ? "nhiệm vụ đã tick" : null,
    learned.length ? `${learned.length} từ đã học` : null,
    reviewedWords ? `tiến độ ôn ${reviewedWords} từ` : null,
    Object.values(gameHighScores).some((score) => score > 0) ? "điểm cao mini-game" : null,
    gameStreak.count > 0 ? "chuỗi ngày chơi mini-game" : null,
    expenses.length ? `${expenses.length} khoản chi` : null,
    salaryMonths ? `${salaryMonths} tháng lương` : null,
    settlements.length ? `${settlements.length} lần tất toán` : null,
    netWorthHistory.length ? `${netWorthHistory.length} ngày lịch sử tài sản` : null,
  ].filter((count): count is string => count !== null)

  function handleSaveDisplayName(name: string) {
    const { prefix } = splitGreeting(settings.profile.greeting, settings.profile.displayName)
    updateProfile({ displayName: name, greeting: prefix ? `${prefix}, ${name}` : name })
  }

  return (
    <div>
      <h1 className="mb-1 [font:var(--ob-text-h2)] tracking-[var(--ob-track-heading)]">Cài đặt</h1>
      <p className="mb-5 text-sm text-[var(--ob-color-text-subtle)]">
        Chỉ mình bạn dùng · mặc định lưu trên máy bạn, đồng bộ giữa thiết bị là tuỳ chọn
      </p>
      <div className="ob-card-grid flex flex-wrap gap-5">
        <ProfileCard displayName={settings.profile.displayName} onSave={handleSaveDisplayName} />
        <MoodsCard moods={settings.moods} onToggle={toggleMood} onRemove={removeMood} onAdd={addMood} />
        <TagsCard tags={settings.tags} onToggle={toggleTag} />
        <ModulesCard modules={settings.modules} onToggle={toggleModule} />
        <DataCard
          exported={exported}
          imported={imported}
          syncing={syncing}
          syncResult={syncResult}
          pendingRestore={pendingRestore}
          onExport={exportData}
          onImport={importData}
          onPushToCloud={pushToCloud}
          onPullFromCloud={pullFromCloud}
          onConfirmRestore={confirmRestore}
          onCancelRestore={cancelRestore}
        />
        <ResetCard counts={counts} onWipe={wipeData} onExport={exportData} />
      </div>
    </div>
  )
}

export { SettingsView }
