import { getGoals } from "../get-goals"
import { MOCK_GOALS_DATA } from "../mock-data"
import { GoalCard } from "./goal-card"
import { OverallProgressCard } from "./overall-progress-card"

function GoalsView() {
  const { goals, avg } = getGoals(MOCK_GOALS_DATA)

  return (
    <div>
      <h1 className="mb-1 [font:var(--ob-text-h2)] tracking-[var(--ob-track-heading)]">Mục tiêu</h1>
      <p className="mb-5 text-sm text-[var(--ob-color-text-subtle)]">
        {goals.length} mục tiêu đang chạy · hoàn thành trung bình {avg}%
      </p>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-5">
        <OverallProgressCard goals={goals} avg={avg} />
        {goals.map((goal) => (
          <GoalCard key={goal.key} goal={goal} />
        ))}
      </div>
    </div>
  )
}

export { GoalsView }
