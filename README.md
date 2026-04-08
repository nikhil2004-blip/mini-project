<div align="center">
  
  <br />
  
  <h1>🌌 CI Observability Dashboard</h1>
  <p><strong>Next-Gen GitHub Actions Intelligence & Monitoring</strong></p>

  <p>
    <img src="https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white" alt="Next.js" />
    <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
    <img src="https://img.shields.io/badge/Groq_AI-F55036?style=for-the-badge&logo=meta&logoColor=white" alt="Groq AI" />
    <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React" />
  </p>

  <br />
</div>

## ⚡ Overview

The **CI Observability Dashboard** is a zero-config, real-time monitoring platform built to bring deep visibility into your GitHub Actions pipelines. Wrapped in a premium "Night Tech" UI, it automatically identifies bottlenecks, exposes flaky tests, and provides AI-driven natural language summaries of pipeline failures.

No databases. No complex setups. Just paste an access token and get instant insights into any public or private repository.

## ✨ Core Capabilities

*   🧠 **AI-Powered Diagnostics**: Integrates seamlessly with **Groq AI (Llama 3)** to read your failed workflow logs and explain exactly *why* a build failed, offering actionable fix recommendations.
*   📉 **Anomaly Detection**: Generates a rolling baseline of your workflow durations. If a pipeline suddenly takes 15% longer than usual, it gets instantly flagged.
*   ⚡ **Flakiness Tracker**: Automatically hunts down jobs that exhibit "flip-flop" behavior (alternating pass/fail states on the same branch) and exposes them before they break production.
*   🔄 **Real-Time Synchronization**: Pulls live telemetry directly from the GitHub REST API.
*   🛡️ **Privacy-First Architecture**: Your Personal Access Token (PAT) never leaves your browser. It is securely stored in `localStorage` and injected strictly into outbound API calls.

## 🚀 Quick Start

Getting started takes less than 60 seconds.

### Prerequisites
1.  **Node.js 18+** installed.
2.  A **[GitHub Personal Access Token (PAT)](https://github.com/settings/tokens)**. 
    *   *Note: Only the `repo` scope is required.*
3.  A **[Groq API Key](https://console.groq.com/)** (Completely free).

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/nikhil2004-blip/mini-project.git
   cd mini-project
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment:**
   Copy the example environment file and add your Groq API key:
   ```bash
   cp .env.example .env.local
   ```
   *Edit `.env.local` to include your `GROQ_API_KEY`.*

4. **Ignite the server:**
   ```bash
   npm run dev
   ```

5. **Access the platform:** Navigate to `http://localhost:3000` in your browser. Click "Connect GitHub", provide your PAT, and select your repository!

## 🏗️ Technical Architecture

*   **Framework**: Next.js 14+ (App Router)
*   **Styling**: Pure CSS (Custom "Night Tech" Design System)
*   **Icons**: Lucide React
*   **Data Visualization**: Recharts
*   **AI Engine**: Groq SDK + Llama 3 API

## 🔒 Security Posture

*   **Zero Server Storage:** The Next.js backend operates purely as a stateless proxy to bypass CORS and inject the hidden AI API key. It never logs or saves your GitHub credentials.
*   **Token Isolation:** Authentication relies exclusively on the token provided during the current browser session. 
*   **HTTPS Enforcement:** All traffic between the client, backend, and GitHub APIs is TLS-encrypted.

## 🤝 Contributing

Contributions, issues, and feature requests are highly welcome! Feel free to check the issues page and open a Pull Request.

---
<div align="center">
  <i>Built with precision for developers who care about their pipelines.</i>
</div>
