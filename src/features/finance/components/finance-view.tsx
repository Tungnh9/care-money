"use client"

import { useState } from "react"

import { Tabs } from "@/components/ob/tabs"
import { NetWorthCard } from "@/components/ob/net-worth-card"
import { useMoneyVisibility } from "@/components/money-visibility-provider"
import { longDate } from "@/lib/date"
import { formatMoney } from "@/lib/format"
import { formatLuong, formatPhan, nearestDueCard, pct1, summarizeFinance } from "@/lib/finance/finance-calculations"
import { metalPLTone } from "@/lib/finance/metal-calculations"
import { useFinance } from "@/lib/finance/use-finance"
import { CreditCardsTab } from "./credit-cards-tab"
import { GoldTab } from "./gold-tab"
import { InvestmentsTab } from "./investments-tab"
import { PillarCard } from "./pillar-card"
import { SavingsTab } from "./savings-tab"
import { SilverTab } from "./silver-tab"

const TABS = ["Tiết kiệm", "Nợ thẻ tín dụng", "Tích lũy vàng", "Tích lũy bạc", "Đầu tư"]

// 5 trụ dưới thẻ Tài sản ròng, đo theo bề rộng của chính hàng trụ (@container): đủ chỗ cho 5 trụ
// 260px (5×260 + 4 khe 16px = 1364px) thì xếp 1 hàng; hẹp hơn thì mỗi hàng tối đa 3 trụ (3+2), không
// để 1 trụ nằm một mình kéo dài hết hàng (4+1). Trụ không hẹp hơn 260px — số tiền dài sẽ tràn.
const PILLAR_CLASS = "min-w-[260px] flex-[1_1_calc((100%_-_2rem)/3)] @min-[1364px]:flex-[1_1_0%]"

// Số tiền trên trụ vàng/bạc/đầu tư tô theo lãi/lỗ, cùng quy tắc làm tròn với dấu % ngay dưới (metalPLTone):
// hoà vốn — kể cả chưa mua gì — để màu thường, không tô "0 ₫" màu xanh như báo lãi.
const PL_PILLAR_TONE = { gain: "income", loss: "expense", even: undefined } as const

function FinanceView() {
  const { hidden } = useMoneyVisibility()
  const [tab, setTab] = useState(TABS[0])
  const {
    savings,
    cards,
    gold,
    goldStores,
    goldGifts,
    goldSales,
    silver,
    silverStores,
    silverGifts,
    silverSales,
    invests,
    addSavingsFund,
    updateSavingsFund,
    removeSavingsFund,
    addCard,
    updateCard,
    removeCard,
    payCard,
    addGoldStore,
    updateGoldStore,
    removeGoldStore,
    setGoldStorePrice,
    addGold,
    updateGold,
    removeGold,
    addGoldGift,
    updateGoldGift,
    removeGoldGift,
    addSilverStore,
    updateSilverStore,
    removeSilverStore,
    setSilverStorePrice,
    addSilver,
    updateSilver,
    removeSilver,
    addSilverGift,
    updateSilverGift,
    removeSilverGift,
    addInvest,
    updateInvest,
    removeInvest,
  } = useFinance()

  const summary = summarizeFinance({
    savings,
    cards,
    gold,
    goldStores,
    goldGifts,
    goldSales,
    silver,
    silverStores,
    silverGifts,
    silverSales,
    invests,
  })
  const goldTone = metalPLTone(summary.goldPL)
  const silverTone = metalPLTone(summary.silverPL)
  const investTone = metalPLTone(summary.investPL)
  // "Hạn gần nhất" = thẻ còn nợ đến hạn sớm nhất tính từ hôm nay, không phải thẻ thêm đầu tiên.
  const nearestCard = nearestDueCard(cards, new Date())

  return (
    <div>
      <h1 className="mb-1 [font:var(--ob-text-h2)] tracking-[var(--ob-track-heading)]">Tài chính</h1>
      <p className="mb-5 text-sm text-[var(--ob-color-text-subtle)]">
        Tài sản ròng {formatMoney(summary.net, hidden)} · cập nhật {longDate()}
      </p>

      <div className="ob-card-grid @container mb-6 flex flex-wrap gap-4">
        <NetWorthCard summary={summary} />
        <PillarCard
          icon="pig"
          label="Tiết kiệm"
          amount={summary.savingsTotal}
          tone="income"
          hint={savings.length ? `${savings.length} quỹ đang chạy` : "Chưa có quỹ nào"}
          className={PILLAR_CLASS}
        />
        <PillarCard
          icon="card"
          label="Nợ thẻ tín dụng"
          amount={summary.debtTotal}
          tone="expense"
          hint={
            cards.length
              ? nearestCard
                ? `${cards.length} thẻ · hạn gần nhất ${nearestCard.due}`
                : `${cards.length} thẻ · không nợ`
              : "Chưa có thẻ nào"
          }
          className={PILLAR_CLASS}
        />
        <PillarCard
          icon="gold"
          label="Tích lũy vàng"
          amount={summary.goldValue}
          tone={PL_PILLAR_TONE[goldTone]}
          hint={`${formatPhan(summary.goldPhan)} phân`}
          delta={{ text: pct1(summary.goldPct), tone: goldTone }}
          className={PILLAR_CLASS}
        />
        <PillarCard
          icon="silver"
          label="Tích lũy bạc"
          amount={summary.silverValue}
          tone={PL_PILLAR_TONE[silverTone]}
          hint={`${formatLuong(summary.silverLuong)} lượng`}
          delta={{ text: pct1(summary.silverPct), tone: silverTone }}
          className={PILLAR_CLASS}
        />
        <PillarCard
          icon="chart"
          label="Đầu tư"
          amount={summary.investValue}
          tone={PL_PILLAR_TONE[investTone]}
          hint={invests.length ? `${invests.length} khoản` : "Chưa có khoản nào"}
          delta={invests.length ? { text: pct1(summary.investPct), tone: investTone } : undefined}
          className={PILLAR_CLASS}
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
            stores={goldStores}
            onAddGoldStore={addGoldStore}
            onUpdateGoldStore={updateGoldStore}
            onRemoveGoldStore={removeGoldStore}
            onSetGoldStorePrice={setGoldStorePrice}
            gold={gold}
            onAddGold={addGold}
            onUpdateGold={updateGold}
            onRemoveGold={removeGold}
            goldGifts={goldGifts}
            onAddGoldGift={addGoldGift}
            onUpdateGoldGift={updateGoldGift}
            onRemoveGoldGift={removeGoldGift}
          />
        ) : tab === "Tích lũy bạc" ? (
          <SilverTab
            summary={summary}
            stores={silverStores}
            onAddSilverStore={addSilverStore}
            onUpdateSilverStore={updateSilverStore}
            onRemoveSilverStore={removeSilverStore}
            onSetSilverStorePrice={setSilverStorePrice}
            silver={silver}
            onAddSilver={addSilver}
            onUpdateSilver={updateSilver}
            onRemoveSilver={removeSilver}
            silverGifts={silverGifts}
            onAddSilverGift={addSilverGift}
            onUpdateSilverGift={updateSilverGift}
            onRemoveSilverGift={removeSilverGift}
          />
        ) : (
          <InvestmentsTab
            invests={invests}
            summary={summary}
            onAddInvest={addInvest}
            onUpdateInvest={updateInvest}
            onRemoveInvest={removeInvest}
          />
        )}
      </div>
    </div>
  )
}

export { FinanceView }
