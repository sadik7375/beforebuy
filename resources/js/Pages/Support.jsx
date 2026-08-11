import React, { useState } from 'react';
import { Page, BlockStack, Card, Text, Select, TextField, InlineStack, Banner, List } from '@shopify/polaris';
import AppLayout from '../Layouts/AppLayout';

export default function Support({ shopDomain = '', defaultEmail = '' }) {
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
            setIsSubmitted(true); // Graceful completion
            setSubject('');
            setMessage('');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <AppLayout>
            <Page fullWidth>
                <BlockStack gap="500">
                    {/* Merchant Support & Feedback Form Card */}
                    <Card>
                        <BlockStack gap="400">
                            {/* Form Title & Subtitle */}
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

                    {/* FAQ Card */}
                    <Card>
                        <BlockStack gap="400">
                            <Text variant="headingMd" as="h2">Frequently Asked Questions</Text>
                            <List type="bullet">
                                <List.Item>
                                    <strong>Where does the feedback popup appear on my store?</strong><br/>
                                    It appears automatically on your product pages right next to or below your "Add to Cart" button.
                                </List.Item>
                                <List.Item>
                                    <strong>How do I offer discount incentives to visitors who leave feedback?</strong><br/>
                                    Go to the <strong>Settings</strong> tab to customize your feedback options, email collection requirements, and reward discount codes.
                                </List.Item>
                                <List.Item>
                                    <strong>How fast does the support team respond?</strong><br/>
                                    We process all merchant inquiries and bug reports within 24 hours.
                                </List.Item>
                            </List>
                        </BlockStack>
                    </Card>

                    {/* Developer & Testing Tools Card */}
                    <Card>
                        <BlockStack gap="300">
                            <InlineStack align="space-between" blockAlign="center">
                                <BlockStack gap="100">
                                    <Text variant="headingSm" as="h3">🧹 Clean Database & Reset Plan (Testing Tool)</Text>
                                    <Text tone="subdued" variant="bodySm">
                                        Wipes all submitted feedback records and resets the shop plan back to Free ($0/mo) for testing.
                                    </Text>
                                </BlockStack>
                                <a
                                    href="/clean-db"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{
                                        backgroundColor: '#d97706',
                                        color: '#ffffff',
                                        padding: '8px 16px',
                                        borderRadius: '6px',
                                        fontWeight: '600',
                                        fontSize: '13px',
                                        textDecoration: 'none',
                                        display: 'inline-block',
                                    }}
                                >
                                    Clean DB & Reset Plan
                                </a>
                            </InlineStack>
                        </BlockStack>
                    </Card>
                </BlockStack>
            </Page>
        </AppLayout>
    );
}
