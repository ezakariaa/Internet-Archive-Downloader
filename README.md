# Internet Archive Downloader

A React TypeScript application built with Next.js that allows users to download files from Internet Archive items.

## Features

- Input an Internet Archive URL (e.g., https://archive.org/details/identifier)
- Automatically fetch available file extensions from the item
- Select desired file extensions
- Download selected files as a ZIP archive

## Getting Started

First, install dependencies:

```bash
npm install
```

Then, run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to use the app.

## Build

To build the project:

```bash
npm run build
```

## Usage

1. Enter the URL of an Internet Archive item (e.g., https://archive.org/details/example)
2. Click "Fetch Extensions" to retrieve available file types
3. Select the extensions you want to download
4. Click "Download" to get a ZIP file containing the selected files

## Technologies

- Next.js
- React
- TypeScript
- Tailwind CSS
- Archiver (for ZIP creation)
