"use client"

import { useFinance } from "@/features/finance/hooks/use-finance"
import { useJournal } from "@/features/journal/hooks/use-journal"
import { useStudy } from "@/features/study/hooks/use-study"
import { splitGreeting } from "@/features/overview/overview-calculations"
import { useT } from "@/components/locale-provider"
import { ProfileCard } from "./profile-card"
import { LanguageCard } from "./language-card"
import { ModulesCard } from "./modules-card"
import { MoodsCard } from "./moods-card"
import { DataCard } from "./data-card"
import { ResetCard } from "./reset-card"
import { useDataManagement } from "../hooks/use-data-management"
import { useSettings } from "../hooks/use-settings"

function SettingsView() {
  const t = useT()
  const { settings, updateProfile, toggleModule, toggleMood, removeMood, addMood, replaceSettings } =
    useSettings()
  const { entries, replaceJournal } = useJournal()
  const { savings, cards, gold, invests, replaceFinance } = useFinance()
  const { tasks, learned, replaceStudy } = useStudy()
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
  } = useDataManagement({
    onReplaceJournal: replaceJournal,
    onReplaceFinance: replaceFinance,
    onReplaceStudy: replaceStudy,
    onReplaceSettings: replaceSettings,
  })

  const counts = [
    entries.length ? t("settings.counts.journal", { count: entries.length }) : null,
    gold.length ? t("settings.counts.gold", { count: gold.length }) : null,
    invests.length ? t("settings.counts.invest", { count: invests.length }) : null,
    savings.length ? t("settings.counts.savings", { count: savings.length }) : null,
    cards.length ? t("settings.counts.cards", { count: cards.length }) : null,
    tasks.some((task) => task.done) ? t("settings.counts.tasksTicked") : null,
    learned.length ? t("settings.counts.wordsLearned", { count: learned.length }) : null,
  ].filter((count): count is string => count !== null)

  function handleSaveDisplayName(name: string) {
    const { prefix } = splitGreeting(settings.profile.greeting, settings.profile.displayName)
    updateProfile({ displayName: name, greeting: prefix ? `${prefix}, ${name}` : name })
  }

  return (
    <div>
      <h1 className="mb-1 [font:var(--ob-text-h2)] tracking-[var(--ob-track-heading)]">
        {t("nav.settings")}
      </h1>
      <p className="mb-5 text-sm text-[var(--ob-color-text-subtle)]">{t("settings.subtitle")}</p>
      <div className="ob-card-grid flex flex-wrap gap-5">
        <ProfileCard displayName={settings.profile.displayName} onSave={handleSaveDisplayName} />
        <LanguageCard />
        <MoodsCard moods={settings.moods} onToggle={toggleMood} onRemove={removeMood} onAdd={addMood} />
        <ModulesCard modules={settings.modules} onToggle={toggleModule} />
        <DataCard
          exported={exported}
          imported={imported}
          syncing={syncing}
          syncResult={syncResult}
          onExport={exportData}
          onImport={importData}
          onPushToCloud={pushToCloud}
          onPullFromCloud={pullFromCloud}
        />
        <ResetCard counts={counts} onWipe={wipeData} onExport={exportData} />
      </div>
    </div>
  )
}

export { SettingsView }
