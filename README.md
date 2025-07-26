# Document Management System

A modern, AI-powered document management application built with React, TypeScript, and Tailwind CSS.

## ✨ Features

### 📤 File Upload
- **Drag & Drop Interface**: Intuitive file upload with visual feedback
- **Multiple File Support**: Upload PDFs, Word documents, images, and text files
- **Progress Tracking**: Real-time upload progress for each file
- **File Validation**: Size limits and type checking

### 📋 Document Library
- **Smart Search**: Search across filenames, summaries, and classifications
- **Advanced Filtering**: Filter by status (uploaded/processing/failed) and file type
- **Responsive Table**: Clean, mobile-friendly file listing
- **Quick Actions**: View details, download, and delete files

### 🤖 AI-Powered Analysis
- **Automatic Summarization**: AI-generated summaries for uploaded documents
- **Document Classification**: Intelligent categorization (Invoice, Contract, Letter, etc.)
- **Confidence Scoring**: Visual confidence indicators for AI predictions
- **Content Extraction**: Preview extracted text content

### 💬 Feedback System
- **Correction Interface**: Users can report incorrect summaries or classifications
- **Continuous Learning**: Feedback helps improve AI model accuracy
- **Simple Forms**: Easy-to-use correction forms

### 📊 Analytics Dashboard
- **Real-time Metrics**: Total files, success rates, processing times
- **System Health**: Processing queue and performance indicators
- **Visual Charts**: Progress bars and status indicators
- **Today's Activity**: Current day upload statistics

### 🎨 Modern UI/UX
- **Professional Design**: Clean, dashboard-like interface
- **Status Indicators**: Color-coded badges for file status
- **Responsive Layout**: Works on desktop, tablet, and mobile
- **Toast Notifications**: Success/error feedback
- **Loading States**: Skeleton loaders and progress indicators

## 🛠️ Tech Stack

- **React 18** - Modern React with hooks and suspense
- **TypeScript** - Type-safe development
- **Vite** - Fast build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - High-quality UI components
- **Radix UI** - Accessible component primitives
- **React Query** - Data fetching and caching
- **Axios** - HTTP client for API calls
- **React Dropzone** - File upload interface
- **Lucide React** - Beautiful icons

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd document-management-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Update `.env` with your API configuration:
   ```env
   VITE_API_BASE_URL=https://your-api-endpoint.com
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Open in browser**
   Navigate to `http://localhost:8080`

## 📡 API Integration

The app expects the following API endpoints:

### File Management
- `POST /upload` - Upload files with multipart form data
- `GET /files` - List all files with optional filtering
- `GET /files/{file_id}` - Get detailed file information
- `DELETE /files/{file_id}` - Delete a file

### Analytics
- `GET /metrics` - Get system metrics and analytics

### Feedback
- `POST /feedback` - Submit user feedback for AI improvements

### API Response Examples

**File Upload Response:**
```json
{
  "id": "file_123",
  "filename": "invoice.pdf",
  "status": "uploaded",
  "timestamp": "2024-07-26T10:30:00Z",
  "size": 2048000,
  "type": "application/pdf"
}
```

**File Details Response:**
```json
{
  "id": "file_123",
  "filename": "invoice.pdf",
  "status": "uploaded",
  "timestamp": "2024-07-26T10:30:00Z",
  "summary": "Monthly invoice for cloud services totaling $1,234.56",
  "classification": "Invoice",
  "confidence": 0.95,
  "size": 2048000,
  "type": "application/pdf",
  "content": "Invoice content...",
  "metadata": {},
  "processingTime": 12.5
}
```

## 🏗️ Project Structure

```
src/
├── components/           # Reusable React components
│   ├── ui/              # shadcn/ui components
│   ├── Dashboard.tsx    # Main dashboard layout
│   ├── FileUpload.tsx   # File upload component
│   ├── FileList.tsx     # File listing and search
│   ├── FileDetailsModal.tsx  # File details popup
│   ├── FeedbackForm.tsx # User feedback form
│   └── AnalyticsDashboard.tsx # Analytics visualization
├── lib/                 # Utility functions and API
│   ├── api.ts          # API client and types
│   └── utils.ts        # Helper functions
├── hooks/              # Custom React hooks
├── pages/              # Page components
├── index.css           # Global styles and design system
└── main.tsx            # App entry point
```

## 🎨 Design System

The app uses a comprehensive design system with:

- **Semantic Color Tokens**: HSL-based color system for consistency
- **Custom Gradients**: Beautiful gradient backgrounds
- **Shadow System**: Soft, medium, and strong shadows
- **Status Colors**: Success (green), warning (yellow), error (red), processing (blue)
- **Responsive Design**: Mobile-first approach
- **Accessibility**: WCAG compliant components

## 🔧 Customization

### Adding New File Types
Update the `accept` prop in `FileUpload.tsx`:
```typescript
accept: {
  'application/pdf': ['.pdf'],
  'application/msword': ['.doc'],
  // Add new types here
}
```

### Modifying API Endpoints
Update the base URL and endpoints in `src/lib/api.ts`:
```typescript
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://api.example.com';
```

### Customizing UI Theme
Modify the design tokens in `src/index.css`:
```css
:root {
  --primary: 221 83% 53%;    /* Your brand color */
  --success: 142 76% 36%;    /* Success color */
  /* Add custom colors */
}
```

## 📱 Features in Detail

### File Upload
- Drag and drop multiple files
- Real-time progress tracking
- File type validation
- Size limit enforcement (10MB default)
- Error handling and retry

### Document Analysis
- AI-powered summarization
- Document classification with confidence scores
- Content extraction and preview
- Metadata parsing

### Search & Filter
- Full-text search across all fields
- Status filtering (uploaded/processing/failed)
- File type filtering
- Real-time results

### Analytics
- Total files processed
- Success rate monitoring
- Average processing time
- Today's activity summary
- System health indicators

## 🧪 Development

### Available Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Mock Data
The app includes mock data for development when the API is not available. See `src/lib/api.ts` for mock responses.

## 📦 Deployment

### Build for Production
```bash
npm run build
```

The built files will be in the `dist/` directory.

### Environment Variables
Set these in your deployment environment:
- `VITE_API_BASE_URL` - Your API base URL
- `VITE_AUTH_TOKEN` - Optional authentication token

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Check the documentation
- Open an issue on GitHub
- Contact the development team

---

Built with ❤️ using modern web technologies