import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useChainAnalyzerStore } from '@/stores/chainAnalyzerStore'
import { sql } from '@codemirror/lang-sql'
import type { ColumnDef } from '@tanstack/react-table'
import { open, save } from '@tauri-apps/api/dialog'
import { readDir, writeTextFile } from '@tauri-apps/api/fs'
import { invoke } from '@tauri-apps/api/tauri'
import CodeMirror from '@uiw/react-codemirror'
import {
  Clock,
  Download,
  FileDigitIcon,
  FileIcon,
  FileJson,
  FileSpreadsheet,
  FolderOpen,
  Loader2,
  Play,
  Search,
} from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Brush,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { toast } from 'sonner'
import type { FileInfo } from '../types/chainAnalyzer'
import { VirtualizedDataTable } from './VirtualizedDataTable'

interface QueryResult {
  json: string
}

interface DataRow {
  [key: string]: string | number | boolean | null
}

interface Column {
  name: string
  datatype: string
  bit_settings: string
  values: (string | number | boolean | null)[]
}

const ChainAnalyzer: React.FC = () => {
  const {
    selectedDir,
    setSelectedDir,
    files,
    setFiles,
    selectedFile,
    setSelectedFile,
    sqlQuery,
    setSqlQuery,
    queryResult,
    setQueryResult,
    queryTime,
    setQueryTime,
    queryError,
    setQueryError,
    chartType,
    setChartType,
  } = useChainAnalyzerStore()
  const [searchTerm, setSearchTerm] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [xAxis, setXAxis] = useState<string>('')
  const [yAxis, setYAxis] = useState<string>('')
  const [showBrush, setShowBrush] = useState(false)
  const [showReferenceLine, setShowReferenceLine] = useState(false)
  const [referenceLineValue, setReferenceLineValue] = useState('')
  const [data, setData] = useState<DataRow[]>([])
  const [columns, setColumns] = useState<string[]>([])
  const [tableColumns, setTableColumns] = useState<
    ColumnDef<DataRow, unknown>[]
  >([])

  const selectDirectory = async () => {
    const selected = await open({
      directory: true,
      multiple: false,
    })
    if (selected && typeof selected === 'string') {
      setSelectedDir(selected)
    }
  }

  const loadFiles = useCallback(async () => {
    if (selectedDir) {
      const entries = await readDir(selectedDir)
      const fileInfos = entries
        .filter((entry) => entry.name?.match(/\.(parquet|csv|json)$/))
        .map((entry) => ({
          name: entry.name || '',
          path: entry.path,
        }))
      setFiles(fileInfos)
    }
  }, [selectedDir, setFiles])

  useEffect(() => {
    loadFiles()
  }, [loadFiles])

  const executeQuery = useCallback(async () => {
    if (!sqlQuery) {
      toast.error('Please enter a SQL query')
      return
    }

    setQueryError(null)
    setIsLoading(true)
    const startTime = performance.now()

    try {
      const modifiedQuery = sqlQuery.replace(
        /'([^']+\.parquet)'/g,
        (match, fileName) => {
          const file = files.find((f) => f.name === fileName)
          return file ? `'${file.path}'` : match
        },
      )

      console.log(`Executing query: ${modifiedQuery}`)
      const result: QueryResult = await invoke('execute_query_command', {
        query: modifiedQuery,
      })

      const parsedData = JSON.parse(result.json)
      console.log('Parsed data:', parsedData)

      if (parsedData.columns && parsedData.columns.length > 0) {
        const columns = parsedData.columns.map((col: Column) => col.name)
        const data = parsedData.columns[0].values.map(
          (_: unknown, index: number) => {
            const row: { [key: string]: unknown } = {}
            for (const col of parsedData.columns) {
              row[col.name] =
                col.values[index] && typeof col.values[index] === 'object'
                  ? Object.values(col.values[index])[0]
                  : col.values[index]
            }
            return row
          },
        )

        setColumns(columns)
        setData(data)
        setTableColumns(
          columns.map((col: string) => ({
            accessorKey: col,
            header: col,
            cell: (info) => {
              const value = info.getValue()
              // 对于二进制数据（地址），保持原样显示
              return typeof value === 'string' && value.startsWith('0x')
                ? value
                : JSON.stringify(value)
            },
          })),
        )
        setQueryTime(performance.now() - startTime)
      } else {
        setData([])
        setColumns([])
        setTableColumns([])
        setQueryError('Query returned no results.')
      }
    } catch (error) {
      console.error('Query execution error:', error)
      setQueryError(`Query execution failed: ${error}`)
      setData([])
      setColumns([])
      setTableColumns([])
      toast.error(`Query execution failed: ${error}`)
    } finally {
      setIsLoading(false)
    }
  }, [sqlQuery, files, setQueryError, setQueryTime])

  const previewFile = async (filePath: string) => {
    try {
      console.log(`Previewing file: ${filePath}`)
      const fileName = filePath.split('/').pop() || ''
      const query = `SELECT * FROM read_parquet('${fileName}') LIMIT 10`
      setSqlQuery(query)
      await executeQuery()
    } catch (error) {
      console.error('Preview error:', error)
      toast.error(`Failed to preview file: ${error}`)
      setQueryResult(null)
    }
  }

  const downloadResults = async () => {
    if (!queryResult) return

    const csv = [
      queryResult.schema.map(([name, _]: [string, string]) => name).join(','),
      ...queryResult.data.map((row: string[]) => row.join(',')),
    ].join('\n')

    try {
      const filePath = await save({
        filters: [
          {
            name: 'CSV',
            extensions: ['csv'],
          },
        ],
      })

      if (filePath) {
        await writeTextFile(filePath, csv)
        toast.success('Results saved successfully')
      }
    } catch (error) {
      console.error('Error saving file:', error)
      toast.error('Failed to save results')
    }
  }

  useEffect(() => {
    if (data && data.length > 0) {
      setXAxis(columns[0])
      setYAxis(columns[1] || columns[0])
    }
  }, [data, columns])

  const renderChart = () => {
    if (!data || !xAxis || !yAxis) return null

    const ChartComponent =
      chartType === 'bar'
        ? BarChart
        : chartType === 'line'
          ? LineChart
          : AreaChart

    return (
      <>
        <div className="flex items-center space-x-4 mb-4">
          <div className="flex items-center space-x-2">
            <Label htmlFor="x-axis">X Axis:</Label>
            <Select value={xAxis} onValueChange={setXAxis}>
              <SelectTrigger id="x-axis" className="w-[180px]">
                <SelectValue placeholder="Select X Axis" />
              </SelectTrigger>
              <SelectContent>
                {columns.map((column) => (
                  <SelectItem key={column} value={column}>
                    {column}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center space-x-2">
            <Label htmlFor="y-axis">Y Axis:</Label>
            <Select value={yAxis} onValueChange={setYAxis}>
              <SelectTrigger id="y-axis" className="w-[180px]">
                <SelectValue placeholder="Select Y Axis" />
              </SelectTrigger>
              <SelectContent>
                {columns.map((column) => (
                  <SelectItem key={column} value={column}>
                    {column}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex items-center space-x-4 mb-4">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="show-brush"
              checked={showBrush}
              onChange={(e) => setShowBrush(e.target.checked)}
            />
            <Label htmlFor="show-brush">Show Brush</Label>
          </div>
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="show-reference-line"
              checked={showReferenceLine}
              onChange={(e) => setShowReferenceLine(e.target.checked)}
            />
            <Label htmlFor="show-reference-line">Show Reference Line</Label>
          </div>
          {showReferenceLine && (
            <Input
              type="number"
              placeholder="Reference Line Value"
              value={referenceLineValue}
              onChange={(e) => setReferenceLineValue(e.target.value)}
              className="w-32"
            />
          )}
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <ChartComponent data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={xAxis} />
            <YAxis dataKey={yAxis} />
            <Tooltip />
            <Legend />
            {chartType === 'bar' && <Bar dataKey={yAxis} fill="#8884d8" />}
            {chartType === 'line' && (
              <Line type="monotone" dataKey={yAxis} stroke="#8884d8" />
            )}
            {chartType === 'area' && (
              <Area type="monotone" dataKey={yAxis} fill="#8884d8" />
            )}
            {showBrush && (
              <Brush dataKey={xAxis} height={30} stroke="#8884d8" />
            )}
            {showReferenceLine && (
              <ReferenceLine
                y={Number.parseFloat(referenceLineValue)}
                stroke="red"
              />
            )}
          </ChartComponent>
        </ResponsiveContainer>
      </>
    )
  }

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase()
    switch (extension) {
      case 'parquet':
        return <FileDigitIcon size={16} />
      case 'csv':
        return <FileSpreadsheet size={16} />
      case 'json':
        return <FileJson size={16} />
      default:
        return <FileIcon size={16} />
    }
  }

  const handleFileClick = async (file: FileInfo) => {
    setSelectedFile(file.path)
    await previewFile(file.path)
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <div className="w-64 border-r border-gray-200 flex flex-col px-3">
        <div className="py-4 border-b border-gray-200">
          <div className="relative mb-2">
            <Search
              className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400"
              size={16}
            />
            <Input
              className="pl-8 pr-10 w-full"
              placeholder="Search files..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Button
              onClick={selectDirectory}
              className="absolute right-1 top-1/2 transform -translate-y-1/2 p-1"
              variant="ghost"
            >
              <FolderOpen className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="flex-1 overflow-auto">
          {files
            .filter((file) =>
              file.name.toLowerCase().includes(searchTerm.toLowerCase()),
            )
            .map((file: FileInfo) => (
              <button
                type="button"
                key={file.path}
                className={`flex items-center p-2 w-full text-left ${
                  selectedFile === file.path
                    ? 'bg-blue-100'
                    : 'hover:bg-gray-100'
                }`}
                onClick={() => handleFileClick(file)}
                title={file.name}
              >
                <span className="mr-2">{getFileIcon(file.name)}</span>
                <span className="truncate text-xs">{file.name}</span>
              </button>
            ))}
        </div>
      </div>
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="border-b border-gray-200 p-4">
          <CodeMirror
            value={sqlQuery}
            height="150px"
            extensions={[sql()]}
            onChange={(value) => setSqlQuery(value)}
          />
          <div className="flex justify-between items-center mt-2">
            <Button
              onClick={executeQuery}
              className="text-xs"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  <Play className="mr-2 h-3 w-3" />
                  Execute Query
                </>
              )}
            </Button>
            <div className="flex items-center text-xs">
              {queryResult && (
                <Button onClick={downloadResults} size="icon" variant="ghost">
                  <Download className="h-4 w-4" />
                </Button>
              )}
              {queryTime !== null && (
                <span className="flex items-center">
                  <Clock className="mr-2 h-4 w-4" />
                  {queryTime.toFixed(2)}ms
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex-1 overflow-hidden">
          {queryError && (
            <div className="text-red-500 p-2 border border-red-300 rounded bg-red-50 text-xs m-4">
              {queryError}
            </div>
          )}
          {data.length > 0 && columns.length > 0 && (
            <div className="h-full flex flex-col">
              <Tabs defaultValue="table" className="flex-1 flex flex-col">
                <div className="px-4 border-b border-gray-200">
                  <TabsList>
                    <TabsTrigger value="table">Table</TabsTrigger>
                    <TabsTrigger value="chart">Chart</TabsTrigger>
                  </TabsList>
                </div>
                <TabsContent value="table" className="flex-1 overflow-auto p-4">
                  <VirtualizedDataTable columns={tableColumns} data={data} />
                </TabsContent>
                <TabsContent value="chart" className="flex-1 overflow-auto p-4">
                  <div className="flex items-center space-x-2 text-xs mb-2">
                    <Select
                      value={chartType}
                      onValueChange={(value) =>
                        setChartType(value as 'bar' | 'line' | 'area')
                      }
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Select a chart type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="bar">Bar Chart</SelectItem>
                        <SelectItem value="line">Line Chart</SelectItem>
                        <SelectItem value="area">Area Chart</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="h-[300px]">{renderChart()}</div>
                </TabsContent>
              </Tabs>
            </div>
          )}
          {data.length === 0 && !queryError && (
            <div className="text-center text-gray-500 mt-8">
              No query results to display. Select a file or execute a query.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ChainAnalyzer
