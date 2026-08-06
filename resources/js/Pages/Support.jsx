import React from 'react';
import { Page, BlockStack, Card, Text, FormLayout, TextField, Button, Banner, List } from '@shopify/polaris';
import AppLayout from '../Layouts/AppLayout';

export default function Support() {
    return (
        <AppLayout>
            <Page
                fullWidth
                title="Merchant Support & Help"
                subtitle="We are here to help you get the most out of BeforeBuy Feedback."
            >
                <BlockStack gap="500">
                    <Card>
                        <BlockStack gap="400">
                            <Text variant="headingMd" as="h2">Frequently Asked Questions</Text>
                            <List type="bullet">
                                <List.Item>
                                    <strong>Where does the feedback popup appear?</strong><br/>
                                    It appears on product pages when a visitor clicks the feedback button.
                                </List.Item>
                                <List.Item>
                                    <strong>How do I give discounts to customers?</strong><br/>
                                    You can set a reward discount code in the <strong>Settings</strong> tab.
                                </List.Item>
                            </List>
                        </BlockStack>
                    </Card>

                    <Card>
                        <BlockStack gap="400">
                            <Text variant="headingMd" as="h2">Contact Support Team</Text>
                            <Text tone="subdued" variant="bodySm">Have questions or need help setting up? Send us a message.</Text>
                            <FormLayout>
                                <TextField label="Your Email Address" autoComplete="email" placeholder="merchant@yourstore.com" />
                                <TextField label="How can we help?" multiline={4} autoComplete="off" placeholder="Describe your issue or question..." />
                                <Button variant="primary" onClick={() => alert('Message sent! Our support team will get back to you shortly.')}>
                                    Send Support Message
                                </Button>
                            </FormLayout>
                        </BlockStack>
                    </Card>
                </BlockStack>
            </Page>
        </AppLayout>
    );
}
