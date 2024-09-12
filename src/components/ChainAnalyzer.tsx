import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useChainAnalyzerStore } from '@/stores/chainAnalyzerStore'
import { sql } from '@codemirror/lang-sql'
import { open } from '@tauri-apps/api/dialog'
import { readDir } from '@tauri-apps/api/fs'
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
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { toast } from 'sonner'
import type { DataFrameResult, FileInfo } from '../types/chainAnalyzer'

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

  console.log('query result', queryResult)

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

  const executeQuery = async () => {
    if (!sqlQuery) {
      toast.error('Please enter a SQL query')
      return
    }

    setQueryError(null)
    setIsLoading(true)
    const startTime = performance.now()

    try {
      // Replace file names with full paths in the query
      const modifiedQuery = sqlQuery.replace(
        /'([^']+\.parquet)'/g,
        (match, fileName) => {
          const file = files.find((f) => f.name === fileName)
          return file ? `'${file.path}'` : match
        },
      )

      console.log(`Executing query: ${modifiedQuery}`)
      const result: DataFrameResult = await invoke('execute_query_command', {
        query: modifiedQuery,
      })

      if (result.schema.length === 0 && result.data.length === 0) {
        setQueryResult(null)
        setQueryError('Query returned no results.')
      } else {
        setQueryResult(result)
        setQueryTime(performance.now() - startTime)
      }
    } catch (error) {
      console.error('Query execution error:', error)
      setQueryError(`Query execution failed: ${error}`)
      setQueryResult(null)
      toast.error(`Query execution failed: ${error}`)
    } finally {
      setIsLoading(false)
    }
  }

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

  const downloadResults = () => {
    if (!queryResult) return

    const csv = [
      queryResult.schema.map(([name, _]: [string, string]) => name).join(','),
      ...queryResult.data.map((row: string[]) => row.join(',')),
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', 'query_results.csv')
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const renderTable = (data: DataFrameResult) => {
    if (!data || !data.schema || !data.data) {
      return <div>No data available</div>
    }

    return (
      <Table className="text-xs">
        <TableHeader>
          <TableRow>
            {data.schema.map(([column, type]: [string, string]) => (
              <TableHead
                key={column}
                title={type}
                className="font-semibold py-2"
              >
                {column}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.data.map((row: string[], rowIndex: number) => (
            <TableRow key={row.join('-')}>
              {row.map((cell: string, cellIndex: number) => (
                <TableCell
                  key={`${row.join('-')}-${data.schema[cellIndex][0]}`}
                  className="py-1"
                >
                  {cell}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    )
  }

  const renderChart = () => {
    if (!queryResult) return null

    const ChartComponent =
      chartType === 'bar'
        ? BarChart
        : chartType === 'line'
          ? LineChart
          : AreaChart

    const chartData = queryResult.data.map((row: string[]) => {
      const rowData: { [key: string]: string } = {}
      queryResult.schema.forEach(
        ([name, _]: [string, string], index: number) => {
          rowData[name] = row[index]
        },
      )
      return rowData
    })

    return (
      <ResponsiveContainer width="100%" height={300}>
        <ChartComponent data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey={queryResult.schema[0][0]} />
          <YAxis />
          <Tooltip />
          <Legend />
          {queryResult.schema
            .slice(1)
            .map(([column, _]: [string, string], index: number) => {
              const commonProps = {
                key: column,
                type: 'monotone' as const,
                dataKey: column,
                fill: `hsl(${index * 30}, 70%, 50%)`,
                stroke: `hsl(${index * 30}, 70%, 50%)`,
              }

              switch (chartType) {
                case 'bar':
                  return <Bar {...commonProps} />
                case 'line':
                  return <Line {...commonProps} />
                case 'area':
                  return <Area {...commonProps} />
              }
            })}
        </ChartComponent>
      </ResponsiveContainer>
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
              <div
                key={file.path}
                className={`flex items-center p-2 cursor-pointer ${
                  selectedFile === file.path
                    ? 'bg-blue-100'
                    : 'hover:bg-gray-100'
                }`}
                onClick={() => handleFileClick(file)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    handleFileClick(file)
                  }
                }}
                tabIndex={0}
                role="button"
                title={file.name}
              >
                <span className="mr-2">{getFileIcon(file.name)}</span>
                <span className="truncate text-xs">{file.name}</span>
              </div>
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
          {queryResult && (
            <div className="h-full flex flex-col">
              <Tabs defaultValue="table" className="flex-1 flex flex-col">
                <div className="px-4 border-b border-gray-200">
                  <TabsList>
                    <TabsTrigger value="table">Table</TabsTrigger>
                    <TabsTrigger value="chart">Chart</TabsTrigger>
                  </TabsList>
                </div>
                <TabsContent value="table" className="flex-1 overflow-auto p-4">
                  {renderTable(queryResult)}
                </TabsContent>
                <TabsContent value="chart" className="flex-1 overflow-auto p-4">
                  <div className="flex items-center space-x-2 text-xs mb-2">
                    <span>Chart Type:</span>
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
          {!queryResult && !queryError && (
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
