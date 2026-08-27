"use client"

import { useState } from "react"

import { Tabs } from "@/components/ob/tabs"
import { NetWorthCard } from "@/components/ob/net-worth-card"
import { useMoneyVisibility } from "@/components/money-visibility-provider"
import { useT, useLocale } from "@/components/locale-provider"
import { longDate } from "@/lib/date"
import { formatMoney } from "@/lib/format"
import { pct1, summarizeFinance } from "../finance-calculations"
import { useFinance } from "../hooks/use-finance"
import { CreditCardsTab } from "./credit-cards-tab"
import { GoldTab } from "./gold-tab"
import { InvestmentsTab } from "./investments-tab"
import { PillarCard } from "./pillar-card"
import { SavingsTab } from "./savings-tab"

const TAB_KEYS = ["savings", "debt", "gold", "invest"] as const
type TabKey = (typeof TAB_KEYS)[number]

function FinanceView() {
  const t = useT()
  const { locale } = useLocale()
  const { hidden } = useMoneyVisibility()
  const [tabKey, setTabKey] = useState<TabKey>("savings")
  const tabLabel: Record<TabKey, string> = {
    savings: t("finance.tabs.savings"),
    debt: t("finance.tabs.debt"),
    gold: t("finance.tabs.gold"),
    invest: t("finance.tabs.invest"),
  }
  const {
    savings,
    cards,
    gold,
    goldPrice,
    invests,
    addSavingsFund,
    updateSavingsFund,
    removeSavingsFund,
    addCard,
    updateCard,
    removeCard,
    payCard,
    setGoldPrice,
    addGold,
    updateGold,
    removeGold,
    addInvest,
  } = useFinance()

  const summary = summarizeFinance({ savings, cards, gold, goldPrice, invests })

  return (
    <div>
      <h1 className="mb-1 [font:var(--ob-text-h2)] tracking-[var(--ob-track-heading)]">
        {t("nav.finance")}
      </h1>
      <p className="mb-5 text-sm text-[var(--ob-color-text-subtle)]">
        {t("finance.netWorthUpdated", {
          amount: formatMoney(summary.net, hidden, locale),
          date: longDate(new Date(), locale),
        })}
      </p>

      <div className="ob-card-grid mb-6 flex flex-wrap gap-4">
        <NetWorthCard summary={summary} />
        <PillarCard
          icon="pig"
          label={t("finance.tabs.savings")}
          amount={summary.savingsTotal}
          tone="income"
          hint={
            savings.length
              ? t("finance.savingsHint", { count: savings.length })
              : t("finance.noSavingsPillar")
          }
          className="min-w-0 flex-[1_1_260px]"
        />
        <PillarCard
          icon="card"
          label={t("finance.tabs.debt")}
          amount={summary.debtTotal}
          tone="expense"
          hint={
            cards.length
              ? t("finance.debtHint", { count: cards.length, date: cards[0].due })
              : t("finance.noDebtPillar")
          }
          className="min-w-0 flex-[1_1_260px]"
        />
        <PillarCard
          icon="gold"
          label={t("finance.tabs.gold")}
          amount={summary.goldValue}
          tone={summary.goldPL >= 0 ? "income" : "expense"}
          hint={t("finance.goldPillarHint", {
            count: summary.goldPhan,
            pct: pct1(summary.goldPct, locale),
          })}
          className="min-w-0 flex-[1_1_260px]"
        />
        <PillarCard
          icon="chart"
          label={t("finance.tabs.invest")}
          amount={summary.investValue}
          tone={invests.length ? (summary.investPL >= 0 ? "income" : "expense") : undefined}
          hint={
            invests.length
              ? t("finance.investHint", { count: invests.length, pct: pct1(summary.investPct, locale) })
              : t("finance.noInvestPillar")
          }
          className="min-w-0 flex-[1_1_260px]"
        />
      </div>

      <Tabs
        tabs={TAB_KEYS.map((key) => tabLabel[key])}
        active={tabLabel[tabKey]}
        onChange={(label) => {
          const nextKey = TAB_KEYS.find((key) => tabLabel[key] === label)
          if (nextKey) setTabKey(nextKey)
        }}
      />

      <div className="ob-card-grid">
        {tabKey === "savings" ? (
          <SavingsTab
            savings={savings}
            onAddSavingsFund={addSavingsFund}
            onUpdateSavingsFund={updateSavingsFund}
            onRemoveSavingsFund={removeSavingsFund}
          />
        ) : tabKey === "debt" ? (
          <CreditCardsTab
            cards={cards}
            onAddCard={addCard}
            onPayCard={payCard}
            onUpdateCard={updateCard}
            onRemoveCard={removeCard}
          />
        ) : tabKey === "gold" ? (
          <GoldTab
            summary={summary}
            goldPrice={goldPrice}
            onSetGoldPrice={setGoldPrice}
            gold={gold}
            onAddGold={addGold}
            onUpdateGold={updateGold}
            onRemoveGold={removeGold}
          />
        ) : (
          <InvestmentsTab invests={invests} onAddInvest={addInvest} />
        )}
      </div>
    </div>
  )
}

export { FinanceView }
