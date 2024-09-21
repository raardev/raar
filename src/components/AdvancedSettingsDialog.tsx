import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type React from 'react'
import type { IndexerOptions } from '../config/indexerOptions'
import { OptionField } from './OptionField'

// Add this export
export const convertOptionsToBackend = (
  options: IndexerOptions,
): IndexerOptions => {
  return {
    ...options,
    // Convert single string to array for these fields
    blocks: options.blocks ? options.blocks.split(',') : null,
    timestamps: options.timestamps ? options.timestamps.split(',') : null,
    txs: options.txs ? options.txs.split(',') : null,
    // Convert string to array for these fields
    includeColumns: options.includeColumns
      ? options.includeColumns.split(',')
      : null,
    excludeColumns: options.excludeColumns
      ? options.excludeColumns.split(',')
      : null,
    // Handle sort option
    sort: options.sort
      ? options.sort === 'none'
        ? null
        : options.sort.split(',')
      : null,
    // Convert number to Option<u64> for these fields
    nChunks: options.nChunks || null,
    maxConcurrentRequests: options.maxConcurrentRequests || null,
    maxConcurrentChunks: options.maxConcurrentChunks || null,
    // Convert number to Option<usize> for these fields
    rowGroupSize: options.rowGroupSize || null,
    nRowGroups: options.nRowGroups || null,
    // Convert string to Option<PathBuf> for this field
    reportDir: options.reportDir || null,
  }
}

interface AdvancedSettingsDialogProps {
  options: IndexerOptions
  onOptionChange: (key: keyof IndexerOptions, value: unknown) => void
}

const AdvancedSettingsDialog: React.FC<AdvancedSettingsDialogProps> = ({
  options,
  onOptionChange,
}) => {
  const getFieldType = (
    key: keyof IndexerOptions,
    value: unknown,
  ): 'text' | 'number' | 'select' | 'checkbox' => {
    if (typeof value === 'boolean') return 'checkbox'
    if (typeof value === 'number') return 'number'
    if (Array.isArray(value)) return 'text' // For now, we'll keep arrays as text input

    // Special cases for select fields
    const selectFields: Partial<Record<keyof IndexerOptions, string[]>> = {
      chunkOrder: ['normal', 'reverse', 'random'],
      compression: ['lz4', 'zstd', 'snappy', 'gzip', 'brotli'],
    }
    if (key in selectFields) return 'select'

    return 'text'
  }

  const getSelectOptions = (
    key: keyof IndexerOptions,
  ): { value: string; label: string }[] => {
    const selectFields: Partial<Record<keyof IndexerOptions, string[]>> = {
      chunkOrder: ['normal', 'reverse', 'random'],
      compression: ['lz4', 'zstd', 'snappy', 'gzip', 'brotli'],
    }
    return (selectFields[key] || []).map((v) => ({ value: v, label: v }))
  }

  const renderOptions = (category: string, keys: (keyof IndexerOptions)[]) => (
    <div className="grid gap-4 py-4">
      {keys.map((key) => {
        const fieldType = getFieldType(key, options[key])
        return (
          <OptionField
            key={key}
            label={key}
            value={options[key]}
            onChange={(newValue) => onOptionChange(key, newValue)}
            type={fieldType}
            placeholder={`Enter ${key}`}
            options={fieldType === 'select' ? getSelectOptions(key) : undefined}
            description={
              key === 'sort'
                ? 'Comma-separated list of columns to sort by, or "none" to disable sorting'
                : undefined
            }
          />
        )
      })}
    </div>
  )

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">Advanced Settings</Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Advanced Settings</DialogTitle>
        </DialogHeader>
        <Tabs defaultValue="content">
          <TabsList>
            <TabsTrigger value="content">Content</TabsTrigger>
            <TabsTrigger value="acquisition">Acquisition</TabsTrigger>
            <TabsTrigger value="output">Output</TabsTrigger>
            <TabsTrigger value="dataset">Dataset-specific</TabsTrigger>
          </TabsList>
          <TabsContent value="content">
            {renderOptions('Content', [
              'timestamps',
              'txs',
              'align',
              'reorgBuffer',
              'includeColumns',
              'excludeColumns',
              'columns',
              'u256Types',
              'hex',
              'sort',
              'excludeFailed',
            ])}
          </TabsContent>
          <TabsContent value="acquisition">
            {renderOptions('Acquisition', [
              'requestsPerSecond',
              'maxRetries',
              'initialBackoff',
              'maxConcurrentRequests',
              'maxConcurrentChunks',
              'chunkOrder',
              'dry',
            ])}
          </TabsContent>
          <TabsContent value="output">
            {renderOptions('Output', [
              'chunkSize',
              'nChunks',
              'partitionBy',
              'subdirs',
              'label',
              'overwrite',
              'csv',
              'json',
              'rowGroupSize',
              'nRowGroups',
              'compression',
              'reportDir',
              'noReport',
            ])}
          </TabsContent>
          <TabsContent value="dataset">
            {renderOptions('Dataset-specific', [
              'address',
              'toAddress',
              'fromAddress',
              'callData',
              'function',
              'inputs',
              'slot',
              'contract',
              'topic0',
              'topic1',
              'topic2',
              'topic3',
              'eventSignature',
              'innerRequestSize',
              'jsTracer',
            ])}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}

export default AdvancedSettingsDialog
