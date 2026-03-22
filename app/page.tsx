'use client';

import { useState } from 'react';

const FILE_EXT_ICONS: Record<string, string> = {
  '.pdf':  'bi-file-earmark-pdf',
  '.mp3':  'bi-file-earmark-music',
  '.wav':  'bi-file-earmark-music',
  '.flac': 'bi-file-earmark-music',
  '.ogg':  'bi-file-earmark-music',
  '.mp4':  'bi-file-earmark-play',
  '.avi':  'bi-file-earmark-play',
  '.mkv':  'bi-file-earmark-play',
  '.mov':  'bi-file-earmark-play',
  '.zip':  'bi-file-earmark-zip',
  '.gz':   'bi-file-earmark-zip',
  '.tar':  'bi-file-earmark-zip',
  '.epub': 'bi-book',
  '.txt':  'bi-file-earmark-text',
  '.jpg':  'bi-file-earmark-image',
  '.jpeg': 'bi-file-earmark-image',
  '.png':  'bi-file-earmark-image',
  '.gif':  'bi-file-earmark-image',
  '.djvu': 'bi-file-earmark-richtext',
  '.html': 'bi-file-earmark-code',
  '.xml':  'bi-file-earmark-code',
};

const FILE_EXT_COLORS: Record<string, string> = {
  '.pdf':     'text-red-500',
  '.torrent': 'text-green-500',
  '.zip':     'text-orange-500',
  '.gz':      'text-orange-500',
  '.tar':     'text-orange-500',
};

function getExtIcon(filename: string) {
  const ext = '.' + filename.split('.').pop()?.toLowerCase();
  return FILE_EXT_ICONS[ext] ?? 'bi-file-earmark';
}

function getExtColor(filename: string) {
  const ext = '.' + filename.split('.').pop()?.toLowerCase();
  return FILE_EXT_COLORS[ext] ?? 'text-blue-500';
}

