import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import App from './App';

import { ThemeProvider } from './components/ThemeProvider';

describe('App', () => {
    it('renders without crashing', () => {
        render(
            <ThemeProvider>
                <App />
            </ThemeProvider>
        );
        // Check if the sidebar or some main element is present
        // Since Calendar is the default page, we can check for it if it renders a title
        // Or we can just check if the main container exists
        const mainElement = screen.getByRole('main');
        expect(mainElement).toBeInTheDocument();
    });
});
