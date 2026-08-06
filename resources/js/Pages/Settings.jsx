import React, { useState } from 'react';
import { Page, BlockStack, Card, Text, FormLayout, TextField, Button, Banner } from '@shopify/polaris';
import AppLayout from '../Layouts/AppLayout';

export default function Settings({ reasons = [], discount_code = '' }) {
    const [reason1, setReason1] = useState(reasons[0] || 'Price is higher than expected');
    const [reason2, setReason2] = useState(reasons[1] || 'Unsure about size / fit / dimensions');
    const [reason3, setReason3] = useState(reasons[2] || 'Shipping fee or delivery time is too high');
    const [reason4, setReason4] = useState(reasons[3] || 'Product information or reviews missing');
    const [discountCode, setDiscountCode] = useState(discount_code || 'BEFOREBUY10');
    const [saved, setSaved] = useState(false);

    const handleSave = () => {
        setSaved(true);
        setTimeout(() => setSaved(false), 4000);
    };

    return (
        <AppLayout>
            <Page
                title="App Settings & Reasons"
                subtitle="Customize objection choices and reward discounts displayed to store visitors."
            >
                <BlockStack gap="500">
                    {saved && (
                        <Banner tone="success" onDismiss={() => setSaved(false)}>
                            <p>Settings saved successfully!</p>
                        </Banner>
                    )}

                    <Card>
                        <BlockStack gap="400">
                            <Text variant="headingMd" as="h2">Pre-Defined Feedback Reasons</Text>
                            <Text tone="subdued" variant="bodySm">Customize choices shown to customers when they click the feedback button on product pages.</Text>

                            <FormLayout>
                                <TextField label="Reason Option 1" value={reason1} onChange={setReason1} autoComplete="off" />
                                <TextField label="Reason Option 2" value={reason2} onChange={setReason2} autoComplete="off" />
                                <TextField label="Reason Option 3" value={reason3} onChange={setReason3} autoComplete="off" />
                                <TextField label="Reason Option 4" value={reason4} onChange={setReason4} autoComplete="off" />
                            </FormLayout>
                        </BlockStack>
                    </Card>

                    <Card>
                        <BlockStack gap="400">
                            <Text variant="headingMd" as="h2">Reward Discount Code</Text>
                            <Text tone="subdued" variant="bodySm">Optional discount code shown to customers after submitting feedback.</Text>
                            <FormLayout>
                                <TextField label="Discount Code" value={discountCode} onChange={setDiscountCode} autoComplete="off" />
                                <Button variant="primary" onClick={handleSave}>Save Settings</Button>
                            </FormLayout>
                        </BlockStack>
                    </Card>
                </BlockStack>
            </Page>
        </AppLayout>
    );
}
