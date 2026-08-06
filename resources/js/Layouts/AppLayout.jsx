import React from 'react';

export default function AppLayout({ children }) {
    return (
        <>
            <ui-nav-menu>
                <a href="/" rel="home">Overview</a>
                <a href="/submissions">Feedback Submissions</a>
                <a href="/settings">Settings</a>
                <a href="/pricing">Price Plan</a>
                <a href="/setup">Setup Guide</a>
                <a href="/support">Support</a>
            </ui-nav-menu>
            {children}
        </>
    );
}
