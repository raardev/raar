import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { useNFTDataParserStore } from '@/stores/nftDataParserStore'
import { writeText } from '@tauri-apps/api/clipboard'
import {
  AlertCircleIcon,
  CopyIcon,
  ExternalLinkIcon,
  FileImageIcon,
  FileTextIcon,
  FileVideoIcon,
  HashIcon,
  ImageIcon,
  Loader2Icon,
  MusicIcon,
  PlayIcon,
  RefreshCwIcon,
} from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

interface ParsedNFTData {
  type: 'image' | 'video' | 'audio' | 'json' | 'text' | 'unknown'
  content: string | object
  mimeType?: string
  originalUri: string
  resolvedUri?: string
  metadata?: any
  error?: string
}

const NFTDataParser: React.FC = () => {
  const { history, addToHistory } = useNFTDataParserStore()
  const [inputUri, setInputUri] = useState('')
  const [loading, setLoading] = useState(false)
  const [parsedData, setParsedData] = useState<ParsedNFTData | null>(null)

  const ImagePreview: React.FC<{ 
    src: string; 
    alt: string; 
    className?: string;
    showFallbackText?: boolean;
  }> = ({ src, alt, className = "max-w-full max-h-48 object-contain rounded border", showFallbackText = true }) => {
    const [imageLoading, setImageLoading] = useState(true)
    const [imageError, setImageError] = useState(false)
    const resolvedSrc = resolveImageUri(src)

    return (
      <div className="flex flex-col items-center space-y-2">
        <div className="relative flex justify-center w-full">
          {imageLoading && !imageError && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2Icon className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          )}
          <img
            src={resolvedSrc}
            alt={alt}
            className={`${className} ${imageLoading ? 'opacity-0' : 'opacity-100'} transition-opacity`}
            onLoad={() => {
              setImageLoading(false)
              setImageError(false)
            }}
            onError={(e) => {
              console.log('Image load error:', {
                originalSrc: src,
                resolvedSrc: resolvedSrc,
                error: e
              })
              setImageLoading(false)
              setImageError(true)
            }}
            style={imageError ? { display: 'none' } : undefined}
          />
          {imageError && showFallbackText && (
            <div className="text-xs text-muted-foreground bg-muted p-2 rounded border-dashed border max-w-full">
              <p className="font-semibold">Failed to load image</p>
              <p className="break-all">{src.length > 100 ? `${src.slice(0, 100)}...` : src}</p>
              {resolvedSrc !== src && (
                <p className="text-xs text-muted-foreground mt-1">
                  Resolved: {resolvedSrc.length > 100 ? `${resolvedSrc.slice(0, 100)}...` : resolvedSrc}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    )
  }

  const resolveUri = async (uri: string): Promise<string> => {
    if (uri.startsWith('ipfs://')) {
      return uri.replace('ipfs://', 'https://ipfs.io/ipfs/')
    }
    if (uri.startsWith('ar://')) {
      return uri.replace('ar://', 'https://arweave.net/')
    }
    if (uri.startsWith('lens://')) {
      const hash = uri.replace('lens://', '')
      return `https://api.grove.storage/${hash}`
    }
    if (uri.startsWith('data:')) {
      return uri
    }
    return uri
  }

  const resolveImageUri = (uri: string): string => {
    if (uri.startsWith('ipfs://')) {
      return uri.replace('ipfs://', 'https://ipfs.io/ipfs/')
    }
    if (uri.startsWith('ar://')) {
      return uri.replace('ar://', 'https://arweave.net/')
    }
    if (uri.startsWith('lens://')) {
      const hash = uri.replace('lens://', '')
      return `https://api.grove.storage/${hash}`
    }
    if (uri.startsWith('data:')) {
      return uri
    }
    
    // Handle inline SVG content
    if (uri.trim().startsWith('<svg') || uri.includes('<svg')) {
      // Create a proper SVG data URI
      const svgContent = uri.trim()
      const encodedSvg = encodeURIComponent(svgContent)
      return `data:image/svg+xml,${encodedSvg}`
    }
    
    // Handle base64 encoded images without data URI prefix
    if (uri.length > 100 && uri.match(/^[A-Za-z0-9+/=]+$/)) {
      try {
        const decoded = atob(uri.substring(0, 50))
        if (decoded.includes('PNG')) return `data:image/png;base64,${uri}`
        if (decoded.includes('JPEG')) return `data:image/jpeg;base64,${uri}`
        if (decoded.includes('GIF')) return `data:image/gif;base64,${uri}`
        if (decoded.includes('<svg') || decoded.includes('SVG')) return `data:image/svg+xml;base64,${uri}`
      } catch {
        // Fall through to return original URI
      }
    }
    
    return uri
  }

  const isImageUri = (value: string): boolean => {
    if (!value || typeof value !== 'string') return false
    
    // Direct data URI images (including SVG)
    if (value.startsWith('data:image/')) return true
    
    // Check for inline SVG content
    if (value.trim().startsWith('<svg') || value.includes('<svg')) return true
    
    // Common image file extensions
    if (value.match(/\.(jpg|jpeg|png|gif|svg|webp|bmp|ico|tiff)(\?.*)?$/i)) return true
    
    // Protocol-based URIs that are likely images
    if (value.startsWith('ipfs://') && value.length > 10) return true
    if (value.startsWith('ar://') && value.length > 10) return true  
    if (value.startsWith('lens://') && value.length > 10) return true
    
    // URLs with image indicators
    if (value.startsWith('http') && (
      value.includes('image') || 
      value.includes('img') ||
      value.includes('photo') ||
      value.includes('picture') ||
      value.includes('avatar') ||
      value.includes('logo') ||
      value.includes('icon')
    )) return true
    
    // Base64 encoded images (common in NFT metadata)
    if (value.length > 100 && value.match(/^[A-Za-z0-9+/=]+$/)) {
      try {
        const decoded = atob(value.substring(0, 50)) // Check more characters for better detection
        return decoded.includes('PNG') || decoded.includes('JPEG') || decoded.includes('GIF') || decoded.includes('<svg')
      } catch {
        return false
      }
    }
    
    return false
  }

  const determineContentType = (
    mimeType?: string,
    content?: string,
  ): ParsedNFTData['type'] => {
    if (!mimeType && !content) return 'unknown'

    if (mimeType) {
      if (mimeType.startsWith('image/')) return 'image'
      if (mimeType.startsWith('video/')) return 'video'
      if (mimeType.startsWith('audio/')) return 'audio'
      if (mimeType.includes('json')) return 'json'
      if (mimeType.startsWith('text/')) return 'text'
    }

    if (content) {
      try {
        JSON.parse(content)
        return 'json'
      } catch {
        return 'text'
      }
    }

    return 'unknown'
  }

  const parseDataUri = (uri: string): ParsedNFTData => {
    try {
      const [header, data] = uri.split(',')
      const [mimeType, encoding] = header.replace('data:', '').split(';')
      const isBase64 = encoding === 'base64'

      let content: string
      if (isBase64) {
        content = atob(data)
      } else {
        content = decodeURIComponent(data)
      }

      let parsedContent: string | object = content
      if (mimeType.includes('json')) {
        try {
          parsedContent = JSON.parse(content)
        } catch {
          // Keep as string if JSON parsing fails
        }
      }

      return {
        type: determineContentType(mimeType, content),
        content: parsedContent,
        mimeType,
        originalUri: uri,
        resolvedUri: uri,
      }
    } catch (error) {
      return {
        type: 'unknown',
        content: '',
        originalUri: uri,
        error: `Failed to parse data URI: ${(error as Error).message}`,
      }
    }
  }

  const fetchContent = async (uri: string): Promise<ParsedNFTData> => {
    try {
      const response = await fetch(uri)
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const contentType = response.headers.get('content-type') || ''
      const type = determineContentType(contentType)

      let content: string | object
      if (type === 'json' || contentType.includes('json')) {
        content = await response.json()
      } else {
        content = await response.text()
      }

      return {
        type,
        content,
        mimeType: contentType,
        originalUri: inputUri,
        resolvedUri: uri,
      }
    } catch (error) {
      return {
        type: 'unknown',
        content: '',
        originalUri: inputUri,
        resolvedUri: uri,
        error: `Failed to fetch content: ${(error as Error).message}`,
      }
    }
  }

  const parseUri = async () => {
    if (!inputUri.trim()) {
      toast.error('Please enter a URI')
      return
    }

    setLoading(true)
    try {
      let result: ParsedNFTData

      if (inputUri.startsWith('data:')) {
        result = parseDataUri(inputUri)
      } else {
        const resolvedUri = await resolveUri(inputUri)
        result = await fetchContent(resolvedUri)
      }

      setParsedData(result)
      addToHistory({
        id: Date.now().toString(),
        uri: inputUri,
        timestamp: Date.now(),
        result,
      })
    } catch (error) {
      setParsedData({
        type: 'unknown',
        content: '',
        originalUri: inputUri,
        error: `Parsing failed: ${(error as Error).message}`,
      })
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = async (text: string) => {
    try {
      await writeText(text)
      toast.success('Copied to clipboard')
    } catch (error) {
      console.error('Failed to copy to clipboard:', error)
      toast.error('Failed to copy to clipboard')
    }
  }

  const getTypeIcon = (type: ParsedNFTData['type']) => {
    switch (type) {
      case 'image':
        return <ImageIcon className="h-4 w-4" />
      case 'video':
        return <FileVideoIcon className="h-4 w-4" />
      case 'audio':
        return <MusicIcon className="h-4 w-4" />
      case 'json':
        return <FileTextIcon className="h-4 w-4" />
      case 'text':
        return <FileTextIcon className="h-4 w-4" />
      default:
        return <FileImageIcon className="h-4 w-4" />
    }
  }

  const renderContent = (data: ParsedNFTData) => {
    if (data.error) {
      return (
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertCircleIcon className="h-4 w-4" />
              Error
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{data.error}</p>
          </CardContent>
        </Card>
      )
    }

    return (
      <Tabs defaultValue="preview" className="w-full">
        <TabsList>
          <TabsTrigger value="preview">Preview</TabsTrigger>
          <TabsTrigger value="metadata">Metadata</TabsTrigger>
          <TabsTrigger value="raw">Raw Data</TabsTrigger>
        </TabsList>

        <TabsContent value="preview" className="space-y-4">
          {data.type === 'image' && data.resolvedUri && (
            <div className="flex justify-center">
              <img
                src={data.resolvedUri}
                alt="NFT"
                className="max-w-full max-h-96 object-contain rounded-lg border"
                onError={(e) => {
                  e.currentTarget.src = ''
                  e.currentTarget.alt = 'Failed to load image'
                }}
              />
            </div>
          )}

          {data.type === 'video' && data.resolvedUri && (
            <div className="flex justify-center">
              <video
                controls
                className="max-w-full max-h-96 rounded-lg border"
                preload="metadata"
              >
                <source src={data.resolvedUri} />
                Your browser does not support the video tag.
              </video>
            </div>
          )}

          {data.type === 'audio' && data.resolvedUri && (
            <div className="flex justify-center">
              <audio controls className="w-full max-w-md">
                <source src={data.resolvedUri} />
                Your browser does not support the audio tag.
              </audio>
            </div>
          )}

          {data.type === 'json' && (
            <div className="space-y-4 w-full min-w-0">
              {typeof data.content === 'object' && data.content !== null && (
                <div className="grid gap-4 w-full min-w-0">
                  {Object.entries(data.content as Record<string, any>).map(([key, value]) => (
                    <Card key={key} className="w-full min-w-0">
                      <CardContent className="p-4 w-full min-w-0">
                        <div className="space-y-2 w-full min-w-0">
                          <Label className="text-sm font-semibold capitalize">
                            {key.replace(/_/g, ' ')}
                          </Label>
                          {(key.toLowerCase().includes('image') || 
                            key.toLowerCase().includes('icon') || 
                            key.toLowerCase().includes('avatar') ||
                            key.toLowerCase().includes('logo') ||
                            key.toLowerCase().includes('thumbnail') ||
                            (typeof value === 'string' && isImageUri(value))
                          ) && typeof value === 'string' && (
                            <ImagePreview src={value} alt={key} />
                          )}
                          {Array.isArray(value) ? (
                            <div className="space-y-1 w-full min-w-0">
                              {value.map((item, index) => (
                                <div key={index} className="space-y-2 w-full min-w-0">
                                  {typeof item === 'string' && isImageUri(item) ? (
                                    <ImagePreview 
                                      src={item} 
                                      alt={`${key}-${index}`} 
                                      className="max-w-full max-h-32 object-contain rounded border"
                                    />
                                  ) : null}
                                  <div className="text-sm bg-muted p-2 rounded break-words w-full min-w-0 whitespace-pre-wrap">
                                    {typeof item === 'object' ? JSON.stringify(item, null, 2) : String(item)}
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : typeof value === 'object' && value !== null ? (
                            <div className="space-y-2 w-full min-w-0">
                              {Object.entries(value as Record<string, any>).map(([nestedKey, nestedValue]) => (
                                <div key={nestedKey} className="border-l-2 border-muted pl-3 w-full min-w-0">
                                  <Label className="text-xs font-medium capitalize text-muted-foreground">
                                    {nestedKey.replace(/_/g, ' ')}
                                  </Label>
                                  {typeof nestedValue === 'string' && isImageUri(nestedValue) && (
                                    <ImagePreview 
                                      src={nestedValue} 
                                      alt={nestedKey}
                                      className="max-w-full max-h-24 object-contain rounded border"
                                    />
                                  )}
                                  <div className="text-xs bg-muted p-2 rounded break-words mt-1 w-full min-w-0 whitespace-pre-wrap overflow-auto">
                                    {typeof nestedValue === 'object' 
                                      ? JSON.stringify(nestedValue, null, 2) 
                                      : String(nestedValue)}
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-sm bg-muted p-3 rounded whitespace-pre-wrap break-words w-full min-w-0 overflow-auto">
                              {String(value)}
                            </div>
                          )
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {data.type === 'text' && (
            <Card>
              <CardContent className="p-4">
                <div className="text-sm whitespace-pre-wrap max-h-96 overflow-auto break-words">
                  {data.content as string}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="metadata" className="space-y-4">
          <div className="grid gap-4">
            <div>
              <Label className="text-sm font-medium">Original URI</Label>
              <div className="flex items-center gap-2 mt-1">
                <Input value={data.originalUri} readOnly className="font-mono text-xs" />
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => copyToClipboard(data.originalUri)}
                    >
                      <CopyIcon className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Copy URI</TooltipContent>
                </Tooltip>
              </div>
            </div>

            {data.resolvedUri && data.resolvedUri !== data.originalUri && (
              <div>
                <Label className="text-sm font-medium">Resolved URI</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Input
                    value={data.resolvedUri}
                    readOnly
                    className="font-mono text-xs"
                  />
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => copyToClipboard(data.resolvedUri!)}
                      >
                        <CopyIcon className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Copy resolved URI</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => window.open(data.resolvedUri, '_blank')}
                      >
                        <ExternalLinkIcon className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Open in browser</TooltipContent>
                  </Tooltip>
                </div>
              </div>
            )}

            <div>
              <Label className="text-sm font-medium">Content Type</Label>
              <div className="flex items-center gap-2 mt-1">
                {getTypeIcon(data.type)}
                <span className="text-sm capitalize">{data.type}</span>
                {data.mimeType && (
                  <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                    {data.mimeType}
                  </span>
                )}
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="raw" className="space-y-4">
          <Card>
            <CardContent className="p-4">
              <pre className="text-sm overflow-auto max-h-96 bg-muted p-3 rounded whitespace-pre-wrap break-all">
                {typeof data.content === 'object'
                  ? JSON.stringify(data.content, null, 2)
                  : data.content}
              </pre>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    )
  }

  return (
    <div className="space-y-6 max-w-full overflow-hidden">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HashIcon className="h-5 w-5" />
            NFT Data Parser
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Parse and display NFT metadata from various URI formats including
            IPFS, Arweave, Lens, and data URIs
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <div className="flex-1">
              <Input
                placeholder="Enter URI (ipfs://, ar://, lens://, https://, data:...)"
                value={inputUri}
                onChange={(e) => setInputUri(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && parseUri()}
                className="font-mono text-xs"
              />
            </div>
            <Button onClick={parseUri} disabled={loading}>
              {loading ? (
                <Loader2Icon className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <PlayIcon className="h-4 w-4 mr-2" />
              )}
              Parse
            </Button>
          </div>

          {parsedData && (
            <div className="mt-6">
              <Separator className="mb-4" />
              {renderContent(parsedData)}
            </div>
          )}
        </CardContent>
      </Card>

      {history.length > 0 && (
        <Card className="w-full min-w-0">
          <CardHeader>
            <CardTitle className="text-lg">History</CardTitle>
          </CardHeader>
          <CardContent className="w-full min-w-0">
            <ScrollArea className="max-h-64 w-full">
              <div className="space-y-2 w-full">
                {history
                  .slice()
                  .reverse()
                  .map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer min-w-0"
                      onClick={() => {
                        setInputUri(item.uri)
                        setParsedData(item.result)
                      }}
                    >
                      <div className="flex-shrink-0">
                        {getTypeIcon(item.result.type)}
                      </div>
                      <div className="min-w-0 flex-1 overflow-hidden">
                        <p className="text-xs font-mono truncate w-full max-w-0">
                          {item.uri.length > 50 ? `${item.uri.slice(0, 47)}...` : item.uri}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(item.timestamp).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex-shrink-0">
                        <span className="text-xs bg-muted px-2 py-1 rounded capitalize whitespace-nowrap">
                          {item.result.type}
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default NFTDataParser