"use client"

import { ProfileCard } from "./profile-card"
import { BudgetCard } from "./budget-card"
import { ModulesCard } from "./modules-card"
import { MoodsCard } from "./moods-card"
import { useSettings } from "../hooks/use-settings"

function SettingsView() {
  const { settings, updateProfile, updateBudget, toggleModule, toggleMood, removeMood, addMood } =
    useSettings()

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
      </div>
    </div>
  )
}

export { SettingsView }
