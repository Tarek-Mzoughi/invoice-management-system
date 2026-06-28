import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Cross2Icon } from '@radix-ui/react-icons';
import { useActivityActions } from './ActionDialogContext';
import { Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export function DataTableToolbar() {
  const { t: tCommon } = useTranslation('common');
  const { t: tSettings } = useTranslation('settings');

  const { page, size, searchTerm, setPage, setSize, setSearchTerm, openCreateDialog } =
    useActivityActions();
  return (
    <div className="flex items-center justify-between gap-2">
      <div className="flex flex-1 items-center space-x-2">
        <Input
          placeholder={tCommon('table.filter_placeholder', {
            entity: tSettings('activity.plural')
          })}
          value={searchTerm.toString()}
          onChange={(event) => setSearchTerm(event.target.value)}
          className="h-8 w-[150px] lg:w-[300px]"
        />
        {(searchTerm || page != 1 || size != 5) && (
          <Button
            variant="ghost"
            onClick={() => {
              setSearchTerm('');
              setPage(1);
              setSize(5);
            }}
            className="h-8 px-2 lg:px-3">
            {tCommon('commands.reset')}
            <Cross2Icon className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
      <Button variant="default" onClick={() => openCreateDialog()} className="h-8 px-2 lg:px-3">
        <Plus className="mr-2 h-4 w-4" />
        {tSettings('activity.add_button_label')}
      </Button>
    </div>
  );
}
