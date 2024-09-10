import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { open } from '@tauri-apps/api/dialog'
import { listen } from '@tauri-apps/api/event'
import { invoke } from '@tauri-apps/api/tauri'
import { AlertCircle, FolderOpen, Loader2 } from 'lucide-react'
import type React from 'react'
import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import RPCInput from './RPCInput'

interface IndexerState {
  indexing_progress: number
  log_messages: string[]
  available_datasets: string[]
  selected_dataset: string | null
  summary: string | null
  indexed_dirs: string[]
  indexed_files: string[]
}

interface IndexerOptions {
  rpc: string
  blocks: string
  align: boolean
  reorgBuffer: number
  includeColumns: string
  excludeColumns: string
  sort: string
  excludeFailed: boolean
  requestsPerSecond: number
  maxRetries: number
  chunkSize: number
  outputDir: string
  overwrite: boolean
  format: 'parquet' | 'csv' | 'json'
}

const defaultOptions: IndexerOptions = {
  rpc: 'http://localhost:8545',
  blocks: '0:latest',
  align: false,
  reorgBuffer: 0,
  includeColumns: '',
  excludeColumns: '',
  sort: '',
  excludeFailed: false,
  requestsPerSecond: 0,
  maxRetries: 5,
  chunkSize: 1000,
  outputDir: '',
  overwrite: false,
  format: 'parquet',
}

interface CompactFreezeSummary {
  completed_chunks: number
  skipped_chunks: number
  errored_chunks: number
  total_chunks: number
  rows_written: number
}

