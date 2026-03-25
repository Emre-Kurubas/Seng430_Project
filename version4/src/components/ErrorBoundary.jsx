import React from 'react';

/**
 * ErrorBoundary — catches runtime exceptions in any child component tree.
 * Instead of crashing the entire page with a white screen, it shows a
 * user-friendly fallback UI and a "Try Again" button.
 *
 * Usage:
 *   <ErrorBoundary isDarkMode={isDarkMode} label="Model Training">
 *     <ModelSelection ... />
 *   </ErrorBoundary>
 */
class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        this.setState({ errorInfo });
        console.error(`[ErrorBoundary${this.props.label ? ` — ${this.props.label}` : ''}]`, error, errorInfo);
    }

    handleReset = () => {
        this.setState({ hasError: false, error: null, errorInfo: null });
    };

    render() {
        if (this.state.hasError) {
            const isDark = this.props.isDarkMode;
            const label = this.props.label || 'This section';

            return (
                <div
                    className={`w-full rounded-2xl border p-8 flex flex-col items-center justify-center gap-4 text-center ${
                        isDark
                            ? 'bg-red-900/10 border-red-500/30 text-red-200'
                            : 'bg-red-50 border-red-200 text-red-800'
                    }`}
                >
                    <div className="text-4xl">⚠️</div>
                    <h3 className="text-lg font-bold">{label} encountered an error</h3>
                    <p className={`text-sm max-w-md ${isDark ? 'text-red-300/70' : 'text-red-600/80'}`}>
                        Something went wrong while rendering this component. Your progress is safe — click
                        the button below to reload this section.
                    </p>
                    {this.state.error && (
                        <code
                            className={`text-[11px] px-3 py-1.5 rounded-lg max-w-lg truncate ${
                                isDark ? 'bg-red-900/30 text-red-400' : 'bg-red-100 text-red-700'
                            }`}
                        >
                            {String(this.state.error.message || this.state.error).slice(0, 200)}
                        </code>
                    )}
                    <button
                        onClick={this.handleReset}
                        className={`mt-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all hover:scale-105 active:scale-95 ${
                            isDark
                                ? 'bg-red-500/20 text-red-300 hover:bg-red-500/30 border border-red-500/30'
                                : 'bg-red-100 text-red-700 hover:bg-red-200 border border-red-200'
                        }`}
                    >
                        🔄 Try Again
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
