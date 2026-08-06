import React, { useState } from 'react';
import { Page, BlockStack, Card, Text, TextField, Button, Banner, InlineStack, Checkbox, Divider } from '@shopify/polaris';
import { DeleteIcon, PlusIcon } from '@shopify/polaris-icons';
import { router } from '@inertiajs/react';
import AppLayout from '../Layouts/AppLayout';

export default function Settings({ reasons = [], enable_email = true, require_email = false }) {
    const defaultReasons = [
        'Price is higher than expected',
        'Unsure about size / fit / dimensions',
        'Shipping fee or delivery time is too high',
        'Product information or reviews missing',
    ];

    const [reasonList, setReasonList] = useState(reasons.length > 0 ? reasons : defaultReasons);
    const [collectEmail, setCollectEmail] = useState(enable_email);
    const [isEmailRequired, setIsEmailRequired] = useState(require_email);

    const [saved, setSaved] = useState(false);
    const [saving, setSaving] = useState(false);

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
                subtitle="Customize choices and email collection options shown in the storefront popup."
            >
                <BlockStack gap="500">
                    {saved && (
                        <Banner tone="success" onDismiss={() => setSaved(false)}>
                            <p>App settings saved successfully! Storefront popup will now show these options.</p>
                        </Banner>
                    )}

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
