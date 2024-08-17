import type React from 'react'
import { useEffect, useState } from 'react'

interface RefreshCountdownProps {
  interval: number
  onRefresh: () => void
}

const RefreshCountdown: React.FC<RefreshCountdownProps> = ({
  interval,
  onRefresh,
}) => {
  const [timeLeft, setTimeLeft] = useState(interval / 1000)

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prevTime) => {
        if (prevTime <= 1) {
          onRefresh()
          return interval / 1000
        }
        return prevTime - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [interval, onRefresh])

  return (
    <span className="text-sm text-muted-foreground">
      Refreshing in {timeLeft} seconds
    </span>
  )
}

export default RefreshCountdown
