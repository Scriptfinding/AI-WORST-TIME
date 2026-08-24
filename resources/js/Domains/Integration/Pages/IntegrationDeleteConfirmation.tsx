import type { ReactNode } from 'react';

interface Props {
    integrationName: string;
    usageContent: ReactNode;
}

export default function IntegrationDeleteConfirmation({ integrationName, usageContent }: Props) {
    return (
        <>
            Are you sure you want to delete "{integrationName}"?
            {usageContent}
        </>
    );
}
