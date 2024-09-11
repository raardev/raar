import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Tooltip as UITooltip } from '@/components/ui/tooltip'
import { useChainAnalyzerStore } from '@/stores/chainAnalyzerStore'
import { sql } from '@codemirror/lang-sql'
import { open } from '@tauri-apps/api/dialog'
import { readDir } from '@tauri-apps/api/fs'
import { invoke } from '@tauri-apps/api/tauri'
import CodeMirror from '@uiw/react-codemirror'
import {
  BarChart2,
  Download,
  Eye,
  FileIcon,
  FileJson,
  FileSpreadsheet,
  FolderOpen,
  Play,
} from 'lucide-react'
import { useCallback, useEffect } from 'react'
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
      setQueryResult(result)
      setQueryTime(performance.now() - startTime)
    } catch (error) {
      console.error('Query execution error:', error)
      setQueryError(`Query execution failed: ${error}`)
      setQueryResult(null)
      toast.error(`Query execution failed: ${error}`)
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
    const link = document.createElement('a')
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', 'query_results.csv')
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  const renderTable = (data: DataFrameResult) => (
    <Table className="text-xs">
      <TableHeader>
        <TableRow>
          {data.schema.map(([column, type]: [string, string]) => (
            <TableHead key={column} title={type} className="font-semibold py-2">
              {column}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.data.map((row: string[], rowIndex: number) => (
          <TableRow key={`row-${row.join('-')}`}>
            {row.map((cell: string, cellIndex: number) => (
              <TableCell
                key={`cell-${row.join('-')}-${cellIndex}`}
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
        return <BarChart2 size={16} />
      case 'csv':
        return <FileSpreadsheet size={16} />
      case 'json':
        return <FileJson size={16} />
      default:
        return <FileIcon size={16} />
    }
  }

  return (
    <div className="flex h-full">
      <div className="w-1/5 p-2 border-r overflow-auto">
        <Button onClick={selectDirectory} className="w-full mb-2 text-xs">
          <FolderOpen className="mr-2 h-3 w-3" />
          Select Directory
        </Button>
        <div className="space-y-1">
          {files.map((file: FileInfo) => (
            <UITooltip key={file.path} title={file.name}>
              <div
                className={`flex items-center justify-between p-1 rounded cursor-pointer ${
                  selectedFile === file.path
                    ? 'bg-blue-100'
                    : 'hover:bg-gray-100'
                }`}
                onClick={() => setSelectedFile(file.path)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    setSelectedFile(file.path)
                  }
                }}
                role="button"
                tabIndex={0}
              >
                <div className="flex items-center flex-grow mr-2">
                  <span className="mr-2">{getFileIcon(file.name)}</span>
                  <span className="truncate text-xs">{file.name}</span>
                </div>
                <Eye
                  className="h-3 w-3 text-gray-500 hover:text-blue-500 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => {
                    e.stopPropagation()
                    previewFile(file.path)
                  }}
                />
              </div>
            </UITooltip>
          ))}
        </div>
      </div>
      <div className="flex-1 p-4 space-y-4 overflow-auto">
        <div className="border rounded p-2">
          <CodeMirror
            value={sqlQuery}
            height="150px"
            extensions={[sql()]}
            onChange={(value) => setSqlQuery(value)}
          />
        </div>
        <div className="flex justify-between items-center">
          <Button onClick={executeQuery} className="text-xs">
            <Play className="mr-2 h-3 w-3" />
            Execute Query
          </Button>
          {queryTime !== null && (
            <span className="text-xs">
              Query Time: {queryTime.toFixed(2)}ms
            </span>
          )}
          {queryResult && (
            <Button onClick={downloadResults} className="text-xs">
              <Download className="mr-2 h-3 w-3" />
              Download Results
            </Button>
          )}
        </div>

        {queryError && (
          <div className="text-red-500 p-2 border border-red-300 rounded bg-red-50 text-xs">
            {queryError}
          </div>
        )}

        {queryResult && (
          <div className="space-y-4">
            <Tabs defaultValue="table">
              <TabsList>
                <TabsTrigger value="table">Table</TabsTrigger>
                <TabsTrigger value="chart">Chart</TabsTrigger>
              </TabsList>
              <TabsContent value="table">
                {renderTable(queryResult)}
              </TabsContent>
              <TabsContent value="chart">
                <div className="flex items-center space-x-2 text-xs mb-2">
                  <span>Chart Type:</span>
                  <select
                    value={chartType}
                    onChange={(e) =>
                      setChartType(e.target.value as 'bar' | 'line' | 'area')
                    }
                    className="border rounded p-1 text-xs"
                  >
                    <option value="bar">Bar Chart</option>
                    <option value="line">Line Chart</option>
                    <option value="area">Area Chart</option>
                  </select>
                </div>
                <div className="h-[300px]">{renderChart()}</div>
              </TabsContent>
            </Tabs>
            <div className="text-xs">
              <h4 className="font-semibold">Query Result Information:</h4>
              <p>Number of rows: {queryResult.data.length}</p>
              <p>Number of columns: {queryResult.schema.length}</p>
              <p>
                Column names:{' '}
                {queryResult.schema.map(([name]) => name).join(', ')}
              </p>
              <p>
                Data types:{' '}
                {queryResult.schema.map(([_, type]) => type).join(', ')}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ChainAnalyzer
