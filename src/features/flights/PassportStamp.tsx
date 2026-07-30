import { Plane } from 'lucide-react'
import type { Flight } from '../../types/database'

const stampRotations = [-7, 5, -4, 8, -9, 3, 6, -5, 4, -6]
const stampColors = ['text-blush-700', 'text-plum-600', 'text-lavender-400']

export function PassportStamp({ flight, index }: { flight: Flight; index: number }) {
  const rotation = stampRotations[index % stampRotations.length]
  const color = stampColors[index % stampColors.length]

  return (
    <div
      className={`relative flex h-28 w-28 shrink-0 flex-col items-center justify-center rounded-full border-[3px] border-double p-2 text-center ${color} border-current opacity-90`}
      style={{ transform: `rotate(${rotation}deg)`, fontFamily: "'Special Elite', monospace" }}
    >
      <div className="absolute inset-[5px] rounded-full border border-current opacity-60" />
      <p className="text-[11px] font-bold uppercase leading-tight tracking-wide">{flight.from_airport}</p>
      <Plane size={12} strokeWidth={2} className="my-0.5 rotate-45" />
      <p className="text-[11px] font-bold uppercase leading-tight tracking-wide">{flight.to_airport}</p>
      {flight.date && <p className="mt-0.5 text-[7px] uppercase leading-none opacity-80">{flight.date}</p>}
    </div>
  )
}
