import { ChevronRight, type LucideIcon } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  sidebarMenuButtonVariants
} from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/router';

type NavSubItem = {
  title: string;
  url: string;
  icon?: LucideIcon;
  isActive?: boolean;
  disabled?: boolean;
};

type NavItem = {
  id: number;
  title: string;
  url: string;
  icon?: LucideIcon;
  isActive?: boolean;
  disabled?: boolean;
  items?: NavSubItem[];
};

export function MainNav({
  items
}: {
  items: NavItem[];
}) {
  const router = useRouter();
  const navigateTo = (url: string) => {
    if (!url || url === '#') return;
    router.push(url);
  };

  return (
    <SidebarGroup>
      <SidebarMenu>
        {items.map((item) =>
          item.items && item.items.length > 0 ? (
            <SidebarMenuItem key={item.id}>
              <Collapsible
                defaultOpen={item.isActive}
                className="group/collapsible">
                <CollapsibleTrigger
                  data-sidebar="menu-button"
                  data-size="default"
                  data-active={item.isActive}
                  className={cn(sidebarMenuButtonVariants({ variant: 'default', size: 'default' }))}>
                    {item.icon && <item.icon />}
                    <span>{item.title}</span>
                    <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                </CollapsibleTrigger>

                <CollapsibleContent>
                  <SidebarMenuSub>
                    {item.items.map((subItem) => (
                      <SidebarMenuSubItem key={subItem.title}>
                        {subItem.disabled ? (
                          <SidebarMenuSubButton aria-disabled="true" isActive={subItem.isActive}>
                            {subItem.icon && <subItem.icon className="mr-2" />}
                            <span>{subItem.title}</span>
                          </SidebarMenuSubButton>
                        ) : (
                          <SidebarMenuSubButton
                            role="button"
                            tabIndex={0}
                            isActive={subItem.isActive}
                            onClick={() => navigateTo(subItem.url)}
                            onKeyDown={(event) => {
                              if (event.key === 'Enter' || event.key === ' ') {
                                event.preventDefault();
                                navigateTo(subItem.url);
                              }
                            }}>
                            {subItem.icon && <subItem.icon className="mr-2" />}
                            <span>{subItem.title}</span>
                          </SidebarMenuSubButton>
                        )}
                      </SidebarMenuSubItem>
                    ))}
                  </SidebarMenuSub>
                </CollapsibleContent>
              </Collapsible>
            </SidebarMenuItem>
          ) : (
            <SidebarMenuItem key={item.id}>
              {item.disabled ? (
                <SidebarMenuButton aria-disabled="true" isActive={item.isActive}>
                  {item.icon && <item.icon />}
                  <span>{item.title}</span>
                </SidebarMenuButton>
              ) : (
                <SidebarMenuButton
                  type="button"
                  isActive={item.isActive}
                  onClick={() => navigateTo(item.url)}>
                  {item.icon && <item.icon />}
                  <span>{item.title}</span>
                </SidebarMenuButton>
              )}
            </SidebarMenuItem>
          )
        )}
      </SidebarMenu>
    </SidebarGroup>
  );
}
