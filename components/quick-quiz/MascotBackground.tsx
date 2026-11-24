import Image from 'next/image'
import type { CSSProperties } from 'react'
import { COLUMN_COUNT, columnDirection, columnPictures, squaresPerLoop } from '@/lib/quick-quiz/mascotColumns'
import type { WelcomeLook } from '@/lib/quick-quiz/swatchLook'

interface Props {
  look: WelcomeLook
}

// The moving columns of mascot squares behind the welcome card
// (docs/WELCOME_MASCOTS_PLAN.md, Jaida, 2026-11-23). It fills the screen (or
// the website's iframe) behind the card. Decoration only: hidden from screen
// readers, nothing to click or Tab to.
//
// Each column's track holds one loop of squares twice, and moves by one loop
// (half the track), so the loop joins up seamlessly. The animations
// (mascot-up, mascot-down) live in app/globals.css, which also stops them
// with reduced motion.
export default function MascotBackground({ look }: Props) {
  const step = look.squareSize + look.gap
  const loop = squaresPerLoop(look.pictures.length, step)
  const timing = { '--loop': `${loop * look.secondsPerSquare}s` } as CSSProperties
  const middle = (COLUMN_COUNT - 1) / 2
  return (
    <div
      data-testid="mascot-background"
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 flex justify-center overflow-hidden"
      style={{ gap: look.gap }}
    >
      {Array.from({ length: COLUMN_COUNT }, (_, index) => {
        const direction = columnDirection(index)
        // Every other column starts half a square higher, as in the mockup.
        const shifted = Math.abs(index - middle) % 2 === 1
        const pictures = columnPictures(look.pictures, index, loop)
        return (
          <div
            key={index}
            data-direction={direction}
            className="shrink-0"
            style={{ width: look.squareSize, marginTop: shifted ? -step / 2 : undefined }}
          >
            <div className={direction === 'up' ? 'mascot-up' : 'mascot-down'} style={timing}>
              {[...pictures, ...pictures].map((file, i) => (
                <Image
                  key={i}
                  src={file}
                  alt=""
                  width={look.squareSize}
                  height={look.squareSize}
                  unoptimized
                  draggable={false}
                  className="block"
                  style={{ marginBottom: look.gap }}
                />
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
