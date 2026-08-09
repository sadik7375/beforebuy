import React, { useState } from 'react';
import { Page, BlockStack, Card, Text, TextField, Button, Banner, InlineStack, Checkbox, Divider, Box } from '@shopify/polaris';
import { DeleteIcon, PlusIcon } from '@shopify/polaris-icons';
import { router } from '@inertiajs/react';
import AppLayout from '../Layouts/AppLayout';

export default function Settings({ reasons = [], enable_email = true, require_email = false, popup_theme = 'modern' }) {
    const defaultReasons = [
        'Price is higher than expected',
        'Unsure about size / fit / dimensions',
        'Shipping fee or delivery time is too high',
        'Product information or reviews missing',
    ];

    const [reasonList, setReasonList] = useState(reasons.length > 0 ? reasons : defaultReasons);
    const [collectEmail, setCollectEmail] = useState(enable_email);
    const [isEmailRequired, setIsEmailRequired] = useState(require_email);
    const [selectedTheme, setSelectedTheme] = useState(popup_theme || 'modern');

    const [saved, setSaved] = useState(false);
    const [saving, setSaving] = useState(false);

    const themePresets = [
        {
            id: 'modern',
            name: 'Modern Standard',
            description: 'Clean white background, soft shadow, balanced rounded corners.',
            badgeBg: '#ffffff',
            badgeBorder: '#e2e8f0',
            badgeText: '#1e293b',
            accent: '#3b82f6',
        },
        {
            id: 'minimal',
            name: 'Minimalist Flat',
            description: 'Crisp flat borders, zero shadow, compact spacing.',
            badgeBg: '#f8fafc',
            badgeBorder: '#cbd5e1',
            badgeText: '#0f172a',
            accent: '#0284c7',
        },
        {
            id: 'dark',
            name: 'Sleek Dark Mode',
            description: 'Rich dark slate background with glowing accent text.',
            badgeBg: '#0f172a',
            badgeBorder: '#334155',
            badgeText: '#f8fafc',
            accent: '#6366f1',
        },
        {
            id: 'pills',
            name: 'Soft Rounded Pills',
            description: 'Pill-shaped reason tags, soft pastel selection highlights.',
            badgeBg: '#faf5ff',
            badgeBorder: '#e9d5ff',
            badgeText: '#581c87',
            accent: '#8b5cf6',
        },
    ];

    const handleReasonChange = (index, newValue) => {
        const updated = [...reasonList];
        updated[index] = newValue;
        setReasonList(updated);
    };

    const handleAddReason = () => {
        setReasonList([...reasonList, '']);
    };

    const handleRemoveReason = (indexToRemove) => {
        if (reasonList.length <= 1) {
            alert('You must keep at least one feedback reason option.');
            return;
        }
        setReasonList(reasonList.filter((_, index) => index !== indexToRemove));
    };

    const handleSave = () => {
        setSaving(true);
        const filteredReasons = reasonList.filter(r => r.trim() !== '');

        router.post('/settings/save', {
            reasons: filteredReasons,
            enable_email: collectEmail,
            require_email: isEmailRequired,
            popup_theme: selectedTheme,
        }, {
            preserveState: true,
            preserveScroll: true,
            onSuccess: () => {
                setSaving(false);
                setSaved(true);
                setTimeout(() => setSaved(false), 4000);
            },
            onError: (errors) => {
                console.error('Settings save error:', errors);
                setSaving(false);
                setSaved(true);
                setTimeout(() => setSaved(false), 4000);
            },
            onFinish: () => setSaving(false)
        });
    };

    return (
        <AppLayout>
            <Page
                title="App Settings & Reasons"
                subtitle="Customize options, popup theme design presets, and email collection rules."
            >
                <BlockStack gap="500">
                    {saved && (
                        <Banner tone="success" onDismiss={() => setSaved(false)}>
                            <p>App settings saved successfully! Storefront popup will now reflect these options.</p>
                        </Banner>
                    )}

                    {/* Popup Theme Presets Card */}
                    <Card>
                        <BlockStack gap="400">
                            <Text variant="headingMd" as="h2">Storefront Popup Design Presets</Text>
                            <Text tone="subdued" variant="bodySm">
                                Select a visual style template for your feedback modal window.
                            </Text>

                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                                gap: '16px',
                                marginTop: '8px'
                            }}>
                                {themePresets.map((preset) => {
                                    const isSelected = selectedTheme === preset.id;
                                    return (
                                        <div
                                            key={preset.id}
                                            onClick={() => setSelectedTheme(preset.id)}
                                            style={{
                                                border: `2px solid ${isSelected ? '#2c6ecb' : '#e1e3e5'}`,
                                                borderRadius: '12px',
                                                padding: '16px',
                                                cursor: 'pointer',
                                                backgroundColor: isSelected ? '#f0f7ff' : '#ffffff',
                                                transition: 'all 0.2s ease-in-out',
                                                position: 'relative',
                                            }}
                                        >
                                            <InlineStack align="space-between" blockAlign="center">
                                                <Text variant="headingSm" as="h3">{preset.name}</Text>
                                                <input
                                                    type="radio"
                                                    name="popup_theme_preset"
                                                    checked={isSelected}
                                                    onChange={() => setSelectedTheme(preset.id)}
                                                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                                                />
                                            </InlineStack>

                                            <Box paddingBlockStart="200">
                                                <Text tone="subdued" variant="bodySm">{preset.description}</Text>
                                            </Box>

                                            {/* Visual Preview Badge */}
                                            <div style={{
                                                marginTop: '12px',
                                                padding: '10px 14px',
                                                borderRadius: preset.id === 'pills' ? '20px' : '6px',
                                                backgroundColor: preset.badgeBg,
                                                border: `1px solid ${preset.badgeBorder}`,
                                                color: preset.badgeText,
                                                fontSize: '12px',
                                                fontWeight: '600',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justify: 'space-between',
                                                boxShadow: preset.id === 'modern' ? '0 4px 6px -1px rgba(0, 0, 0, 0.05)' : 'none',
                                            }}>
                                                <span>Preview Style</span>
                                                <span style={{
                                                    width: '8px',
                                                    height: '8px',
                                                    borderRadius: '50%',
                                                    backgroundColor: preset.accent
                                                }}></span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </BlockStack>
                    </Card>

                    {/* Pre-Defined Feedback Reasons Card */}
                    <Card>
                        <BlockStack gap="400">
                            <Text variant="headingMd" as="h2">Pre-Defined Feedback Reasons</Text>
                            <Text tone="subdued" variant="bodySm">
                                Dynamically add or remove reason options shown in the storefront feedback popup.
                            </Text>

                            <BlockStack gap="300">
                                {reasonList.map((reason, index) => (
                                    <InlineStack key={index} align="space-between" blockAlign="center" gap="300">
                                        <div style={{ flexGrow: 1 }}>
                                            <TextField
                                                label={`Reason Option ${index + 1}`}
                                                labelHidden
                                                placeholder={`Reason Option ${index + 1}`}
                                                value={reason}
                                                onChange={(val) => handleReasonChange(index, val)}
                                                autoComplete="off"
                                            />
                                        </div>
                                        <Button
                                            tone="critical"
                                            variant="tertiary"
                                            icon={DeleteIcon}
                                            accessibilityLabel="Remove reason"
                                            onClick={() => handleRemoveReason(index)}
                                        />
                                    </InlineStack>
                                ))}
                            </BlockStack>

                            <InlineStack align="space-between" blockAlign="center">
                                <Button icon={PlusIcon} onClick={handleAddReason}>
                                    Add New Reason Option
                                </Button>
                            </InlineStack>
                        </BlockStack>
                    </Card>

                    {/* Customer Email Collection Settings Card */}
                    <Card>
                        <BlockStack gap="400">
                            <Text variant="headingMd" as="h2">Customer Contact & Email Collection</Text>
                            <Text tone="subdued" variant="bodySm">
                                Control whether an email address field is displayed in the popup and if it is mandatory.
                            </Text>

                            <BlockStack gap="300">
                                <Checkbox
                                    label="Collect customer email address in feedback popup"
                                    checked={collectEmail}
                                    onChange={(newVal) => {
                                        setCollectEmail(newVal);
                                        if (!newVal) setIsEmailRequired(false);
                                    }}
                                    helpText="Adds an email input field to the feedback popup so customers can leave their contact info."
                                />

                                {collectEmail && (
                                    <div style={{ paddingLeft: '24px' }}>
                                        <Checkbox
                                            label="Make Email Address Required / Mandatory"
                                            checked={isEmailRequired}
                                            onChange={(newVal) => setIsEmailRequired(newVal)}
                                            helpText="If checked, customers must provide a valid email before submitting feedback."
                                        />
                                    </div>
                                )}
                            </BlockStack>

                            <Divider />

                            <InlineStack align="end">
                                <Button variant="primary" loading={saving} onClick={handleSave}>
                                    Save Settings
                                </Button>
                            </InlineStack>
                        </BlockStack>
                    </Card>
                </BlockStack>
            </Page>
        </AppLayout>
    );
}
