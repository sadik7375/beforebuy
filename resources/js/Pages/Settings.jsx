import React, { useState } from 'react';
import { Page, BlockStack, Card, Text, TextField, Button, Banner, InlineStack, Checkbox, Divider, Box, Badge } from '@shopify/polaris';
import { DeleteIcon, PlusIcon } from '@shopify/polaris-icons';
import { router } from '@inertiajs/react';
import AppLayout from '../Layouts/AppLayout';

export default function Settings({ reasons = [], enable_email = true, require_email = false, popup_theme = 'modern', plan = 'free' }) {
    const isPro = plan === 'pro';

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
            name: 'Standard Card List',
            description: 'Classic vertical list with radio buttons and clean borders.',
            type: 'modern',
            proOnly: false,
        },
        {
            id: 'badge_list',
            name: 'Quiz Badge Pills',
            description: 'Pill items with circular A, B, C badges and highlighted active states.',
            type: 'badge',
            proOnly: true,
        },
        {
            id: 'chips_grid',
            name: 'Horizontal Tag Chips',
            description: 'Compact side-by-side tags with checkmarks on active items.',
            type: 'chips',
            proOnly: true,
        },
        {
            id: 'dark',
            name: 'Sleek Dark Mode',
            description: 'Dark mode modal layout with glowing active selection.',
            type: 'dark',
            proOnly: true,
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

    const handleThemeSelect = (preset) => {
        setSelectedTheme(preset.id);
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
                subtitle="Customize options, email collection rules, and storefront popup design presets."
            >
                <BlockStack gap="500">
                    {saved && (
                        <Banner tone="success" onDismiss={() => setSaved(false)}>
                            <p>App settings saved successfully! Storefront popup will now reflect these options.</p>
                        </Banner>
                    )}



                    {/* 1. Pre-Defined Feedback Reasons Card */}
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

                    {/* 2. Customer Email Collection Settings Card */}
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
                        </BlockStack>
                    </Card>

                    {/* 3. Popup Design Presets Card */}
                    <Card>
                        <BlockStack gap="400">
                            <Text variant="headingMd" as="h2">Storefront Popup Option Design Layouts</Text>
                            <Text tone="subdued" variant="bodySm">
                                Choose how feedback options are formatted inside the storefront popup window.
                            </Text>

                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                                gap: '16px',
                                marginTop: '8px'
                            }}>
                                {themePresets.map((preset) => {
                                    const isSelected = selectedTheme === preset.id;
                                    const isLocked = preset.proOnly && !isPro;

                                    return (
                                        <div
                                            key={preset.id}
                                            onClick={() => handleThemeSelect(preset)}
                                            style={{
                                                border: `2px solid ${isSelected ? '#2c6ecb' : '#e1e3e5'}`,
                                                borderRadius: '12px',
                                                padding: '16px',
                                                cursor: isLocked ? 'not-allowed' : 'pointer',
                                                backgroundColor: isSelected ? '#f0f7ff' : '#ffffff',
                                                opacity: isLocked ? 0.75 : 1,
                                                transition: 'all 0.2s ease-in-out',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                justifyContent: 'space-between',
                                            }}
                                        >
                                            <div>
                                                <InlineStack align="space-between" blockAlign="center">
                                                    <Text variant="headingSm" as="h3">{preset.name}</Text>
                                                    {preset.proOnly ? (
                                                        <Badge tone="warning">Pro Only</Badge>
                                                    ) : (
                                                        <input
                                                            type="radio"
                                                            name="popup_theme_preset"
                                                            checked={isSelected}
                                                            onChange={() => handleThemeSelect(preset)}
                                                            style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                                                        />
                                                    )}
                                                </InlineStack>

                                                <Box paddingBlockStart="100">
                                                    <Text tone="subdued" variant="bodySm">{preset.description}</Text>
                                                </Box>
                                            </div>

                                            {/* Real E-commerce UI Mini Mock Preview */}
                                            <div style={{
                                                marginTop: '16px',
                                                padding: '12px',
                                                borderRadius: '8px',
                                                backgroundColor: preset.type === 'dark' ? '#0f172a' : '#f8fafc',
                                                border: `1px solid ${preset.type === 'dark' ? '#334155' : '#e2e8f0'}`,
                                            }}>
                                                {preset.type === 'modern' && (
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                                        <div style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #3b82f6', background: '#eff6ff', fontSize: '11px', color: '#1d4ed8', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#3b82f6' }}></span> High Price
                                                        </div>
                                                        <div style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #e2e8f0', background: '#fff', fontSize: '11px', color: '#475569', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                            <span style={{ width: '8px', height: '8px', borderRadius: '50%', border: '1px solid #cbd5e1' }}></span> Unsure Size
                                                        </div>
                                                    </div>
                                                )}

                                                {preset.type === 'badge' && (
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                                        <div style={{ padding: '4px 8px', borderRadius: '20px', border: '2px solid #22c55e', background: '#dcfce7', fontSize: '11px', color: '#14532d', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                            <span style={{ width: '20px', height: '20px', borderRadius: '50%', background: '#fef08a', border: '1px solid #eab308', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', color: '#854d0e', fontWeight: '800' }}>A</span> High Price
                                                        </div>
                                                        <div style={{ padding: '4px 8px', borderRadius: '20px', border: '1.5px solid #1e293b', background: '#fff', fontSize: '11px', color: '#1e293b', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                            <span style={{ width: '20px', height: '20px', borderRadius: '50%', background: '#fef08a', border: '1px solid #eab308', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', color: '#854d0e', fontWeight: '800' }}>B</span> Unsure Size
                                                        </div>
                                                    </div>
                                                )}

                                                {preset.type === 'chips' && (
                                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                                        <div style={{ padding: '5px 10px', borderRadius: '20px', border: '1px solid #22c55e', background: '#f0fdf4', fontSize: '11px', color: '#15803d', fontWeight: '600' }}>
                                                            ✓ High Price
                                                        </div>
                                                        <div style={{ padding: '5px 10px', borderRadius: '20px', border: '1px solid #cbd5e1', background: '#fff', fontSize: '11px', color: '#64748b' }}>
                                                            Shipping Fee
                                                        </div>
                                                        <div style={{ padding: '5px 10px', borderRadius: '20px', border: '1px solid #cbd5e1', background: '#fff', fontSize: '11px', color: '#64748b' }}>
                                                            Unsure Size
                                                        </div>
                                                    </div>
                                                )}

                                                {preset.type === 'dark' && (
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                                        <div style={{ padding: '6px 10px', borderRadius: '8px', border: '1px solid #6366f1', background: 'rgba(99, 102, 241, 0.2)', fontSize: '11px', color: '#a5b4fc', fontWeight: '600' }}>
                                                            • High Price
                                                        </div>
                                                        <div style={{ padding: '6px 10px', borderRadius: '8px', border: '1px solid #334155', background: '#1e293b', fontSize: '11px', color: '#94a3b8' }}>
                                                            • Unsure Size
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

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
