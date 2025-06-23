# COA Generator

A professional Certificate of Analysis (COA) generator for cannabis testing labs. Built with Next.js, React, and TypeScript.

## Features

- 🌿 Generate single or batch COAs with custom cannabinoid profiles
- 🧪 Multiple product types (flower, concentrate, vaporizer, edible, beverage)
- 📊 THCA compliance mode for hemp products
- 🎨 Professional PDF export with print support
- 📦 Batch export to ZIP files
- ⚡ Real-time preview and editing

## Architecture

The codebase has been completely refactored for maintainability and scalability:

### Directory Structure

```
src/
├── app/              # Next.js app directory
├── components/       # React components
│   ├── COAActions    # Export and navigation controls
│   ├── COAControls   # Form inputs and generation controls
│   ├── COAForm       # Advanced editing form
│   └── COATemplate   # Certificate template
├── constants/        # Application constants
├── hooks/           # Custom React hooks
│   ├── useCOAGeneration  # COA generation logic
│   └── useCOAExport      # Export functionality
├── types/           # TypeScript type definitions
└── utils/           # Utility functions
    ├── cannabinoidGeneration
    ├── coaDataGeneration
    ├── colorConversion
    ├── dateUtils
    ├── errorHandling
    └── idGeneration
```

### Key Improvements

1. **Modular Architecture**: Broke down the 1,400+ line page component into focused, reusable modules
2. **Type Safety**: Comprehensive TypeScript interfaces for all data structures
3. **Error Handling**: Robust error handling with user-friendly messages
4. **Performance**: Optimized color conversion and memoized calculations
5. **Constants**: Extracted all magic numbers into well-documented constants
6. **Custom Hooks**: Business logic separated from UI components
7. **Utilities**: Reusable functions for common operations

## Getting Started

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

## Usage

1. Select single strain or multi-strain batch mode
2. Enter strain name(s) and test date
3. Choose product type and cannabinoid profile
4. Click "Generate COA" to create the certificate
5. Toggle between Preview and Edit modes
6. Export as PDF or print directly

## Configuration

### Product Types
- Flower (1.0x multiplier)
- Concentrate (2.5x multiplier)
- Vaporizer (3.0x multiplier)
- Edible (0.1x multiplier)
- Beverage (0.05x multiplier)

### Cannabinoid Profiles
- High THC (20-30% THCA)
- Medium THC (10-20% THCA)
- Low THC (1-10% THCA)
- Hemp/CBD (<0.3% total THC)
- Decarbed (high D9-THC)

## Technical Details

- **Framework**: Next.js 15 with App Router
- **Styling**: Tailwind CSS 4.0
- **PDF Generation**: jsPDF with html2canvas
- **Type Safety**: TypeScript 5.x
- **Export**: React-to-print for printing

## Browser Compatibility

- Chrome/Edge: Full support
- Firefox: Full support
- Safari: Full support (with color conversion fallbacks)

## License

Private project - all rights reserved.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
