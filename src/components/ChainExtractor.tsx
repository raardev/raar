import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { open } from '@tauri-apps/api/dialog'
import { listen } from '@tauri-apps/api/event'
import { invoke } from '@tauri-apps/api/tauri'
import { AlertCircle, FolderOpen, Loader2 } from 'lucide-react'
import type React from 'react'
import { useCallback, useEffect, useMemo } from 'react'
import { toast } from 'sonner'
import type { IndexerOptions } from '../config/indexerOptions'
import type { CompactFreezeSummary, IndexerState } from '../store/indexerStore'
import { useIndexerStore } from '../store/indexerStore'
import AdvancedSettingsDialog, {
  convertOptionsToBackend,
} from './AdvancedSettingsDialog'
import { OptionField } from './OptionField'
import RPCInput from './RPCInput'

const ChainExtractor: React.FC = () => {
  const {
    indexerState,
    availableDatasets,
    selectedDataset,
    options,
    freezeSummary,
    error,
    isIndexing,
    setIndexerState,
    setAvailableDatasets,
    setSelectedDataset,
    setOptions,
    setFreezeSummary,
    setError,
    setIsIndexing,
  } = useIndexerStore()

  const handleOptionChange = useCallback(
    (
      key: keyof IndexerOptions,
      value: IndexerOptions[keyof IndexerOptions],
    ) => {
      setOptions({ [key]: value })
    },
    [setOptions],
  )

  const startIndexing = async () => {
    try {
      setError(null)
      setIsIndexing(true)

      const convertedOptions = convertOptionsToBackend(options)
      console.log('Current options before indexing:', convertedOptions)

      const summary: CompactFreezeSummary = await invoke('start_indexing', {
        path: convertedOptions.outputDir,
        dataset: selectedDataset,
        options: convertedOptions,
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

  const selectOutputDirectory = useCallback(async () => {
    const selected = await open({
      directory: true,
      multiple: false,
      title: 'Select Output Directory',
    })
    if (selected && typeof selected === 'string') {
      handleOptionChange('outputDir', selected)
    }
  }, [handleOptionChange])

  const fetchAvailableDatasets = useCallback(async () => {
    try {
      const datasets = await invoke('get_available_datasets')
      setAvailableDatasets(datasets as string[])
    } catch (error) {
      console.error('Failed to fetch available datasets:', error)
    }
  }, [setAvailableDatasets])

  const handleDatasetChange = async (dataset: string) => {
    try {
      await invoke('set_selected_dataset', { dataset })
      setSelectedDataset(dataset)
    } catch (error) {
      console.error('Failed to set selected dataset:', error)
    }
  }

  const mainFields = useMemo(
    () => [
      { key: 'rpc', label: 'RPC URL', component: RPCInput },
      {
        key: 'blocks',
        label: 'Blocks Range',
        placeholder: 'e.g., 0:latest, 12M:13M, 5K:+1000',
      },
      {
        key: 'outputDir',
        label: 'Output Directory',
        readOnly: true,
        button: {
          icon: FolderOpen,
          onClick: selectOutputDirectory,
        },
      },
    ],
    [selectOutputDirectory],
  )

  useEffect(() => {
    fetchAvailableDatasets()

    const fetchIndexerState = async () => {
      try {
        const state = await invoke('get_indexer_state')
        setIndexerState(state as IndexerState['indexerState'])
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
  }, [fetchAvailableDatasets, setIndexerState])

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        {mainFields.map((field) => (
          <OptionField
            key={field.key as string}
            label={field.label}
            value={options[field.key as keyof IndexerOptions]}
            onChange={(value) =>
              handleOptionChange(field.key as keyof IndexerOptions, value)
            }
            {...field}
          />
        ))}

        {/* Dataset selection */}
        <OptionField
          label="Dataset"
          value={selectedDataset || ''}
          onChange={handleDatasetChange}
          type="select"
          options={availableDatasets.map((dataset) => ({
            value: dataset,
            label: dataset,
          }))}
        />

        <div className="flex justify-end space-x-2">
          <AdvancedSettingsDialog
            options={options}
            onOptionChange={handleOptionChange}
          />
          <Button
            onClick={startIndexing}
            disabled={!options.outputDir || !selectedDataset || isIndexing}
          >
            {isIndexing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Indexing
              </>
            ) : (
              'Start Indexing'
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
