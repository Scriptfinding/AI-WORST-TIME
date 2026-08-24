import React, { useState } from 'react';
import { useForm, usePage } from '@inertiajs/react';
import { Icon } from '@/Shared/UI/Icon/Icon';
import AuthLayout from '@/App/Layout/AuthLayout/AuthLayout';
import Button from '@/Shared/UI/Button/Button';
import Input from '@/Shared/UI/Input/Input';
import * as S from './styled.pp';

interface LicenseStatus {
    active: boolean;
    status: string;
    message?: string;
    plan?: string;
    file?: {
        imported_at?: string | null;
        issued_at?: string | null;
        plan?: string | null;
        reference?: string | null;
    } | null;
}

interface PageProps {
    version: string;
    license: LicenseStatus;
    community_license_available: boolean;
    flash?: {
        success?: string;
        error?: string;
    };
    [key: string]: unknown;
}

export default function Launcher() {
    const { community_license_available: communityLicenseAvailable, flash, version } = usePage<PageProps>().props;
    const [dragging, setDragging] = useState(false);
    const [communityMode, setCommunityMode] = useState(false);
    const form = useForm<{ license_file: File | null }>({
        license_file: null,
    });
    const communityForm = useForm<{ email: string }>({
        email: '',
    });

    const handleSubmit = (event: React.FormEvent) => {
        event.preventDefault();
        form.post('/license', {
            forceFormData: true,
            preserveScroll: true,
        });
    };

    const handleDrop = (event: React.DragEvent<HTMLLabelElement>) => {
        event.preventDefault();
        setDragging(false);
        const file = event.dataTransfer.files?.[0];
        if (file) form.setData('license_file', file);
    };

    const handleCommunitySubmit = (event: React.FormEvent) => {
        event.preventDefault();
        communityForm.post('/license/community', {
            preserveScroll: true,
            onSuccess: (page) => {
                const responseFlash = page.props.flash;
                if (
                    responseFlash
                    && typeof responseFlash === 'object'
                    && 'success' in responseFlash
                    && responseFlash.success
                ) {
                    setCommunityMode(false);
                    communityForm.reset();
                }
            },
        });
    };

    return (
        <AuthLayout
            title={communityMode ? 'Free Community license' : 'Activate Puppetflow'}
            subtitle={communityMode
                ? 'Enter your email and we will send you a secure link to create and download your license.'
                : 'Upload your signed license file (.license or the downloaded .zip) to unlock this instance.'}
            footer={`Version ${version}`}
        >
            <S.Panel>
                {flash?.success && <S.Flash $variant="success">{flash.success}</S.Flash>}
                {flash?.error && <S.Flash $variant="error">{flash.error}</S.Flash>}

                {communityMode ? (
                    <S.Form onSubmit={handleCommunitySubmit}>
                        <Input
                            label="Email"
                            type="email"
                            value={communityForm.data.email}
                            error={communityForm.errors.email}
                            autoComplete="email"
                            autoFocus
                            required
                            onChange={(event) => communityForm.setData('email', event.target.value)}
                        />
                        <Button type="submit" fullWidth loading={communityForm.processing}>
                            Send my license link
                        </Button>
                        <Button type="button" variant="ghost" fullWidth onClick={() => setCommunityMode(false)}>
                            Back to file upload
                        </Button>
                    </S.Form>
                ) : (
                    <>
                        <S.Form onSubmit={handleSubmit}>
                            <S.DropZone
                                $dragging={dragging}
                                $hasFile={!!form.data.license_file}
                                onDragOver={(event) => { event.preventDefault(); setDragging(true); }}
                                onDragLeave={() => setDragging(false)}
                                onDrop={handleDrop}
                            >
                                <Icon icon={form.data.license_file ? 'lucide:file-check-2' : 'lucide:upload-cloud'} width={24} />
                                <S.DropTitle>
                                    {form.data.license_file ? form.data.license_file.name : (
                                        <>
                                            Drop your license file here
                                            <br />
                                            (.license or downloaded .zip)
                                        </>
                                    )}
                                </S.DropTitle>
                                <S.DropHint>
                                    {form.data.license_file ? 'Click to choose a different file' : 'or click to browse'}
                                </S.DropHint>
                                <S.HiddenFileInput
                                    type="file"
                                    accept=".license,.licence,.zip,application/zip,application/octet-stream,text/plain"
                                    onClick={(event) => { event.currentTarget.value = ''; }}
                                    onChange={(event) => {
                                        const file = event.target.files?.[0];
                                        if (file) form.setData('license_file', file);
                                    }}
                                />
                            </S.DropZone>
                            {form.errors.license_file && <S.FieldError>{form.errors.license_file}</S.FieldError>}
                            <Button type="submit" fullWidth loading={form.processing} disabled={!form.data.license_file}>
                                Upload and activate
                            </Button>
                        </S.Form>

                        {communityLicenseAvailable && (
                            <>
                                <S.Divider><span>or</span></S.Divider>
                                <Button type="button" variant="secondary" fullWidth onClick={() => setCommunityMode(true)}>
                                    Get a Free Activation License
                                </Button>
                            </>
                        )}
                    </>
                )}
            </S.Panel>
        </AuthLayout>
    );
}
