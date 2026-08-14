"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { Field } from "@/components/ui/field";
import { Tag } from "@/components/ui/tag";
import { Figure } from "@/components/ob/figure";
import { Streak } from "@/components/ob/streak";
import { TaskItem } from "@/components/ob/task-item";
import { JournalEditor } from "@/features/journal/components/journal-editor";

export default function SandboxPage() {
  const [checked, setChecked] = useState(true);
  const [done, setDone] = useState(false);
  const [amount, setAmount] = useState("12500000");

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-[var(--ob-space-8)] p-[var(--ob-space-8)]">
      <section className="flex flex-wrap items-center gap-[var(--ob-space-3)]">
        <Button variant="primary">Primary</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="reward">Reward</Button>
        <Button variant="ghost">Ghost</Button>
        <Button variant="primary" size="sm">
          Small
        </Button>
        <Button variant="primary" size="lg">
          Large
        </Button>
        <Button variant="primary" disabled>
          Disabled
        </Button>
      </section>

      <section className="grid grid-cols-2 gap-[var(--ob-space-4)]">
        <Card tone="plain" label="Tổng quan" elevated>
          Plain card, elevated
        </Card>
        <Card tone="invert" label="Ghi chú" action={<Tag module="ghichu">Mới</Tag>}>
          Invert card
        </Card>
        <Card tone="reward">Reward card</Card>
        <Card tone="soft">Soft card</Card>
      </section>

      <section className="flex flex-wrap gap-[var(--ob-space-2)]">
        <Tag module="taichinh">Tài chính</Tag>
        <Tag module="hoctap">Học tập</Tag>
        <Tag module="ghichu">Nhật ký</Tag>
        <Tag module="tamtrang">Tâm trạng</Tag>
        <Tag module="muctieu">Mục tiêu</Tag>
        <Tag module="kehoach">Kế hoạch</Tag>
      </section>

      <section className="flex flex-col gap-[var(--ob-space-4)]">
        <Figure value="44.000.000" unit="đ" delta="12%" direction="up" caption="so với tháng trước" />
        <Figure value="3.250.000" unit="đ" delta="4%" direction="down" size="sm" />
      </section>

      <section className="flex flex-col gap-[var(--ob-space-3)]">
        <Progress value={65} tone="action" label="Quỹ dự phòng" hint="65%" />
        <Progress value={40} tone="reward" label="Chuỗi ngày" hint="40%" />
      </section>

      <section>
        <Streak days={7} done={4} icon="🔥" />
      </section>

      <section className="flex flex-col gap-[var(--ob-space-3)]">
        <Switch
          label="Ghi nhớ máy này"
          hint="Đăng nhập lâu hơn"
          checked={checked}
          onCheckedChange={(v: boolean) => setChecked(v)}
        />
        <TaskItem
          label="Ôn 20 từ vựng"
          done={done}
          onToggle={() => setDone((d) => !d)}
        />
      </section>

      <section className="flex flex-col gap-[var(--ob-space-4)] max-w-sm">
        <Field label="Email" type="email" placeholder="ban@email.com" />
        <Field
          label="Số tiền"
          numeric
          group
          suffix="đ"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
      </section>

      {/* Demo tạm cho Phase 2 của Nhật ký — dọn khi có route /journal thật */}
      <section>
        <JournalEditor
          selectedMood={null}
          onSave={(input) => console.log("journal save", input)}
        />
      </section>
    </div>
  );
}
