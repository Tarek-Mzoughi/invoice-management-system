import React from 'react';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/api';
import { BreadcrumbCommon } from '@/components/shared';
import { Spinner } from '@/components/shared';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface InterlocutorDetailsProps {
  className?: string;
  interlocutorId: string;
}

export const InterlocutorDetails: React.FC<InterlocutorDetailsProps> = ({
  className,
  interlocutorId
}) => {
  const {
    isPending: isFetchPending,
    error,
    data: interlocutor
  } = useQuery({
    queryKey: ['interlocutor', interlocutorId],
    queryFn: () => api.interlocutor.findOne(parseInt(interlocutorId))
  });

  if (error) return 'An error has occurred: ' + error.message;
  if (isFetchPending || !interlocutor)
    return <Spinner className="h-screen" show={isFetchPending} />;
  return (
    <div className={cn('overflow-auto p-8', className)}>
      <BreadcrumbCommon
        hierarchy={[
          { title: 'Contacts', href: '/contacts' },
          { title: 'Entreprise', href: '/contacts/interlocutor' },
          { title: interlocutor?.name || '' }
        ]}
      />
      <div>
        <Tabs defaultValue="overview" className={cn('', className)}>
          <TabsList className="grid grid-cols-1 md:grid-cols-3 w-full h-fit">
            <TabsTrigger value="overview">Aperçu Général</TabsTrigger>
            <TabsTrigger value="quotations">Devis</TabsTrigger>
            <TabsTrigger value="invoices">Factures</TabsTrigger>
          </TabsList>
          <TabsContent value="overview"></TabsContent>
          <TabsContent value="quotations"></TabsContent>
          <TabsContent value="invoices"></TabsContent>
        </Tabs>
      </div>
    </div>
  );
};
