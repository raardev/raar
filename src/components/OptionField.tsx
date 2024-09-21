import type React from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select'

interface OptionFieldProps<T> {
  label: string
  value: T
  onChange: (value: T) => void
  type?: 'text' | 'number' | 'select' | 'checkbox'
  placeholder?: string
  options?: { value: string; label: string }[]
  readOnly?: boolean
  button?: {
    icon: React.ComponentType<{ className?: string }>
    onClick: () => void
  }
}

export function OptionField<T>({
  label,
  value,
  onChange,
  type = 'text',
  placeholder = '',
  options = [],
  readOnly = false,
  button,
}: OptionFieldProps<T>) {
  const inputProps = {
    id: label,
    value,
    onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
      onChange(e.target.value),
    placeholder,
    readOnly,
    className: 'flex-grow',
  }

  return (
    <div className="space-y-2">
      <Label htmlFor={label}>{label}</Label>
      <div className="flex items-center space-x-2">
        {type === 'select' ? (
          <Select value={value} onValueChange={onChange}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent>
              {options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <Input type={type} {...inputProps} />
        )}
        {button && (
          <Button onClick={button.onClick} variant="outline" size="icon">
            <button.icon className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  )
}
