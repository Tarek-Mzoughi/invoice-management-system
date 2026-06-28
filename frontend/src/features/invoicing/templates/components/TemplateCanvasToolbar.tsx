import { Grid2X2, Maximize2, ZoomIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { TemplatePageSettings } from '@/types';
import { useTranslation } from 'react-i18next';

interface TemplateCanvasToolbarProps {
  pageSettings: TemplatePageSettings;
  zoom: number;
  showGrid: boolean;
  onZoomChange: (zoom: number) => void;
  onFitWidth: () => void;
  onToggleGrid: (value: boolean) => void;
  onPageSettingsChange: (pageSettings: TemplatePageSettings) => void;
}

export const TemplateCanvasToolbar = ({
  pageSettings,
  zoom,
  showGrid,
  onZoomChange,
  onFitWidth,
  onToggleGrid,
  onPageSettingsChange
}: TemplateCanvasToolbarProps) => {
  const { t: tSettings } = useTranslation('settings');
  const pageMode = pageSettings.orientation === 'landscape' ? 'A4-landscape' : 'A4-portrait';

  const updatePageMode = (value: string) => {
    const landscape = value === 'A4-landscape';
    onPageSettingsChange({
      ...pageSettings,
      format: 'A4',
      orientation: landscape ? 'landscape' : 'portrait',
      width: landscape ? 297 : 210,
      height: landscape ? 210 : 297
    });
  };

  return (
    <div className="flex min-h-12 flex-wrap items-center justify-between gap-3 border-b border-zinc-200 bg-white px-4 py-2 dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex flex-wrap items-center gap-2">
        <Select value={pageMode} onValueChange={updatePageMode}>
          <SelectTrigger className="h-8 w-[150px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="A4-portrait">{tSettings('pdf_editor.toolbar.portrait')}</SelectItem>
            <SelectItem value="A4-landscape">{tSettings('pdf_editor.toolbar.landscape')}</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex items-center gap-2 rounded-md border border-zinc-200 px-2 py-1 dark:border-zinc-800">
          <Grid2X2 className="h-4 w-4 text-zinc-500" />
          <span className="text-xs text-zinc-500">{tSettings('pdf_editor.toolbar.grid')}</span>
          <Switch checked={showGrid} onCheckedChange={onToggleGrid} className="h-5 w-9" />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-1">
        {[0.5, 0.75, 1].map((preset) => (
          <Button
            key={preset}
            type="button"
            variant={zoom === preset ? 'default' : 'outline'}
            size="sm"
            className="h-8"
            onClick={() => onZoomChange(preset)}
          >
            {Math.round(preset * 100)}%
          </Button>
        ))}
        <Button type="button" variant="outline" size="sm" className="h-8" onClick={onFitWidth}>
          <Maximize2 className="h-4 w-4" />
          {tSettings('pdf_editor.toolbar.fit_width')}
        </Button>
        <div className="ml-2 flex items-center gap-1 text-xs text-zinc-500">
          <ZoomIn className="h-3.5 w-3.5" />
          {Math.round(zoom * 100)}%
        </div>
      </div>
    </div>
  );
};
