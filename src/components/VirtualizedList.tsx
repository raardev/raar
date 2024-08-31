import type React from 'react'
import { useMemo } from 'react'
import AutoSizer from 'react-virtualized-auto-sizer'
import { VariableSizeList as List } from 'react-window'

interface VirtualizedListProps<T> {
  items: T[]
  maxHeight: number
  estimatedItemHeight: number
  renderItem: (item: T, index: number) => React.ReactNode
}

export function VirtualizedList<T>({
  items,
  maxHeight,
  estimatedItemHeight,
  renderItem,
}: VirtualizedListProps<T>) {
  const itemCount = items.length
  const totalHeight = Math.min(itemCount * estimatedItemHeight, maxHeight)

  const getItemSize = useMemo(
    () => () => estimatedItemHeight,
    [estimatedItemHeight],
  )

  return (
    <div style={{ height: totalHeight }}>
      <AutoSizer>
        {({ width }) => (
          <List
            height={totalHeight}
            itemCount={itemCount}
            itemSize={getItemSize}
            width={width}
          >
            {({ index, style }) => (
              <div style={style}>{renderItem(items[index], index)}</div>
            )}
          </List>
        )}
      </AutoSizer>
    </div>
  )
}