const ChainExtractor: React.FC = () => {
  const [indexerState, setIndexerState] = useState<IndexerState | null>(null)
  const [availableDatasets, setAvailableDatasets] = useState<string[]>([])
  const [selectedDataset, setSelectedDataset] = useState<string | null>(null)
  const [options, setOptions] = useState<IndexerOptions>(defaultOptions)
  const [freezeSummary, setFreezeSummary] =
    useState<CompactFreezeSummary | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isIndexing, setIsIndexing] = useState(false)

  const startIndexing = async () => {
    try {
      setError(null)
      setIsIndexing(true)
      const summary: CompactFreezeSummary = await invoke('start_indexing', {
        path: options.outputDir,
        dataset: selectedDataset,
        options: options,
      })
      setFreezeSummary(summary)
    } catch (error) {
      console.error('Failed to start indexing:', error)
      setError(error as string)
      toast.error('Indexing failed. Please check the logs for details.')
    } finally {
      setIsIndexing(false)
    }
  }

  const selectOutputDirectory = async () => {
    const selected = await open({
      directory: true,
      multiple: false,
      title: 'Select Output Directory',
    })
    if (selected && typeof selected === 'string') {
      setOptions((prev) => ({ ...prev, outputDir: selected }))
    }
  }

  const fetchAvailableDatasets = useCallback(async () => {
    try {
      const datasets = await invoke('get_available_datasets')
      setAvailableDatasets(datasets as string[])
    } catch (error) {
      console.error('Failed to fetch available datasets:', error)
    }
  }, [])

  const handleDatasetChange = async (dataset: string) => {
    try {
      await invoke('set_selected_dataset', { dataset })
      setSelectedDataset(dataset)
    } catch (error) {
      console.error('Failed to set selected dataset:', error)
    }
  }

  useEffect(() => {
    fetchAvailableDatasets()

    const fetchIndexerState = async () => {
      try {
        const state = await invoke('get_indexer_state')
        setIndexerState(state as IndexerState)
      } catch (error) {
        console.error('Failed to fetch indexer state:', error)
      }
    }

    const subscribeToLogs = async () => {
      await invoke('subscribe_to_indexer_logs')
      const unsubscribe = await listen(
        'indexer-log',
        (event: { payload: string }) => {
          setIndexerState((prevState) => {
            if (!prevState) return prevState
            return {
              ...prevState,
              log_messages: [...prevState.log_messages, event.payload],
            }
          })
        },
      )

      return () => {
        unsubscribe()
      }
    }

    const interval = setInterval(fetchIndexerState, 500)
    const unsubscribe = subscribeToLogs()

    return () => {
      clearInterval(interval)
      unsubscribe.then((unsub) => unsub())
    }
  }, [fetchAvailableDatasets])

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="rpc">RPC URL</Label>
          <RPCInput
            value={options.rpc}
            onChange={(value) =>
              setOptions((prev) => ({ ...prev, rpc: value }))
            }
            placeholder="Enter RPC URL"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="dataset">Dataset</Label>
          <Select onValueChange={handleDatasetChange}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select dataset" />
            </SelectTrigger>
            <SelectContent>
              {availableDatasets.map((dataset) => (
                <SelectItem key={dataset} value={dataset}>
                  {dataset}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="blocks">Blocks Range</Label>
          <Input
            id="blocks"
            value={options.blocks}
            onChange={(e) =>
              setOptions((prev) => ({ ...prev, blocks: e.target.value }))
            }
            placeholder="Enter blocks range (e.g., 0:latest)"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="outputDir">Output Directory</Label>
          <div className="flex items-center space-x-2">
            <Input
              id="outputDir"
              value={options.outputDir}
              placeholder="Select output directory"
              readOnly
              className="flex-grow"
            />
            <Button
              onClick={selectOutputDirectory}
              variant="outline"
              size="icon"
            >
              <FolderOpen className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex justify-end space-x-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline">Settings</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Advanced Settings</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="reorgBuffer" className="text-right">
                    Reorg Buffer
                  </Label>
                  <Input
                    id="reorgBuffer"
                    type="number"
                    value={options.reorgBuffer}
                    onChange={(e) =>
                      setOptions((prev) => ({
                        ...prev,
                        reorgBuffer: Number.parseInt(e.target.value),
                      }))
                    }
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="includeColumns" className="text-right">
                    Include Columns
                  </Label>
                  <Input
                    id="includeColumns"
                    value={options.includeColumns}
                    onChange={(e) =>
                      setOptions((prev) => ({
                        ...prev,
                        includeColumns: e.target.value,
                      }))
                    }
                    placeholder="column1,column2,column3"
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="excludeColumns" className="text-right">
                    Exclude Columns
                  </Label>
                  <Input
                    id="excludeColumns"
                    value={options.excludeColumns}
                    onChange={(e) =>
                      setOptions((prev) => ({
                        ...prev,
                        excludeColumns: e.target.value,
                      }))
                    }
                    placeholder="column1,column2,column3"
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="sort" className="text-right">
                    Sort By
                  </Label>
                  <Input
                    id="sort"
                    value={options.sort}
                    onChange={(e) =>
                      setOptions((prev) => ({
                        ...prev,
                        sort: e.target.value,
                      }))
                    }
                    placeholder="column1,column2,column3"
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="requestsPerSecond" className="text-right">
                    Requests Per Second
                  </Label>
                  <Input
                    id="requestsPerSecond"
                    type="number"
                    value={options.requestsPerSecond}
                    onChange={(e) =>
                      setOptions((prev) => ({
                        ...prev,
                        requestsPerSecond: Number.parseInt(e.target.value),
                      }))
                    }
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="maxRetries" className="text-right">
                    Max Retries
                  </Label>
                  <Input
                    id="maxRetries"
                    type="number"
                    value={options.maxRetries}
                    onChange={(e) =>
                      setOptions((prev) => ({
                        ...prev,
                        maxRetries: Number.parseInt(e.target.value),
                      }))
                    }
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="chunkSize" className="text-right">
                    Chunk Size
                  </Label>
                  <Input
                    id="chunkSize"
                    type="number"
                    value={options.chunkSize}
                    onChange={(e) =>
                      setOptions((prev) => ({
                        ...prev,
                        chunkSize: Number.parseInt(e.target.value),
                      }))
                    }
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="overwrite" className="text-right">
                    Overwrite
                  </Label>
                  <Checkbox
                    id="overwrite"
                    checked={options.overwrite}
                    onCheckedChange={(checked) =>
                      setOptions((prev) => ({
                        ...prev,
                        overwrite: checked as boolean,
                      }))
                    }
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="format" className="text-right">
                    Output Format
                  </Label>
                  <Select
                    value={options.format}
                    onValueChange={(value: 'parquet' | 'csv' | 'json') =>
                      setOptions((prev) => ({ ...prev, format: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="parquet">Parquet</SelectItem>
                      <SelectItem value="csv">CSV</SelectItem>
                      <SelectItem value="json">JSON</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="align" className="text-right">
                    Align chunk boundaries
                  </Label>
                  <Checkbox
                    id="align"
                    checked={options.align}
                    onCheckedChange={(checked) =>
                      setOptions((prev) => ({
                        ...prev,
                        align: checked as boolean,
                      }))
                    }
                  />
                </div>
              </div>
            </DialogContent>
          </Dialog>
          <Button
            onClick={startIndexing}
            disabled={!options.outputDir || !selectedDataset || isIndexing}
            variant="default"
          >
            {isIndexing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Indexing
              </>
            ) : (
              'Index'
            )}
          </Button>
        </div>
      </div>

      {error && (
        <Card className="bg-red-50 border-red-200">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2 text-red-800">
              <AlertCircle className="h-5 w-5" />
              <h3 className="text-lg font-semibold">Error</h3>
            </div>
            <p className="mt-2 text-sm text-red-700">{error}</p>
          </CardContent>
        </Card>
      )}

      {indexerState && (
        <Card>
          <CardContent className="p-4">
            <h3 className="text-lg font-semibold mb-2">Indexing Progress</h3>
            <Progress value={indexerState.indexing_progress} className="mb-2" />
            <p className="text-sm text-gray-600 mb-2">
              {indexerState.indexing_progress.toFixed(2)}% Complete
            </p>
            <div className="text-sm text-gray-600 h-48 overflow-y-auto border border-gray-200 rounded p-2">
              {indexerState.log_messages.map((message, index) => (
                <p
                  key={`log-${index}-${message.substring(0, 10)}`}
                  className={`mb-1 ${
                    message.startsWith('Error:')
                      ? 'text-red-600 font-semibold'
                      : ''
                  }`}
                >
                  {message}
                </p>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {freezeSummary && (
        <Card>
          <CardContent className="p-4">
            <h3 className="text-lg font-semibold mb-2">Indexing Summary</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <p>
                Completed: {freezeSummary.completed_chunks} /{' '}
                {freezeSummary.total_chunks}
              </p>
              <p>
                Skipped: {freezeSummary.skipped_chunks} /{' '}
                {freezeSummary.total_chunks}
              </p>
              <p>
                Errored: {freezeSummary.errored_chunks} /{' '}
                {freezeSummary.total_chunks}
              </p>
              <p>Rows written: {freezeSummary.rows_written.toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default ChainExtractor
