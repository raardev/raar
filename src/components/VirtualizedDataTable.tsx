import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { useVirtualizer } from '@tanstack/react-virtual'
import * as React from 'react'
import { formatBinaryData } from '../utils/formatters'

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  className?: string
}

const MAX_CELL_LENGTH = 50

export function VirtualizedDataTable<TData, TValue>({
  columns,
  data,
  className,
}: DataTableProps<TData, TValue>) {
  const [editingCell, setEditingCell] = React.useState<{
    rowIndex: number
    columnId: string
  } | null>(null)

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  const { rows } = table.getRowModel()

  const parentRef = React.useRef<HTMLDivElement>(null)

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: React.useCallback(() => 35, []),
    overscan: 20,
  })

  const virtualRows = virtualizer.getVirtualItems()

  const paddingTop = virtualRows.length > 0 ? virtualRows[0].start || 0 : 0
  const paddingBottom =
    virtualRows.length > 0
      ? virtualizer.getTotalSize() -
        (virtualRows[virtualRows.length - 1].end || 0)
      : 0

  const truncateText = (text: string | number | null | undefined) => {
    if (text == null) return ''
    const stringText = String(text)
    if (typeof text === 'string' && text.startsWith('0x')) {
      return formatBinaryData(text)
    }
    if (stringText.length <= MAX_CELL_LENGTH) return stringText
    return `${stringText.slice(0, MAX_CELL_LENGTH)}...`
  }

  const handleCellClick = (rowIndex: number, columnId: string) => {
    setEditingCell({ rowIndex, columnId })
  }

  const handleInputBlur = () => {
    setEditingCell(null)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      setEditingCell(null)
    }
  }

  return (
    <div
      ref={parentRef}
      className={`overflow-auto h-full ${className}`}
      style={{ maxHeight: 'calc(100vh - 300px)' }}
    >
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id}>
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      )}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {paddingTop > 0 && (
            <TableRow>
              <TableCell style={{ height: `${paddingTop}px` }} />
            </TableRow>
          )}
          {virtualRows.map((virtualRow) => {
            const row = rows[virtualRow.index]
            return (
              <TableRow
                key={row.id}
                data-state={row.getIsSelected() && 'selected'}
              >
                {row.getVisibleCells().map((cell) => {
                  const isEditing =
                    editingCell?.rowIndex === virtualRow.index &&
                    editingCell?.columnId === cell.column.id
                  return (
                    <TableCell
                      key={cell.id}
                      onClick={() =>
                        handleCellClick(virtualRow.index, cell.column.id)
                      }
                    >
                      {isEditing ? (
                        <Input
                          defaultValue={String(cell.getValue())}
                          onBlur={handleInputBlur}
                          onKeyDown={handleKeyDown}
                          autoFocus
                        />
                      ) : (
                        <div className="overflow-hidden text-ellipsis whitespace-nowrap">
                          {truncateText(
                            cell.getValue() as
                              | string
                              | number
                              | null
                              | undefined,
                          )}
                        </div>
                      )}
                    </TableCell>
                  )
                })}
              </TableRow>
            )
          })}
          {paddingBottom > 0 && (
            <TableRow>
              <TableCell style={{ height: `${paddingBottom}px` }} />
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}
