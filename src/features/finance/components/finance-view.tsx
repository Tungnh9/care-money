"use client"

import { useState } from "react"

import { Tabs } from "@/components/ob/tabs"
import { NetWorthCard } from "@/components/ob/net-worth-card"
import { useMoneyVisibility } from "@/components/money-visibility-provider"
import { longDate } from "@/lib/date"
import { formatMoney } from "@/lib/format"
import { pct1, summarizeFinance } from "../finance-calculations"
import { useFinance } from "../hooks/use-finance"
import { CreditCardsTab } from "./credit-cards-tab"
import { GoldTab } from "./gold-tab"
import { InvestmentsTab } from "./investments-tab"
import { PillarCard } from "./pillar-card"
import { SavingsTab } from "./savings-tab"

const TABS = ["Tiết kiệm", "Nợ thẻ tín dụng", "Tích lũy vàng", "Đầu tư"]

function FinanceView() {
  const { hidden } = useMoneyVisibility()
  const [tab, setTab] = useState(TABS[0])
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
        Tài chính
      </h1>
      <p className="mb-5 text-sm text-[var(--ob-color-text-subtle)]">
        Tài sản ròng {formatMoney(summary.net, hidden)} · cập nhật {longDate()}
      </p>

      <div className="ob-card-grid mb-6 flex flex-wrap gap-4">
        <NetWorthCard summary={summary} />
        <PillarCard
          icon="pig"
          label="Tiết kiệm"
          amount={summary.savingsTotal}
          tone="income"
          hint={savings.length ? `${savings.length} quỹ đang chạy` : "Chưa có quỹ nào"}
          className="min-w-0 flex-[1_1_260px]"
        />
        <PillarCard
          icon="card"
          label="Nợ thẻ tín dụng"
          amount={summary.debtTotal}
          tone="expense"
          hint={
            cards.length ? `${cards.length} thẻ · hạn gần nhất ${cards[0].due}` : "Chưa có thẻ nào"
          }
          className="min-w-0 flex-[1_1_260px]"
        />
        <PillarCard
          icon="gold"
          label="Tích lũy vàng"
          amount={summary.goldValue}
          tone={summary.goldPL >= 0 ? "income" : "expense"}
          hint={`${summary.goldPhan} phân · ${pct1(summary.goldPct)}`}
          className="min-w-0 flex-[1_1_260px]"
        />
        <PillarCard
          icon="chart"
          label="Đầu tư"
          amount={summary.investValue}
          tone={invests.length ? (summary.investPL >= 0 ? "income" : "expense") : undefined}
          hint={
            invests.length ? `${invests.length} khoản · ${pct1(summary.investPct)}` : "Chưa có khoản nào"
          }
          className="min-w-0 flex-[1_1_260px]"
        />
      </div>

      <Tabs tabs={TABS} active={tab} onChange={setTab} />

      <div className="ob-card-grid">
        {tab === "Tiết kiệm" ? (
          <SavingsTab
            savings={savings}
            onAddSavingsFund={addSavingsFund}
            onUpdateSavingsFund={updateSavingsFund}
            onRemoveSavingsFund={removeSavingsFund}
          />
        ) : tab === "Nợ thẻ tín dụng" ? (
          <CreditCardsTab
            cards={cards}
            onAddCard={addCard}
            onPayCard={payCard}
            onUpdateCard={updateCard}
            onRemoveCard={removeCard}
          />
        ) : tab === "Tích lũy vàng" ? (
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
