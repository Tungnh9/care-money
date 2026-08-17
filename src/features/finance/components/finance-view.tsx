"use client"

import { useState } from "react"

import { Tabs } from "@/components/ob/tabs"
import { longDate } from "@/lib/date"
import { formatMoney } from "@/lib/format"
import { pct1, summarizeFinance } from "../finance-calculations"
import { useFinance } from "../hooks/use-finance"
import { CreditCardsTab } from "./credit-cards-tab"
import { GoldTab } from "./gold-tab"
import { InvestmentsTab } from "./investments-tab"
import { NetWorthCard } from "./net-worth-card"
import { PillarCard } from "./pillar-card"
import { SavingsTab } from "./savings-tab"

const TABS = ["Tiết kiệm", "Nợ thẻ tín dụng", "Tích lũy vàng", "Đầu tư"]

function FinanceView() {
  const [tab, setTab] = useState(TABS[0])
  const {
    savings,
    cards,
    gold,
    goldPrice,
    invests,
    addSavingsFund,
    addCard,
    payCard,
    setGoldPrice,
    addGold,
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
        Tài sản ròng {formatMoney(summary.net)} · cập nhật {longDate()}
      </p>

      <div className="mb-6 grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-4">
        <NetWorthCard summary={summary} />
        <PillarCard
          icon="pig"
          label="Tiết kiệm"
          amount={summary.savingsTotal}
          tone="income"
          hint={savings.length ? `${savings.length} quỹ đang chạy` : "Chưa có quỹ nào"}
        />
        <PillarCard
          icon="card"
          label="Nợ thẻ tín dụng"
          amount={summary.debtTotal}
          tone="expense"
          hint={
            cards.length ? `${cards.length} thẻ · hạn gần nhất ${cards[0].due}` : "Chưa có thẻ nào"
          }
        />
        <PillarCard
          icon="gold"
          label="Tích lũy vàng"
          amount={summary.goldValue}
          tone={summary.goldPL >= 0 ? "income" : "expense"}
          hint={`${summary.goldPhan} phân · ${pct1(summary.goldPct)}`}
        />
        <PillarCard
          icon="chart"
          label="Đầu tư"
          amount={summary.investValue}
          tone={invests.length ? (summary.investPL >= 0 ? "income" : "expense") : undefined}
          hint={
            invests.length ? `${invests.length} khoản · ${pct1(summary.investPct)}` : "Chưa có khoản nào"
          }
        />
      </div>

      <Tabs tabs={TABS} active={tab} onChange={setTab} />

      {tab === "Tiết kiệm" ? (
        <SavingsTab savings={savings} onAddSavingsFund={addSavingsFund} />
      ) : tab === "Nợ thẻ tín dụng" ? (
        <CreditCardsTab cards={cards} onAddCard={addCard} onPayCard={payCard} />
      ) : tab === "Tích lũy vàng" ? (
        <GoldTab
          summary={summary}
          goldPrice={goldPrice}
          onSetGoldPrice={setGoldPrice}
          gold={gold}
          onAddGold={addGold}
          onRemoveGold={removeGold}
        />
      ) : (
        <InvestmentsTab invests={invests} onAddInvest={addInvest} />
      )}
    </div>
  )
}

export { FinanceView }
