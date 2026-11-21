import Image from 'next/image'
import type { Room } from '@/lib/quick-quiz/progressRooms'

// One room graphic at the height of its container, its width following its
// own shape. Decoration only: empty alt text.
export default function RoomImage({ room, className = '' }: { room: Room; className?: string }) {
  return <Image src={room.file} alt="" width={room.width} height={room.height} unoptimized className={`h-full w-auto max-w-none ${className}`} />
}
