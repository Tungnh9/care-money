"use client"

import { useFinance } from "@/features/finance/hooks/use-finance"
import { useJournal } from "@/features/journal/hooks/use-journal"
import { useStudy } from "@/features/study/hooks/use-study"
import { ProfileCard } from "./profile-card"
import { BudgetCard } from "./budget-card"
import { ModulesCard } from "./modules-card"
import { MoodsCard } from "./moods-card"
import { DataCard } from "./data-card"
import { ResetCard } from "./reset-card"
import { useDataManagement } from "../hooks/use-data-management"
import { useSettings } from "../hooks/use-settings"

function SettingsView() {
  const {
    settings,
    updateProfile,
    updateBudget,
    toggleModule,
    toggleMood,
    removeMood,
    addMood,
    replaceSettings,
  } = useSettings()
  const { entries, streak } = useJournal()
  const { savings, cards, gold, invests } = useFinance()
  const { tasks, learned } = useStudy()
  const { exported, imported, exportData, importData, wipeData } = useDataManagement({
    onImportSettings: replaceSettings,
  })

  const counts = [
    entries.length ? `${entries.length} bài nhật ký` : null,
    gold.length ? `${gold.length} lần mua vàng` : null,
    invests.length ? `${invests.length} khoản đầu tư` : null,
    savings.length ? `${savings.length} quỹ tiết kiệm` : null,
    cards.length ? `${cards.length} thẻ tín dụng` : null,
    streak ? `chuỗi ${streak} ngày` : null,
    tasks.some((task) => task.done) ? "nhiệm vụ đã tick" : null,
    learned.length ? `${learned.length} từ đã học` : null,
  ].filter((count): count is string => count !== null)

  return (
    <div>
      <h1 className="mb-1 [font:var(--ob-text-h2)] tracking-[var(--ob-track-heading)]">Cài đặt</h1>
      <p className="mb-5 text-sm text-[var(--ob-color-text-subtle)]">
        Chỉ mình bạn dùng · dữ liệu nằm trên máy bạn
      </p>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-5">
        <ProfileCard profile={settings.profile} onChange={updateProfile} />
        <BudgetCard budget={settings.budget} onChange={updateBudget} />
        <MoodsCard moods={settings.moods} onToggle={toggleMood} onRemove={removeMood} onAdd={addMood} />
        <ModulesCard modules={settings.modules} onToggle={toggleModule} />
        <DataCard exported={exported} imported={imported} onExport={exportData} onImport={importData} />
        <ResetCard counts={counts} onWipe={wipeData} onExport={exportData} />
      </div>
    </div>
  )
}

export { SettingsView }
