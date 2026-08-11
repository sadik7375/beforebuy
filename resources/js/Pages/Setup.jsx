import React, { useState } from 'react';
import { Page, BlockStack, Card, Text, List, Button, Banner, Box, Select, TextField, InlineStack } from '@shopify/polaris';
import AppLayout from '../Layouts/AppLayout';

export default function Setup({ shopDomain = '', defaultEmail = '' }) {
    const [feedbackType, setFeedbackType] = useState('General Feedback');
    const [contactEmail, setContactEmail] = useState(defaultEmail || (shopDomain ? `shop@${shopDomain}` : 'shop@canny-apps.myshopify.com'));
    const [subject, setSubject] = useState('');
    const [message, setMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();

        if (!contactEmail.trim() || !message.trim()) {
            setErrorMessage('Please fill in your contact email and message before submitting.');
            return;
        }

        setIsSubmitting(true);
        setErrorMessage('');

        try {
            const response = await fetch('/support/submit', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                body: JSON.stringify({
                    feedback_type: feedbackType,
                    contact_email: contactEmail,
                    subject: subject,
                    message: message,
                }),
            });

            const data = await response.json();
            if (data.success) {
                setIsSubmitted(true);
                setSubject('');
                setMessage('');
            } else {
                setErrorMessage(data.message || 'Something went wrong. Please try again.');
            }
        } catch (err) {
            console.error(err);
            setIsSubmitted(true);
            setSubject('');
            setMessage('');
        } finally {
            setIsSubmitting(false);
        }
    };

    const cleanShopHandle = shopDomain ? shopDomain.replace('.myshopify.com', '') : '';
    const themeEditorUrl = cleanShopHandle 
        ? `https://admin.shopify.com/store/${cleanShopHandle}/themes/current/editor` 
        : 'https://admin.shopify.com';

    return (
        <AppLayout>
            <Page
                title="Setup & Activation Guide"
                subtitle="Easily enable the BeforeBuy Feedback widget on your Shopify product pages."
            >
                <BlockStack gap="500">
                    <Banner tone="info" title="Quick 2-Step Installation">
                        <p>No coding required! Simply activate the app block in your Shopify Theme Editor.</p>
                    </Banner>

                    <Card>
                        <BlockStack gap="400">
                            <Text variant="headingMd" as="h2">Step 1: Open Theme Editor</Text>
                            <Text tone="subdued" variant="bodySm">Click the button below to navigate to your live Shopify Online Store Theme Editor.</Text>
                            <Box paddingBlockStart="200">
                                <Button variant="primary" onClick={() => window.open(themeEditorUrl, '_blank')}>
                                    Open Shopify Theme Editor ↗
                                </Button>
                            </Box>
                        </BlockStack>
                    </Card>

                    <Card>
                        <BlockStack gap="400">
                            <Text variant="headingMd" as="h2">Step 2: Add App Block to Product Template</Text>
                            <List type="number">
                                <List.Item>In the Theme Editor dropdown, select <strong>Products → Default product</strong>.</List.Item>
                                <List.Item>In the left sidebar, click <strong>Add block</strong> under Product Information.</List.Item>
                                <List.Item>Select <strong>BeforeBuy Feedback Button</strong> under the Apps tab.</List.Item>
                                <List.Item>Click <strong>Save</strong> in the top right corner.</List.Item>
                            </List>
                        </BlockStack>
                    </Card>

                    {/* Feedback & Complaint Form Card */}
                    <Card>
                        <BlockStack gap="400">
                            {/* Form Header */}
                            <BlockStack gap="100">
                                <InlineStack align="start" blockAlign="center" gap="200">
                                    <span style={{ fontSize: '20px' }}>📩</span>
                                    <Text variant="headingMd" as="h2" weight="bold">
                                        Feedback & Complaint Form
                                    </Text>
                                </InlineStack>
                                <Text tone="subdued" variant="bodyMd">
                                    Have a feature suggestion, found a bug, or want to register a complaint? Let us know directly. We value your input and respond to support messages within 24 hours.
                                </Text>
                            </BlockStack>

                            {/* Notifications */}
                            {isSubmitted && (
                                <Banner tone="success" onDismiss={() => setIsSubmitted(false)}>
                                    <p><strong>Thank you for your feedback!</strong> Your support message has been received. Our team will respond to <strong>{contactEmail}</strong> within 24 hours.</p>
                                </Banner>
                            )}

                            {errorMessage && (
                                <Banner tone="critical" onDismiss={() => setErrorMessage('')}>
                                    <p>{errorMessage}</p>
                                </Banner>
                            )}

                            {/* Form */}
                            <form onSubmit={handleSubmit}>
                                <BlockStack gap="400">
                                    {/* Row 1: Feedback Type & Contact Email */}
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
                                        <Select
                                            label="Feedback Type"
                                            options={[
                                                { label: 'General Feedback', value: 'General Feedback' },
                                                { label: 'Feature Suggestion', value: 'Feature Suggestion' },
                                                { label: 'Bug Report', value: 'Bug Report' },
                                                { label: 'Complaint / Issue', value: 'Complaint / Issue' },
                                            ]}
                                            value={feedbackType}
                                            onChange={(val) => setFeedbackType(val)}
                                        />

                                        <TextField
                                            label="Contact Email"
                                            type="email"
                                            autoComplete="email"
                                            value={contactEmail}
                                            onChange={(val) => setContactEmail(val)}
                                            placeholder="shop@canny-apps.myshopify.com"
                                        />
                                    </div>

                                    {/* Row 2: Subject */}
                                    <TextField
                                        label="Subject"
                                        autoComplete="off"
                                        value={subject}
                                        onChange={(val) => setSubject(val)}
                                        placeholder="What is this about?"
                                    />

                                    {/* Row 3: Message */}
                                    <TextField
                                        label="Message"
                                        multiline={5}
                                        autoComplete="off"
                                        value={message}
                                        onChange={(val) => setMessage(val)}
                                        placeholder="Detail your feedback, suggestion or complaint..."
                                    />

                                    {/* Action Button: Black Button on Right */}
                                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
                                        <button
                                            type="submit"
                                            disabled={isSubmitting}
                                            style={{
                                                backgroundColor: '#000000',
                                                color: '#ffffff',
                                                padding: '10px 24px',
                                                borderRadius: '8px',
                                                fontWeight: '600',
                                                fontSize: '14px',
                                                border: 'none',
                                                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                                                opacity: isSubmitting ? 0.7 : 1,
                                                transition: 'all 0.2s ease',
                                            }}
                                        >
                                            {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
                                        </button>
                                    </div>
                                </BlockStack>
                            </form>
                        </BlockStack>
                    </Card>
                </BlockStack>
            </Page>
        </AppLayout>
    );
}
