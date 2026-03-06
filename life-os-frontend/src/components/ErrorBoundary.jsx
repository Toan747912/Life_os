import React from 'react';

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
        console.error("ErrorBoundary caught an error", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="p-8 bg-red-50 text-red-800 m-8 rounded-xl border border-red-200">
                    <h2 className="text-2xl font-bold mb-4">Something went wrong!</h2>
                    <div className="bg-white p-4 rounded border font-mono text-sm whitespace-pre-wrap overflow-auto">
                        {this.state.error && this.state.error.toString()}
                        <br />
                        {this.state.errorInfo?.componentStack}
                    </div>
                </div>
            );
        }
        return this.props.children;
    }
}

export default ErrorBoundary;
