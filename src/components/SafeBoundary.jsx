import React from "react";

/** Class-based error boundary (hooks-safe) */
export default class SafeBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, err: null };
  }
  static getDerivedStateFromError(err) {
    return { hasError: true, err };
  }
  componentDidCatch(err, info) {
    console.error("[ND SafeBoundary]", this.props.name || "panel", err, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="rounded-xl border p-3 bg-red-50 text-sm text-red-700">
          {this.props.fallback ||
            `This panel crashed (${this.props.name || "panel"}). Check console.`}
        </div>
      );
    }
    return this.props.children;
  }
}