function formatSize(bytes: number) {
  if (!bytes || !isFinite(bytes) || bytes <= 0 || bytes > 1e13) return '—';
  if (bytes < 1024) return `${bytes.toFixed(2)} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

export default function Home() {
  const [url, setUrl] = useState('');
  const [extensions, setExtensions] = useState<string[]>([]);
  const [extensionCounts, setExtensionCounts] = useState<Record<string, number>>({});
  const [files, setFiles] = useState<any[]>([]);
  const [selectedExtensions, setSelectedExtensions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState('');
  const [showZipNameInput, setShowZipNameInput] = useState(false);
  const [zipName, setZipName] = useState('downloaded-files');

  const fetchExtensions = async () => {
    if (!url) return;
    setLoading(true);
    setError('');
    setExtensions([]);
    setFiles([]);
    setSelectedExtensions([]);
    try {
      const response = await fetch('/api/fetch-extensions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });
      const data = await response.json();
      setExtensions(data.extensions);
      setExtensionCounts(data.extensionCounts || {});
      setFiles(data.files);
    } catch {
      setError("Impossible de récupérer les fichiers. Vérifiez l'URL et réessayez.");
    }
    setLoading(false);
  };

  const toggleExtension = (ext: string) => {
    setSelectedExtensions(prev =>
      prev.includes(ext) ? prev.filter(e => e !== ext) : [...prev, ext]
    );
  };

  const selectedFiles = files.filter(file => {
    const ext = '.' + file.name.split('.').pop();
    return selectedExtensions.includes(ext);
  });

  const downloadFile = async (file: any) => {
    try {
      const proxyUrl = `/api/proxy?fileUrl=${encodeURIComponent(file.url)}`;
      const response = await fetch(proxyUrl);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const blob = await response.blob();
      const dlUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = dlUrl;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(dlUrl);
      document.body.removeChild(a);
    } catch (err: any) {
      alert(`Impossible de télécharger ${file.name} : ${err.message}`);
    }
  };

  const downloadAllAsZip = async () => {
    if (selectedExtensions.length === 0) return;
    setDownloading(true);
    setShowZipNameInput(false);
    try {
      const response = await fetch('/api/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, selectedExtensions }),
      });
      if (response.ok) {
        const blob = await response.blob();
        const dlUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = dlUrl;
        a.download = `${zipName.trim() || 'downloaded-files'}.zip`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(dlUrl);
        document.body.removeChild(a);
      } else {
        alert('Échec du téléchargement');
      }
    } catch {
      alert('Échec du téléchargement');
    }
    setDownloading(false);
  };

  const totalSelectedSize = selectedFiles.reduce((sum, f) => sum + (f.size || 0), 0);

  return (
    <div className="min-h-screen bg-gray-100 text-gray-900">

      {/* ── Header ── */}
      <header className="border-b border-gray-200 bg-white/80 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
            <i className="bi bi-cloud-arrow-down text-xl text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight flex items-center gap-2 text-gray-900">
              Internet Archive Downloader
            </h1>
            <p className="text-xs text-gray-500">Téléchargez des fichiers depuis archive.org</p>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-10 space-y-8">

        {/* ── Source URL ── */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-4 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-widest flex items-center gap-2">
            <i className="bi bi-link-45deg text-blue-500 text-base" />
            Source
          </h2>
          <div className="flex gap-3">
            <input
              type="text"
              placeholder="https://archive.org/details/..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchExtensions()}
              className="flex-1 bg-white border border-gray-300 rounded-xl px-4 py-3 text-sm placeholder:text-gray-400 focus:outline-none focus:border-blue-500 transition-all"
            />
            <button
              onClick={fetchExtensions}
              disabled={loading || !url}
              suppressHydrationWarning
              className="bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white px-6 py-3 rounded-xl text-sm font-semibold transition-all shadow-lg shadow-blue-500/20 flex items-center gap-2 whitespace-nowrap"
            >
              {loading
                ? <><i className="bi bi-arrow-repeat animate-spin" /> Chargement...</>
                : <><i className="bi bi-search" /> Analyser</>}
            </button>
          </div>
          {error && (
            <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3">
              <i className="bi bi-exclamation-triangle-fill" /> {error}
            </div>
          )}
        </div>

        {/* ── Types de fichiers ── */}
        {extensions.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                <i className="bi bi-funnel text-indigo-500 text-base" />
                Types de fichiers
              </h2>
              <span className="text-xs text-gray-400">
                <i className="bi bi-layers mr-1" />
                {extensions.length} types trouvés
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {extensions.map(ext => {
                const active = selectedExtensions.includes(ext);
                const iconClass = FILE_EXT_ICONS[ext] ?? 'bi-file-earmark';
                return (
                  <button
                    key={ext}
                    onClick={() => toggleExtension(ext)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all border flex items-center gap-1.5 ${
                      active
                        ? 'bg-blue-600 border-blue-500 text-white shadow-md shadow-blue-500/20'
                        : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                  >
                    <i className={`bi ${iconClass}`} />
                    {ext}
                    <span className={`ml-1 text-xs px-1.5 py-0.5 rounded-full ${active ? 'bg-white/25' : 'bg-gray-200 text-gray-500'}`}>
                      {extensionCounts[ext] ?? 0}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Fichiers sélectionnés ── */}
        {selectedFiles.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div>
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                  <i className="bi bi-list-check text-emerald-500 text-base" />
                  Fichiers sélectionnés
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  <i className="bi bi-files mr-1" />
                  {selectedFiles.length} fichier{selectedFiles.length > 1 ? 's' : ''}
                  <span className="mx-1.5 text-gray-300">·</span>
                  <i className="bi bi-hdd mr-1" />
                  {formatSize(totalSelectedSize)}
                </p>
              </div>
              {showZipNameInput ? (
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <i className="bi bi-pencil absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none" />
                    <input
                      autoFocus
                      type="text"
                      value={zipName}
                      onChange={(e) => setZipName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && downloadAllAsZip()}
                      placeholder="Nom du fichier ZIP"
                      className="bg-gray-50 border border-gray-300 rounded-xl pl-8 pr-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-emerald-500 w-52 transition-all"
                    />
                  </div>
                  <button
                    onClick={downloadAllAsZip}
                    disabled={downloading}
                    className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-md shadow-emerald-500/20 flex items-center gap-2 whitespace-nowrap"
                  >
                    {downloading
                      ? <><i className="bi bi-arrow-repeat animate-spin" /> Téléchargement...</>
                      : <><i className="bi bi-download" /> Confirmer</>}
                  </button>
                  <button
                    onClick={() => setShowZipNameInput(false)}
                    className="text-gray-400 hover:text-gray-600 px-2 py-2.5 rounded-xl transition-colors"
                    title="Annuler"
                  >
                    <i className="bi bi-x-lg" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowZipNameInput(true)}
                  disabled={downloading}
                  className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-md shadow-emerald-500/20 flex items-center gap-2"
                >
                  <i className="bi bi-file-earmark-zip" /> Tout en ZIP
                </button>
              )}
            </div>

            <div className="divide-y divide-gray-100 max-h-[480px] overflow-y-auto">
              {selectedFiles.map(file => (
                <div
                  key={file.name}
                  className="flex items-center gap-4 px-6 py-3.5 hover:bg-gray-50 transition-colors group"
                >
                  <i className={`bi ${getExtIcon(file.name)} text-2xl ${getExtColor(file.name)} flex-shrink-0`} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-800 truncate">{file.name}</div>
                    <div className="text-xs text-gray-400 flex items-center gap-1">
                      <i className="bi bi-hdd" /> {formatSize(file.size)}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <a
                      href={file.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:text-blue-700 px-3 py-1.5 rounded-lg border border-blue-200 hover:border-blue-400 transition-all flex items-center gap-1"
                    >
                      <i className="bi bi-box-arrow-up-right" /> URL
                    </a>
                    <button
                      onClick={() => downloadFile(file)}
                      className="text-xs text-white bg-blue-600 hover:bg-blue-500 px-3 py-1.5 rounded-lg transition-all flex items-center gap-1"
                    >
                      <i className="bi bi-download" /> Télécharger
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── État vide ── */}
        {!loading && extensions.length === 0 && (
          <div className="text-center py-24 text-gray-300 space-y-4">
            <i className="bi bi-cloud-arrow-down text-7xl block" />
            <p className="text-lg font-medium text-gray-400">Entrez une URL Internet Archive pour commencer</p>
            <p className="text-sm flex items-center justify-center gap-1 text-gray-400">
              <i className="bi bi-info-circle" />
              Ex : https://archive.org/details/nasa
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
