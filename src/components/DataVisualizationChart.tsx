import { Button } from '@/components/ui/button'
import {
  type ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { BrushIcon } from 'lucide-react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Brush,
  CartesianGrid,
  Line,
  LineChart,
  XAxis,
  YAxis,
} from 'recharts'

interface DataVisualizationChartProps {
  data: Record<string, unknown>[]
  columns: string[]
  chartType: 'bar' | 'line' | 'area'
  setChartType: (type: 'bar' | 'line' | 'area') => void
  xAxis: string
  setXAxis: (axis: string) => void
  yAxis: string
  setYAxis: (axis: string) => void
  showBrush: boolean
  setShowBrush: (show: boolean) => void
}

const DataVisualizationChart: React.FC<DataVisualizationChartProps> = ({
  data,
  columns,
  chartType,
  setChartType,
  xAxis,
  setXAxis,
  yAxis,
  setYAxis,
  showBrush,
  setShowBrush,
}) => {
  const chartConfig: ChartConfig = {
    [yAxis]: {
      label: yAxis,
      color: 'hsl(var(--chart-1))',
    },
  }

  const ChartComponent =
    chartType === 'bar'
      ? BarChart
      : chartType === 'line'
        ? LineChart
        : AreaChart

  const DataComponent =
    chartType === 'bar' ? Bar : chartType === 'line' ? Line : Area

  return (
    <div className="flex flex-col space-y-4 h-full">
      <div className="flex flex-wrap gap-4 items-center text-sm p-2">
        <div className="flex items-center">
          <Label htmlFor="chart-type" className="w-14 mr-2 whitespace-nowrap">
            Type:
          </Label>
          <Select
            value={chartType}
            onValueChange={(value) =>
              setChartType(value as 'bar' | 'line' | 'area')
            }
          >
            <SelectTrigger id="chart-type" className="h-9">
              <SelectValue placeholder="Chart type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="bar">Bar</SelectItem>
              <SelectItem value="line">Line</SelectItem>
              <SelectItem value="area">Area</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center">
          <Label htmlFor="x-axis" className="w-14 mr-2 whitespace-nowrap">
            X Axis:
          </Label>
          <Select value={xAxis} onValueChange={setXAxis}>
            <SelectTrigger id="x-axis" className="h-9">
              <SelectValue placeholder="X Axis" />
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
        <div className="flex items-center">
          <Label htmlFor="y-axis" className="w-14 mr-2 whitespace-nowrap">
            Y Axis:
          </Label>
          <Select value={yAxis} onValueChange={setYAxis}>
            <SelectTrigger id="y-axis" className="h-9">
              <SelectValue placeholder="Y Axis" />
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
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowBrush(!showBrush)}
          className={`p-2 h-9 ${showBrush ? 'bg-gray-200' : ''}`}
          title={showBrush ? 'Disable Brush' : 'Enable Brush'}
        >
          <BrushIcon className="h-5 w-5" />
        </Button>
      </div>
      <ChartContainer config={chartConfig} className="h-full w-full">
        <ChartComponent data={data}>
          <CartesianGrid vertical={false} />
          <XAxis
            dataKey={xAxis}
            tickLine={false}
            tickMargin={10}
            axisLine={false}
          />
          <YAxis
            dataKey={yAxis}
            tickLine={false}
            tickMargin={10}
            axisLine={false}
          />
          <ChartTooltip content={<ChartTooltipContent />} />
          <ChartLegend content={<ChartLegendContent />} />
          <DataComponent
            dataKey={yAxis}
            fill={`var(--color-${yAxis})`}
            stroke={`var(--color-${yAxis})`}
            type="monotone"
          />
          {showBrush && (
            <Brush
              dataKey={xAxis}
              height={30}
              stroke={`var(--color-${yAxis})`}
            />
          )}
        </ChartComponent>
      </ChartContainer>
    </div>
  )
}

export default DataVisualizationChart
