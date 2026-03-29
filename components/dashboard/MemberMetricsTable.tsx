import UserAvatar from '@/components/user/UserAvatar'

interface MemberMetric {
  id: string
  name: string
  cargo?: string | null
  avatarUrl?: string | null
  horasTotais: number
  custoTotal: number
  cardsTotal: number
  cardsConcluidos: number
  cardsAtrasados: number
}

interface Props {
  members: MemberMetric[]
}

function formatHours(h: number) {
  if (h < 1) return `${Math.round(h * 60)}min`
  return `${h.toFixed(1)}h`
}

export default function MemberMetricsTable({ members }: Props) {
  const sorted = [...members].sort((a, b) => b.cardsConcluidos - a.cardsConcluidos)

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100">
            <th className="text-left font-medium text-gray-500 pb-2 pr-4">Membro</th>
            <th className="text-right font-medium text-gray-500 pb-2 px-3">Cards</th>
            <th className="text-right font-medium text-gray-500 pb-2 px-3">Concluídos</th>
            <th className="text-right font-medium text-gray-500 pb-2 px-3">Atrasados</th>
            <th className="text-right font-medium text-gray-500 pb-2 pl-3">Horas</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((m, i) => (
            <tr key={m.id} className="border-b border-gray-50 last:border-0">
              <td className="py-3 pr-4">
                <div className="flex items-center gap-2.5">
                  <span className="text-xs font-mono text-gray-300 w-4">{i + 1}</span>
                  <UserAvatar name={m.name} avatarUrl={m.avatarUrl} size="sm" />
                  <div>
                    <p className="font-medium text-gray-900 leading-tight">{m.name}</p>
                    {m.cargo && <p className="text-xs text-gray-400">{m.cargo}</p>}
                  </div>
                </div>
              </td>
              <td className="py-3 text-right text-gray-600 px-3">{m.cardsTotal}</td>
              <td className="py-3 text-right px-3">
                <span className="text-green-600 font-medium">{m.cardsConcluidos}</span>
                {m.cardsTotal > 0 && (
                  <span className="text-gray-400 text-xs ml-1">
                    ({Math.round((m.cardsConcluidos / m.cardsTotal) * 100)}%)
                  </span>
                )}
              </td>
              <td className="py-3 text-right px-3">
                {m.cardsAtrasados > 0 ? (
                  <span className="text-red-500 font-medium">{m.cardsAtrasados}</span>
                ) : (
                  <span className="text-gray-300">—</span>
                )}
              </td>
              <td className="py-3 text-right text-gray-600 pl-3">{formatHours(m.horasTotais)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
