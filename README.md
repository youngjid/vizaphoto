# VizaPhoto - Passport Photo Generator

VizaPhoto is a modern web application built with Next.js that helps users generate compliant passport and visa photos for various countries. The application provides a streamlined process for uploading, editing, and downloading photos that meet specific country requirements.

## Features

### Current Features
- **Country Selection**: Choose from a list of countries with their specific photo requirements
- **Photo Upload**: Upload photos with support for various image formats
- **Background Removal**: Automatic background removal using fal-ai API
- **Photo Editing**: 
  - Automatic size adjustment based on country requirements
  - Face detection and positioning
  - Grid overlay for proper alignment
- **Download Options**:
  - Multiple photo layouts (1x1, 2x2, 4x4)
  - High-quality JPG output
  - Proper sizing for printing

### Technical Stack
- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS with custom animations
- **UI Components**: Radix UI primitives
- **Image Processing**: Sharp, fal-ai API
- **Form Handling**: React Hook Form with Zod validation
- **State Management**: React Context API

## Project Structure
```
├── app/                 # Next.js app router pages
├── components/          # Reusable React components
├── context/            # React context providers
├── data/               # Static data (country specifications)
├── lib/                # Utility functions and helpers
├── public/             # Static assets
├── styles/             # Global styles and Tailwind config
└── hooks/              # Custom React hooks
```

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env.local` file with your API keys:
   ```
   NEXT_PUBLIC_FAL_KEY=your_fal_ai_key
   ```
4. Run the development server:
   ```bash
   npm run dev
   ```

## Future Enhancements

### Planned Features
1. **Enhanced Face Detection**:
   - More accurate face detection and alignment
   - Automatic face position validation
   - Multiple face detection and warning

2. **Photo Quality Checks**:
   - Automatic brightness and contrast validation
   - Resolution and quality checks
   - Background color validation

3. **User Experience**:
   - Save and load previous photos
   - Multiple photo batch processing
   - Mobile app version

4. **Additional Features**:
   - Payment integration for premium features
   - Photo printing service integration
   - AI-powered photo enhancement

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details. 