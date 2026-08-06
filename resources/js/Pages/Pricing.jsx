import React from 'react';
import { Page, BlockStack, Card, Text, Grid, Button, Badge, List, Box } from '@shopify/polaris';
import AppLayout from '../Layouts/AppLayout';

export default function Pricing({ current_plan = 'Free Trial' }) {
    const plans = [
        {
            name: 'Free Trial',
            price: '$0',
            period: '/ month',
            description: 'Essential feedback collection for growing stores.',
            features: ['Up to 50 feedback submissions / month', 'Standard popup modal', 'Basic analytics dashboard'],
            current: true,
        },
        {
            name: 'Pro Starter',
            price: '$9.99',
            period: '/ month',
            description: 'Advanced AI insights and unlimited feedback logs.',
            features: ['Unlimited feedback submissions', 'AI Summary Engine enabled', 'Custom discount reward codes', 'Priority email support'],
            current: false,
        },
        {
            name: 'Growth Enterprise',
            price: '$29.99',
            period: '/ month',
            description: 'Complete suite for high-volume Shopify Plus stores.',
            features: ['Everything in Pro Starter', 'Custom CSS styling for storefront', 'Automated discount generation', '1-on-1 onboarding support'],
            current: false,
        },
    ];

    return (
        <AppLayout>
            <Page
                title="Price Plans & Billing"
                subtitle="Choose the right plan to unlock AI insights and recover lost store sales."
            >
                <Grid>
                    {plans.map((plan) => (
                        <Grid.Cell key={plan.name} columnSpan={{ xs: 6, sm: 4, md: 4, lg: 4, xl: 4 }}>
                            <Card padding="500">
                                <BlockStack gap="400">
                                    <BlockStack gap="100">
                                        <Text variant="headingLg" as="h3">{plan.name}</Text>
                                        {plan.current && <Badge tone="success">Current Plan</Badge>}
                                    </BlockStack>
                                    
                                    <Text variant="heading2xl" as="h2">{plan.price} <Text as="span" variant="bodySm" tone="subdued">{plan.period}</Text></Text>
                                    <Text tone="subdued" variant="bodySm">{plan.description}</Text>

                                    <Box paddingBlockStart="200">
                                        <List type="bullet">
                                            {plan.features.map((feature, i) => (
                                                <List.Item key={i}>{feature}</List.Item>
                                            ))}
                                        </List>
                                    </Box>

                                    <Button variant={plan.current ? 'secondary' : 'primary'} disabled={plan.current}>
                                        {plan.current ? 'Active Plan' : `Upgrade to ${plan.name}`}
                                    </Button>
                                </BlockStack>
                            </Card>
                        </Grid.Cell>
                    ))}
                </Grid>
            </Page>
        </AppLayout>
    );
}
