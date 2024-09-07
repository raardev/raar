import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { invoke } from '@tauri-apps/api/tauri'
import { open } from '@tauri-apps/api/dialog'
import type React from 'react'
import { useEffect, useState } from 'react'

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

const IndexerTool: React.FC = () => {
  const [indexerState, setIndexerState] = useState<IndexerState | null>(null)
  const [availableDatasets, setAvailableDatasets] = useState<string[]>([])
  const [selectedDataset, setSelectedDataset] = useState<string | null>(null)
  const [options, setOptions] = useState<IndexerOptions>(defaultOptions)

  const startIndexing = async () => {
    try {
      await invoke('start_indexing', { 
        path: options.outputDir, 
        dataset: selectedDataset,
        options: options
      })
    } catch (error) {
      console.error('Failed to start indexing:', error)
    }
  }

  const selectOutputDirectory = async () => {
    const selected = await open({
      directory: true,
      multiple: false,
      title: 'Select Output Directory',
    })
    if (selected && typeof selected === 'string') {
      setOptions(prev => ({ ...prev, outputDir: selected }))
    }
  }

  const fetchAvailableDatasets = async () => {
    try {
      const datasets = await invoke('get_available_datasets')
      setAvailableDatasets(datasets as string[])
    } catch (error) {
      console.error('Failed to fetch available datasets:', error)
    }
  }

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

    const interval = setInterval(fetchIndexerState, 1000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Blockchain Data Indexer</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label>RPC URL</Label>
              <Input
                value={options.rpc}
                onChange={(e) => setOptions(prev => ({ ...prev, rpc: e.target.value }))}
                placeholder="http://localhost:8545"
              />
            </div>
            <div>
              <Label>Blocks</Label>
              <Input
                value={options.blocks}
                onChange={(e) => setOptions(prev => ({ ...prev, blocks: e.target.value }))}
                placeholder="0:latest"
              />
            </div>
            <div>
              <Label>Dataset to Index</Label>
              <Select onValueChange={handleDatasetChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a dataset" />
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
            <div>
              <Label>Output Directory</Label>
              <div className="flex space-x-2">
                <Input
                  value={options.outputDir}
                  onChange={(e) => setOptions(prev => ({ ...prev, outputDir: e.target.value }))}
                  placeholder="Output directory path"
                  readOnly
                />
                <Button onClick={selectOutputDirectory}>Browse</Button>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="align"
                checked={options.align}
                onCheckedChange={(checked) => setOptions(prev => ({ ...prev, align: checked as boolean }))}
              />
              <Label htmlFor="align">Align chunk boundaries</Label>
            </div>
            <div>
              <Label>Reorg Buffer</Label>
              <Input
                type="number"
                value={options.reorgBuffer}
                onChange={(e) => setOptions(prev => ({ ...prev, reorgBuffer: parseInt(e.target.value) }))}
              />
            </div>
            <div>
              <Label>Include Columns (comma-separated)</Label>
              <Input
                value={options.includeColumns}
                onChange={(e) => setOptions(prev => ({ ...prev, includeColumns: e.target.value }))}
                placeholder="column1,column2,column3"
              />
            </div>
            <div>
              <Label>Exclude Columns (comma-separated)</Label>
              <Input
                value={options.excludeColumns}
                onChange={(e) => setOptions(prev => ({ ...prev, excludeColumns: e.target.value }))}
                placeholder="column1,column2,column3"
              />
            </div>
            <div>
              <Label>Sort By (comma-separated)</Label>
              <Input
                value={options.sort}
                onChange={(e) => setOptions(prev => ({ ...prev, sort: e.target.value }))}
                placeholder="column1,column2,column3"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="excludeFailed"
                checked={options.excludeFailed}
                onCheckedChange={(checked) => setOptions(prev => ({ ...prev, excludeFailed: checked as boolean }))}
              />
              <Label htmlFor="excludeFailed">Exclude failed transactions</Label>
            </div>
            <div>
              <Label>Requests Per Second (0 for no limit)</Label>
              <Input
                type="number"
                value={options.requestsPerSecond}
                onChange={(e) => setOptions(prev => ({ ...prev, requestsPerSecond: parseInt(e.target.value) }))}
              />
            </div>
            <div>
              <Label>Max Retries</Label>
              <Input
                type="number"
                value={options.maxRetries}
                onChange={(e) => setOptions(prev => ({ ...prev, maxRetries: parseInt(e.target.value) }))}
              />
            </div>
            <div>
              <Label>Chunk Size</Label>
              <Input
                type="number"
                value={options.chunkSize}
                onChange={(e) => setOptions(prev => ({ ...prev, chunkSize: parseInt(e.target.value) }))}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="overwrite"
                checked={options.overwrite}
                onCheckedChange={(checked) => setOptions(prev => ({ ...prev, overwrite: checked as boolean }))}
              />
              <Label htmlFor="overwrite">Overwrite existing files</Label>
            </div>
            <div>
              <Label>Output Format</Label>
              <Select
                value={options.format}
                onValueChange={(value: 'parquet' | 'csv' | 'json') => setOptions(prev => ({ ...prev, format: value }))}
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
            <Button
              onClick={startIndexing}
              disabled={!options.outputDir || !selectedDataset}
              className="w-full"
            >
              Start Indexing
            </Button>
          </div>
        </CardContent>
      </Card>

      {indexerState && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Indexing Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <Progress value={indexerState.indexing_progress} />
              <p className="mt-2 text-sm text-gray-600">
                {indexerState.indexing_progress.toFixed(2)}% Complete
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Log Messages</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1 max-h-60 overflow-y-auto">
                {indexerState.log_messages.map((message, index) => (
                  <li key={index} className="text-sm">
                    {message}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {indexerState.indexed_dirs.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Indexed Directories</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="list-disc list-inside">
                  {indexerState.indexed_dirs.map((dir, index) => (
                    <li key={index} className="text-sm">
                      {dir}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  )
}

export default IndexerTool
